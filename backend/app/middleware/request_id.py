import uuid

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from app.core.logger import request_id_ctx

REQUEST_ID_HEADER = "X-Request-ID"


class RequestIdMiddleware(BaseHTTPMiddleware):
    """Attach a request_id (from header or freshly generated) to every request.

    The id is stored in a ContextVar so loggers and downstream code can read it
    without explicit threading, and is echoed back in the response headers.
    """

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        rid = request.headers.get(REQUEST_ID_HEADER) or str(uuid.uuid4())
        token = request_id_ctx.set(rid)
        try:
            request.state.request_id = rid
            response = await call_next(request)
            response.headers[REQUEST_ID_HEADER] = rid
            return response
        finally:
            request_id_ctx.reset(token)
