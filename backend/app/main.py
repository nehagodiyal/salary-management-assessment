from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.logger import configure_logging, get_logger
from app.middleware.error_handler import register_exception_handlers
from app.middleware.logging_middleware import RequestLoggingMiddleware
from app.middleware.request_id import RequestIdMiddleware

configure_logging()
logger = get_logger("app.startup")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(
        "Starting %s v%s (env=%s)",
        settings.APP_NAME,
        settings.APP_VERSION,
        settings.APP_ENV,
    )
    yield
    logger.info("Shutting down %s", settings.APP_NAME)


def create_app() -> FastAPI:
    """Application factory — used by uvicorn and tests."""
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        debug=settings.DEBUG,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
        lifespan=lifespan,
    )

    # Order matters: outermost middleware runs first on request, last on response.
    # RequestId must be first so the id is bound before logging runs.
    app.add_middleware(RequestLoggingMiddleware)
    app.add_middleware(RequestIdMiddleware)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)

    @app.get("/health", tags=["health"])
    def health():
        return {
            "status": "ok",
            "app": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "env": settings.APP_ENV,
        }

    app.include_router(api_router, prefix=settings.API_V1_PREFIX)
    return app


app = create_app()
