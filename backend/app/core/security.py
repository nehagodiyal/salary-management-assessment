from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Literal, Optional

import jwt
from passlib.context import CryptContext

from app.core.config import settings
from app.core.exceptions import UnauthorizedError

TokenType = Literal["access", "refresh"]

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ---------- Passwords ----------

def hash_password(plain: str) -> str:
    return _pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return _pwd_context.verify(plain, hashed)


# ---------- JWT ----------

def _build_token(
    *,
    subject: str,
    token_type: TokenType,
    expires_delta: timedelta,
    extra_claims: Optional[Dict[str, Any]] = None,
) -> str:
    now = datetime.now(timezone.utc)
    payload: Dict[str, Any] = {
        "sub": subject,
        "iat": int(now.timestamp()),
        "exp": int((now + expires_delta).timestamp()),
        "type": token_type,
    }
    if extra_claims:
        payload.update(extra_claims)
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_access_token(
    subject: str,
    *,
    extra_claims: Optional[Dict[str, Any]] = None,
    expires_minutes: Optional[int] = None,
) -> str:
    delta = timedelta(minutes=expires_minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return _build_token(
        subject=subject,
        token_type="access",
        expires_delta=delta,
        extra_claims=extra_claims,
    )


def create_refresh_token(
    subject: str,
    *,
    extra_claims: Optional[Dict[str, Any]] = None,
    expires_days: Optional[int] = None,
) -> str:
    delta = timedelta(days=expires_days or settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return _build_token(
        subject=subject,
        token_type="refresh",
        expires_delta=delta,
        extra_claims=extra_claims,
    )


def decode_token(
    token: str,
    *,
    expected_type: Optional[TokenType] = None,
) -> Dict[str, Any]:
    """Decode + verify a JWT. Raises UnauthorizedError on failure."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
    except jwt.ExpiredSignatureError as exc:
        raise UnauthorizedError("Token has expired.", error_code="TOKEN_EXPIRED") from exc
    except jwt.InvalidTokenError as exc:
        raise UnauthorizedError("Invalid token.", error_code="TOKEN_INVALID") from exc

    if expected_type is not None and payload.get("type") != expected_type:
        raise UnauthorizedError(
            f"Expected {expected_type} token.",
            error_code="TOKEN_WRONG_TYPE",
        )
    return payload
