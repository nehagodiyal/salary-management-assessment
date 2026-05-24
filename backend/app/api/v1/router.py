"""Top-level v1 API router.

Feature routers are mounted here so `main.py` only has to include this one
aggregator.
"""
from fastapi import APIRouter

from app.api.v1.endpoints import analytics, auth, employees

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(employees.router, prefix="/employees", tags=["employees"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
