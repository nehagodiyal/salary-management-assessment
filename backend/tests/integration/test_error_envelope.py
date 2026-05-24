"""Verify the global error envelope is applied to every exception flavor."""
from fastapi import APIRouter, FastAPI
from fastapi.testclient import TestClient
from pydantic import BaseModel

from app.core.exceptions import ConflictError, NotFoundError
from app.main import create_app
from app.middleware.error_handler import register_exception_handlers


def _app_with_test_routes() -> FastAPI:
    """Build an app instance and mount a handful of routes that deliberately fail."""
    app = create_app()
    router = APIRouter(prefix="/__test__")

    @router.get("/not-found")
    def _nf():
        raise NotFoundError("widget missing")

    @router.get("/conflict")
    def _cf():
        raise ConflictError("dup")

    class Payload(BaseModel):
        name: str

    @router.post("/validate")
    def _val(payload: Payload):
        return payload

    @router.get("/boom")
    def _boom():
        raise RuntimeError("kaboom")

    app.include_router(router)
    # idempotent — `create_app` already registered handlers
    register_exception_handlers(app)
    return app


def _client() -> TestClient:
    return TestClient(_app_with_test_routes(), raise_server_exceptions=False)


def test_not_found_envelope():
    r = _client().get("/__test__/not-found")
    assert r.status_code == 404
    body = r.json()
    assert body["error"]["code"] == "NOT_FOUND"
    assert body["error"]["message"] == "widget missing"
    assert "request_id" in body["error"]


def test_conflict_envelope():
    r = _client().get("/__test__/conflict")
    assert r.status_code == 409
    assert r.json()["error"]["code"] == "CONFLICT"


def test_validation_envelope():
    r = _client().post("/__test__/validate", json={})  # missing required `name`
    assert r.status_code == 422
    body = r.json()
    assert body["error"]["code"] == "VALIDATION_ERROR"
    assert isinstance(body["error"]["details"], list)


# Note: 500 / unhandled-Exception path is covered by `test_unhandled_handler_returns_envelope`
# in tests/unit/test_error_handlers.py — we test the handler function directly because
# Starlette's BaseHTTPMiddleware does not reliably propagate raised exceptions through
# the ASGI exception-handler chain inside TestClient.
