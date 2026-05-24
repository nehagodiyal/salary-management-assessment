"""Direct unit tests for the error envelope handlers.

These avoid the BaseHTTPMiddleware/ASGI quirk where raised exceptions don't
reliably reach app-level handlers through TestClient. We grab the handler
functions off the FastAPI app and invoke them with a fake Request.
"""
import asyncio
import json

from fastapi import FastAPI
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.requests import Request

from app.middleware.error_handler import register_exception_handlers


def _fake_request() -> Request:
    scope = {"type": "http", "method": "GET", "path": "/", "headers": []}
    return Request(scope)


def _app_with_handlers() -> FastAPI:
    app = FastAPI()
    register_exception_handlers(app)
    return app


def _invoke(handler, exc):
    return asyncio.run(handler(_fake_request(), exc))


def _decode(response) -> dict:
    return json.loads(bytes(response.body).decode())


def test_unhandled_handler_returns_envelope():
    app = _app_with_handlers()
    handler = app.exception_handlers[Exception]
    response = _invoke(handler, RuntimeError("boom"))
    assert response.status_code == 500
    body = _decode(response)
    assert body["error"]["code"] == "INTERNAL_ERROR"
    assert body["error"]["message"] == "An unexpected error occurred."


def test_starlette_http_handler_returns_envelope():
    app = _app_with_handlers()
    handler = app.exception_handlers[StarletteHTTPException]
    response = _invoke(handler, StarletteHTTPException(status_code=418, detail="teapot"))
    assert response.status_code == 418
    body = _decode(response)
    assert body["error"]["code"] == "HTTP_ERROR"
    assert body["error"]["message"] == "teapot"


def test_integrity_error_handler_returns_409():
    app = _app_with_handlers()
    handler = app.exception_handlers[IntegrityError]
    exc = IntegrityError("INSERT ...", params=None, orig=Exception("uniq"))
    response = _invoke(handler, exc)
    assert response.status_code == 409
    assert _decode(response)["error"]["code"] == "DB_INTEGRITY_ERROR"


def test_sqlalchemy_error_handler_returns_500():
    app = _app_with_handlers()
    handler = app.exception_handlers[SQLAlchemyError]
    response = _invoke(handler, SQLAlchemyError("boom"))
    assert response.status_code == 500
    assert _decode(response)["error"]["code"] == "DB_ERROR"
