import time

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from app.core.logger import get_logger

logger = get_logger("app.access")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Structured access logging: method, path, status, duration."""

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        start = time.perf_counter()
        response: Response
        try:
            response = await call_next(request)
        except Exception:
            elapsed_ms = (time.perf_counter() - start) * 1000
            logger.exception(
                "%s %s -> 500 in %.2fms",
                request.method,
                request.url.path,
                elapsed_ms,
            )
            raise

        elapsed_ms = (time.perf_counter() - start) * 1000
        logger.info(
            "%s %s -> %d in %.2fms",
            request.method,
            request.url.path,
            response.status_code,
            elapsed_ms,
        )
        return response
