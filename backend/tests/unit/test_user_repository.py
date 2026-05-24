from app.core.enums import Role
from app.core.security import hash_password
from app.models.user import User


def test_create_user_assigns_uuid_and_timestamps(user_repo):
    user = user_repo.add(
        User(
            email="new@example.com",
            password_hash=hash_password("Sup3rSecret!"),
            role=Role.USER.value,
        )
    )
    assert user.id and len(user.id) == 36
    assert user.created_at is not None
    assert user.updated_at is not None


def test_get_by_email_is_case_insensitive(user_repo, make_user):
    make_user(email="Mixed@Example.com")
    found = user_repo.get_by_email("MIXED@example.com")
    assert found is not None
    assert found.email == "mixed@example.com"


def test_email_exists(user_repo, make_user):
    make_user(email="taken@example.com")
    assert user_repo.email_exists("taken@example.com") is True
    assert user_repo.email_exists("free@example.com") is False


def test_email_uniqueness_enforced(user_repo, make_user, db_session):
    from sqlalchemy.exc import IntegrityError
    import pytest

    make_user(email="dup@example.com")
    with pytest.raises(IntegrityError):
        user_repo.add(
            User(
                email="dup@example.com",
                password_hash=hash_password("password123"),
                role=Role.USER.value,
            )
        )
    db_session.rollback()
