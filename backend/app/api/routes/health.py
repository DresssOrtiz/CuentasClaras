from fastapi import APIRouter

from app.config import settings
from app.database import get_database_initialization_state

router = APIRouter()


@router.get("/health")
def health() -> dict[str, str | bool | None]:
    db_state = get_database_initialization_state()

    return {
        "status": "ok",
        "service": settings.app_name,
        "message": "API running",
        "database_initialized": db_state["initialized"],
        "database_initializing": db_state["initializing"],
        "database_last_error": db_state["last_error"],
    }
