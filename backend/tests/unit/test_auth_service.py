import pytest

from app.core.enums import Role
from app.core.exceptions import ConflictError, UnauthorizedError
from app.core.security import decode_token


# ---------- register ----------

def test_register_persists_user_with_hashed_password(auth_service, user_repo):
    user = auth_service.register("Bob@Example.com", "Sup3rSecret!")
    persisted = user_repo.get_by_email("bob@example.com")
    assert persisted is not None
    assert persisted.id == user.id
    assert persisted.password_hash != "Sup3rSecret!"  # never store plaintext
    assert persisted.role == Role.USER.value


def test_register_normalizes_email_to_lowercase(auth_service):
    user = auth_service.register("UPPER@Example.com", "Sup3rSecret!")
    assert user.email == "upper@example.com"


def test_register_admin_role_assigned(auth_service):
    user = auth_service.register("a@example.com", "Sup3rSecret!", role=Role.ADMIN)
    assert user.role == Role.ADMIN.value


def test_register_duplicate_email_raises_conflict(auth_service):
    auth_service.register("dup@example.com", "Sup3rSecret!")
    with pytest.raises(ConflictError) as exc:
        auth_service.register("dup@example.com", "Another!1")
    assert exc.value.error_code == "EMAIL_TAKEN"


# ---------- authenticate ----------

def test_authenticate_valid_credentials_returns_user(auth_service):
    created = auth_service.register("ok@example.com", "Sup3rSecret!")
    user = auth_service.authenticate("ok@example.com", "Sup3rSecret!")
    assert user.id == created.id


def test_authenticate_wrong_password_raises(auth_service):
    auth_service.register("ok@example.com", "Sup3rSecret!")
    with pytest.raises(UnauthorizedError) as exc:
        auth_service.authenticate("ok@example.com", "WrongPassword!")
    assert exc.value.error_code == "BAD_CREDENTIALS"


def test_authenticate_unknown_email_raises(auth_service):
    with pytest.raises(UnauthorizedError) as exc:
        auth_service.authenticate("ghost@example.com", "whatever1!")
    assert exc.value.error_code == "BAD_CREDENTIALS"


# ---------- tokens ----------

def test_issue_tokens_embeds_claims(auth_service):
    user = auth_service.register("c@example.com", "Sup3rSecret!", role=Role.ADMIN)
    tokens = auth_service.issue_tokens(user)

    access_payload = decode_token(tokens.access_token, expected_type="access")
    refresh_payload = decode_token(tokens.refresh_token, expected_type="refresh")

    assert access_payload["sub"] == user.id
    assert access_payload["email"] == user.email
    assert access_payload["role"] == Role.ADMIN.value
    assert refresh_payload["sub"] == user.id
    assert tokens.token_type == "bearer"


# ---------- refresh ----------

def test_refresh_returns_new_token_pair(auth_service):
    user = auth_service.register("r@example.com", "Sup3rSecret!")
    initial = auth_service.issue_tokens(user)

    refreshed = auth_service.refresh(initial.refresh_token)
    payload = decode_token(refreshed.access_token, expected_type="access")
    assert payload["sub"] == user.id


def test_refresh_rejects_access_token_as_refresh(auth_service):
    user = auth_service.register("r@example.com", "Sup3rSecret!")
    tokens = auth_service.issue_tokens(user)
    with pytest.raises(UnauthorizedError) as exc:
        auth_service.refresh(tokens.access_token)
    assert exc.value.error_code == "TOKEN_WRONG_TYPE"


def test_refresh_rejects_garbage_token(auth_service):
    with pytest.raises(UnauthorizedError):
        auth_service.refresh("not-a-real-token")
