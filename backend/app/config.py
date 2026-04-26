import os
from pathlib import Path


def _normalize_external_url(value: str) -> str:
    normalized = value.strip().rstrip("/")

    if normalized.startswith(("http://", "https://")):
        return normalized

    return f"https://{normalized}"


def _parse_cors_allowed_origins() -> list[str]:
    raw_value = os.getenv(
        "CORS_ALLOWED_ORIGINS",
        os.getenv("FRONTEND_ORIGIN", "http://localhost:5173"),
    )

    return [
        _normalize_external_url(origin)
        for origin in raw_value.split(",")
        if origin.strip()
    ]


def _normalize_database_url(value: str) -> str:
    normalized = value.strip()

    if normalized.startswith("postgres://"):
        normalized = normalized.replace("postgres://", "postgresql://", 1)

    if normalized.startswith("postgresql://") and not normalized.startswith(
        "postgresql+"
    ):
        normalized = normalized.replace("postgresql://", "postgresql+psycopg://", 1)

    return normalized


class Settings:
    app_name: str = os.getenv("APP_NAME", "Cuentas Claras API")
    app_env: str = os.getenv("APP_ENV", "development")
    backend_port: int = int(os.getenv("PORT", os.getenv("BACKEND_PORT", "8000")))
    cors_allowed_origins: list[str] = _parse_cors_allowed_origins()
    postgres_host: str = os.getenv("POSTGRES_HOST", "postgres")
    postgres_port: int = int(os.getenv("POSTGRES_PORT", "5432"))
    postgres_db: str = os.getenv("POSTGRES_DB", "cuentas_claras")
    postgres_user: str = os.getenv("POSTGRES_USER", "cuentas_claras_user")
    postgres_password: str = os.getenv("POSTGRES_PASSWORD", "change_me")
    auth_secret_key: str = os.getenv(
        "AUTH_SECRET_KEY",
        "change-this-staging-secret-before-deploy",
    )
    auth_token_expire_minutes: int = int(
        os.getenv("AUTH_TOKEN_EXPIRE_MINUTES", "720")
    )
    auth_password_iterations: int = int(
        os.getenv("AUTH_PASSWORD_ITERATIONS", "390000")
    )
    database_url: str = _normalize_database_url(
        os.getenv(
            "DATABASE_URL",
            (
                f"postgresql+psycopg://{postgres_user}:{postgres_password}"
                f"@{postgres_host}:{postgres_port}/{postgres_db}"
            ),
        )
    )
    support_storage_path: str = os.getenv(
        "SUPPORT_STORAGE_PATH",
        os.getenv(
            "SUPPORT_UPLOAD_DIR",
            str(Path("storage") / "supports"),
        ),
    )
    support_upload_dir: str = support_storage_path


settings = Settings()
