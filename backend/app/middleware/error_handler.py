from fastapi import FastAPI, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.exceptions import AppException
from app.core.logger import get_logger, request_id_ctx

logger = get_logger("app.errors")


def _envelope(
    *,
    status_code: int,
    error_code: str,
    message: str,
    details=None,
) -> JSONResponse:
    body = {
        "error": {
            "code": error_code,
            "message": message,
            "request_id": request_id_ctx.get(),
        }
    }
    if details is not None:
        body["error"]["details"] = jsonable_encoder(details)
    return JSONResponse(status_code=status_code, content=body)


def register_exception_handlers(app: FastAPI) -> None:
    """Register a uniform error envelope across all exception types."""

    @app.exception_handler(AppException)
    async def _handle_app_exception(_: Request, exc: AppException) -> JSONResponse:
        logger.warning("AppException: %s (%s)", exc.message, exc.error_code)
        return _envelope(
            status_code=exc.status_code,
            error_code=exc.error_code,
            message=exc.message,
            details=exc.details,
        )

    @app.exception_handler(RequestValidationError)
    async def _handle_validation(_: Request, exc: RequestValidationError) -> JSONResponse:
        return _envelope(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            error_code="VALIDATION_ERROR",
            message="Request validation failed.",
            details=exc.errors(),
        )

    @app.exception_handler(StarletteHTTPException)
    async def _handle_http(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        return _envelope(
            status_code=exc.status_code,
            error_code="HTTP_ERROR",
            message=str(exc.detail),
        )

    @app.exception_handler(IntegrityError)
    async def _handle_integrity(_: Request, exc: IntegrityError) -> JSONResponse:
        logger.warning("IntegrityError: %s", exc.orig)
        return _envelope(
            status_code=status.HTTP_409_CONFLICT,
            error_code="DB_INTEGRITY_ERROR",
            message="Database integrity constraint violated.",
        )

    @app.exception_handler(SQLAlchemyError)
    async def _handle_sqlalchemy(_: Request, exc: SQLAlchemyError) -> JSONResponse:
        logger.exception("Unhandled SQLAlchemyError")
        return _envelope(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="DB_ERROR",
            message="A database error occurred.",
        )

    @app.exception_handler(Exception)
    async def _handle_unexpected(_: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled exception")
        return _envelope(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="INTERNAL_ERROR",
            message="An unexpected error occurred.",
        )
