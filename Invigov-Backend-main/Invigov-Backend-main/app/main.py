import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.v1.router import api_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: no asyncio background tasks — scheduling is handled by the
    # separate scheduler.py process which enqueues RQ jobs via Redis.
    logger.info(
        "FastAPI startup complete. "
        "Notification scheduling is handled by the external scheduler process."
    )
    yield
    # Shutdown: nothing to cancel.


app = FastAPI(
    title="SAM.gov Automation Platform",
    version="1.0.0",
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url=None,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


@app.get("/api/v1/health")
async def health_check():
    from app.core.health import check_health
    return await check_health()
