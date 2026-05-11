import logging
import time
from collections.abc import Generator
from pathlib import Path

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings


class Base(DeclarativeBase):
    pass


logger = logging.getLogger(__name__)

engine = create_engine(
    settings.database_url,
    future=True,
    pool_pre_ping=True,
    connect_args={"connect_timeout": 10},
)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def create_db_and_tables() -> None:
    from app.models import Movement, Support, User

    Base.metadata.create_all(bind=engine)
    ensure_movement_review_columns()
    ensure_movement_user_column()
    ensure_support_demo_columns()


def initialize_database(max_attempts: int = 6, delay_seconds: int = 2) -> None:
    for attempt in range(1, max_attempts + 1):
        try:
            create_db_and_tables()
            logger.info("Database initialization completed on attempt %s.", attempt)
            return
        except Exception:
            logger.exception(
                "Database initialization failed on attempt %s of %s.",
                attempt,
                max_attempts,
            )
            if attempt == max_attempts:
                raise

            time.sleep(delay_seconds)


def ensure_storage_dirs() -> None:
    if settings.support_storage_mode == "mock":
        return

    Path(settings.support_storage_path).mkdir(parents=True, exist_ok=True)


def ensure_movement_review_columns() -> None:
    inspector = inspect(engine)

    if "movements" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("movements")}

    with engine.begin() as connection:
        if "review_status" not in columns:
            connection.execute(
                text(
                    "ALTER TABLE movements "
                    "ADD COLUMN review_status VARCHAR(20) NOT NULL DEFAULT 'pending'"
                )
            )

        if "review_note" not in columns:
            connection.execute(
                text("ALTER TABLE movements ADD COLUMN review_note VARCHAR(500) NULL")
            )


def ensure_movement_user_column() -> None:
    inspector = inspect(engine)

    if "movements" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("movements")}

    if "user_id" in columns:
        return

    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE movements ADD COLUMN user_id INTEGER NULL"))


def ensure_support_demo_columns() -> None:
    inspector = inspect(engine)

    if "supports" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("supports")}

    with engine.begin() as connection:
        if "is_mock" not in columns:
            connection.execute(
                text(
                    "ALTER TABLE supports "
                    "ADD COLUMN is_mock BOOLEAN NOT NULL DEFAULT FALSE"
                )
            )

        if "mock_note" not in columns:
            connection.execute(
                text("ALTER TABLE supports ADD COLUMN mock_note VARCHAR(255) NULL")
            )


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
