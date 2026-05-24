"""Shared FastAPI dependencies (DB session, current user, etc.).

Concrete auth dependencies (e.g. `get_current_user`) will be added alongside
the auth feature; this module exists now so routers have a single import path.
"""
from typing import Annotated

from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.session import get_db

DbSession = Annotated[Session, Depends(get_db)]
