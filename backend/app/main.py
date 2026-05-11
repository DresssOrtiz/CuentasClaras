import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import start_database_initialization_in_background


logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger(__name__)

print("BOOT: app.main import started", flush=True)
logger.info("BOOT: app.main import started")

app = FastAPI(title=settings.app_name)

print("BOOT: FastAPI app created", flush=True)
logger.info("BOOT: FastAPI app created")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("BOOT: CORS middleware configured", flush=True)
logger.info("BOOT: CORS middleware configured")


def mount_routes() -> None:
    print("BOOT: importing route modules", flush=True)
    logger.info("BOOT: importing route modules")

    from app.api.routes.auth import router as auth_router
    from app.api.routes.health import router as health_router
    from app.api.routes.movements import router as movements_router
    from app.api.routes.review import router as review_router

    print("BOOT: route modules imported", flush=True)
    logger.info("BOOT: route modules imported")

    app.include_router(health_router)
    print("BOOT: health endpoint ready", flush=True)
    logger.info("BOOT: health endpoint ready")

    app.include_router(auth_router)
    app.include_router(movements_router)
    app.include_router(review_router)

    print("BOOT: all routes mounted", flush=True)
    logger.info("BOOT: all routes mounted")


mount_routes()


@app.on_event("startup")
async def startup_event() -> None:
    print("BOOT: startup executed", flush=True)
    logger.info("BOOT: startup executed")
    start_database_initialization_in_background()
    print("BOOT: background database initialization requested", flush=True)
    logger.info("BOOT: background database initialization requested")
