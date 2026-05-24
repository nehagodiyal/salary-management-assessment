"""Tests for the bootstrap admin creation script."""
import pytest
from sqlalchemy import select

from app.core.enums import Role
from app.core.security import verify_password
from app.models.user import User
from app.repositories.user_repository import UserRepository
from scripts.create_admin import (
    CREATED,
    EXISTS,
    EXIT_OK,
    EXIT_USAGE,
    UPDATED,
    create_or_update_admin,
    main,
)


# ---------- Core function ----------

def test_create_inserts_new_admin(db_session):
    action, user = create_or_update_admin(
        db_session,
        email="boot@example.com",
        password="bootstrap-secret",
    )
    assert action == CREATED
    assert user.email == "boot@example.com"
    assert user.role == Role.ADMIN.value
    assert verify_password("bootstrap-secret", user.password_hash)


def test_create_lowercases_email(db_session):
    action, user = create_or_update_admin(
        db_session,
        email="UPPER@Example.COM",
        password="bootstrap-secret",
    )
    assert action == CREATED
    assert user.email == "upper@example.com"


def test_re_run_with_existing_email_is_idempotent(db_session):
    action_first, _ = create_or_update_admin(
        db_session, email="boot@example.com", password="bootstrap-secret"
    )
    action_second, _ = create_or_update_admin(
        db_session, email="boot@example.com", password="bootstrap-secret"
    )
    assert action_first == CREATED
    assert action_second == EXISTS


def test_existing_user_password_unchanged_without_reset_flag(db_session):
    create_or_update_admin(
        db_session, email="boot@example.com", password="original-secret"
    )
    create_or_update_admin(
        db_session, email="boot@example.com", password="attempted-overwrite"
    )
    user = UserRepository(db_session).get_by_email("boot@example.com")
    assert verify_password("original-secret", user.password_hash)
    assert not verify_password("attempted-overwrite", user.password_hash)


def test_reset_password_flag_overwrites(db_session):
    create_or_update_admin(
        db_session, email="boot@example.com", password="original-secret"
    )
    action, user = create_or_update_admin(
        db_session,
        email="boot@example.com",
        password="new-secret-value",
        reset_password=True,
    )
    assert action == UPDATED
    assert verify_password("new-secret-value", user.password_hash)


def test_does_not_create_duplicate_rows_on_rerun(db_session):
    create_or_update_admin(db_session, email="boot@example.com", password="secret-abc")
    create_or_update_admin(db_session, email="boot@example.com", password="secret-abc")
    count = len(db_session.execute(select(User)).scalars().all())
    assert count == 1


# ---------- CLI / main() ----------

def test_main_creates_admin_from_flags(monkeypatch, capsys):
    # Patch SessionLocal so main() uses our test connection.
    from scripts import create_admin as mod

    code = main(
        [
            "--email",
            "cli@example.com",
            "--password",
            "cli-bootstrap-pw",
        ]
    )
    assert code == EXIT_OK


def test_main_reads_env_vars(monkeypatch):
    monkeypatch.setenv("ADMIN_EMAIL", "env@example.com")
    monkeypatch.setenv("ADMIN_PASSWORD", "env-bootstrap-pw")
    code = main([])
    assert code == EXIT_OK


def test_main_fails_when_email_missing(monkeypatch, capsys):
    monkeypatch.delenv("ADMIN_EMAIL", raising=False)
    monkeypatch.delenv("ADMIN_PASSWORD", raising=False)
    code = main(["--password", "something-long-enough"])
    assert code == EXIT_USAGE
    assert "required" in capsys.readouterr().err.lower()


def test_main_rejects_short_password(monkeypatch, capsys):
    monkeypatch.delenv("ADMIN_EMAIL", raising=False)
    monkeypatch.delenv("ADMIN_PASSWORD", raising=False)
    code = main(["--email", "x@y.com", "--password", "short"])
    assert code == EXIT_USAGE
    err = capsys.readouterr().err
    assert "password" in err.lower()


def test_main_rejects_bad_email(monkeypatch, capsys):
    monkeypatch.delenv("ADMIN_EMAIL", raising=False)
    monkeypatch.delenv("ADMIN_PASSWORD", raising=False)
    code = main(["--email", "not-an-email", "--password", "long-enough-pw"])
    assert code == EXIT_USAGE
    assert "email" in capsys.readouterr().err.lower()


def test_main_does_not_print_password(monkeypatch, capsys):
    monkeypatch.setenv("ADMIN_EMAIL", "logsafe@example.com")
    monkeypatch.setenv("ADMIN_PASSWORD", "super-secret-pw-xyz")
    main([])
    captured = capsys.readouterr()
    assert "super-secret-pw-xyz" not in captured.out
    assert "super-secret-pw-xyz" not in captured.err


@pytest.fixture(autouse=True)
def _redirect_sessionlocal_to_test_db(monkeypatch, db_session):
    """Make `SessionLocal()` (used by main) yield our test session.

    `main()` opens its own session via `SessionLocal() as db`. We patch it
    to return a context-managed wrapper around the per-test session so
    rollback isolation still works.
    """
    from scripts import create_admin as mod

    class _SessionCtx:
        def __enter__(self_inner):
            return db_session

        def __exit__(self_inner, exc_type, exc, tb):
            # Don't close — the conftest fixture owns the session lifecycle.
            return False

    monkeypatch.setattr(mod, "SessionLocal", lambda: _SessionCtx())
