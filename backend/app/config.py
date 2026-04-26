import os
from pathlib import Path


class Settings:
    app_name: str = os.getenv("APP_NAME", "Cuentas Claras API")
    app_env: str = os.getenv("APP_ENV", "development")
    backend_port: int = int(os.getenv("BACKEND_PORT", "8000"))
    frontend_origin: str = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
    postgres_host: str = os.getenv("POSTGRES_HOST", "postgres")
    postgres_port: int = int(os.getenv("POSTGRES_PORT", "5432"))
    postgres_db: str = os.getenv("POSTGRES_DB", "cuentas_claras")
    postgres_user: str = os.getenv("POSTGRES_USER", "cuentas_claras_user")
    postgres_password: str = os.getenv("POSTGRES_PASSWORD", "change_me")
    database_url: str = os.getenv(
        "DATABASE_URL",
        (
            f"postgresql+psycopg://{postgres_user}:{postgres_password}"
            f"@{postgres_host}:{postgres_port}/{postgres_db}"
        ),
    )
    support_upload_dir: str = os.getenv(
        "SUPPORT_UPLOAD_DIR",
        str(Path("storage") / "supports"),
    )


settings = Settings()
