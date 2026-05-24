import time

import pytest

from app.core.exceptions import UnauthorizedError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)


def test_password_hash_round_trip():
    hashed = hash_password("s3cret!")
    assert hashed != "s3cret!"
    assert verify_password("s3cret!", hashed) is True
    assert verify_password("wrong", hashed) is False


def test_access_token_round_trip():
    token = create_access_token("user-123", extra_claims={"role": "admin"})
    payload = decode_token(token, expected_type="access")
    assert payload["sub"] == "user-123"
    assert payload["role"] == "admin"
    assert payload["type"] == "access"


def test_refresh_token_type_is_enforced():
    token = create_refresh_token("user-123")
    with pytest.raises(UnauthorizedError):
        decode_token(token, expected_type="access")


def test_expired_token_raises():
    token = create_access_token("user-123", expires_minutes=0)
    time.sleep(1)
    with pytest.raises(UnauthorizedError):
        decode_token(token)


def test_tampered_token_raises():
    token = create_access_token("user-123") + "garbage"
    with pytest.raises(UnauthorizedError):
        decode_token(token)
