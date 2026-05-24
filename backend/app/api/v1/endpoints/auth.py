from fastapi import APIRouter, Depends, status

from app.api.deps import AuthServiceDep, CurrentUser, require_roles
from app.core.enums import Role
from app.schemas.auth import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenPair,
    UserRead,
)

router = APIRouter()


@router.post(
    "/register",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
    # Admin-only: keeps unauthenticated callers from minting accounts.
    dependencies=[Depends(require_roles(Role.ADMIN))],
)
def register(payload: RegisterRequest, svc: AuthServiceDep) -> UserRead:
    user = svc.register(payload.email, payload.password, payload.role)
    return UserRead.model_validate(user)


@router.post("/login", response_model=TokenPair)
def login(payload: LoginRequest, svc: AuthServiceDep) -> TokenPair:
    user = svc.authenticate(payload.email, payload.password)
    return svc.issue_tokens(user)


@router.post("/refresh", response_model=TokenPair)
def refresh(payload: RefreshRequest, svc: AuthServiceDep) -> TokenPair:
    return svc.refresh(payload.refresh_token)


@router.get("/me", response_model=UserRead)
def me(user: CurrentUser) -> UserRead:
    return UserRead.model_validate(user)
