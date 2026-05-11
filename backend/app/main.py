from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.auth import router as auth_router
from app.api.routes.health import router as health_router
from app.api.routes.movements import router as movements_router
from app.api.routes.review import router as review_router
from app.config import settings
from app.database import ensure_storage_dirs, start_database_initialization_in_background


@asynccontextmanager
async def lifespan(_: FastAPI):
    ensure_storage_dirs()
    start_database_initialization_in_background()
    yield


app = FastAPI(title=settings.app_name, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(auth_router)
app.include_router(movements_router)
app.include_router(review_router)
