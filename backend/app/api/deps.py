"""Shared FastAPI dependencies for routes.

Repositories, services, and the current-user guard are all wired here so
routes stay thin and only declare what they need via `Annotated[..., Depends]`.
"""
from typing import Annotated, Optional

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.enums import Role
from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.core.security import decode_token
from app.db.session import get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService

# `auto_error=False` lets us raise our own UnauthorizedError envelope instead
# of FastAPI's default {"detail": "Not authenticated"} response.
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_PREFIX}/auth/login",
    auto_error=False,
)


# ---------- DB ----------

DbSession = Annotated[Session, Depends(get_db)]


# ---------- Repositories ----------

def get_user_repository(db: DbSession) -> UserRepository:
    return UserRepository(db)


UserRepoDep = Annotated[UserRepository, Depends(get_user_repository)]


# ---------- Services ----------

def get_auth_service(user_repo: UserRepoDep) -> AuthService:
    return AuthService(user_repo)


AuthServiceDep = Annotated[AuthService, Depends(get_auth_service)]


# ---------- Auth guards ----------

def get_current_user(
    token: Annotated[Optional[str], Depends(oauth2_scheme)],
    user_repo: UserRepoDep,
) -> User:
    if not token:
        raise UnauthorizedError(
            "Missing access token.", error_code="MISSING_TOKEN"
        )
    payload = decode_token(token, expected_type="access")
    user = user_repo.get(payload["sub"])
    if user is None:
        raise UnauthorizedError(
            "User no longer exists.", error_code="USER_NOT_FOUND"
        )
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_roles(*allowed: Role):
    """Return a dependency that allows only the given roles through."""
    allowed_values = {r.value for r in allowed}

    def _checker(user: CurrentUser) -> User:
        if user.role not in allowed_values:
            raise ForbiddenError(
                f"Requires one of roles: {sorted(allowed_values)}.",
                error_code="ROLE_FORBIDDEN",
            )
        return user

    return _checker
