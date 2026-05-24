"""Top-level v1 API router.

Feature routers (auth, employees, analytics) will be included here as they are
implemented. Keeping a single aggregator router lets `main.py` mount the API
under one prefix.
"""
from fastapi import APIRouter

api_router = APIRouter()

# Feature routers go here, e.g.:
# from app.api.v1.endpoints import auth, employees, analytics
# api_router.include_router(auth.router,      prefix="/auth",      tags=["auth"])
# api_router.include_router(employees.router, prefix="/employees", tags=["employees"])
# api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
