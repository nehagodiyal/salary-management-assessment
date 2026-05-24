"""Top-level v1 API router.

Mount additional feature routers here as they are implemented.
"""
from fastapi import APIRouter

from app.api.v1.endpoints import auth

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
# Future:
# api_router.include_router(employees.router, prefix="/employees", tags=["employees"])
# api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
