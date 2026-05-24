from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.core.enums import Role


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class RegisterRequest(LoginRequest):
    # Role defaults to USER. Promoting to ADMIN should be admin-gated; the
    # `register` route enforces that (see api/v1/endpoints/auth.py).
    role: Role = Role.USER


class RefreshRequest(BaseModel):
    refresh_token: str = Field(min_length=10)


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: Literal["bearer"] = "bearer"


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: EmailStr
    role: Role
    created_at: datetime
    updated_at: datetime
