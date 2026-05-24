"""Create or update the bootstrap admin user.

Designed for deployments (Render, Railway, Docker, K8s, etc.). Credentials
come from environment variables so secrets stay out of source control:

    export ADMIN_EMAIL=admin@company.com
    export ADMIN_PASSWORD='use-a-long-random-secret-here'
    python scripts/create_admin.py

CLI flags override env vars when you need to run it differently in a
one-off context:

    python scripts/create_admin.py --email admin@company.com --password 'secret'

To reset an existing admin's password (e.g. lost credentials recovery):

    python scripts/create_admin.py --email admin@company.com \\
                                   --password 'new-secret' \\
                                   --reset-password

Behavior:
  * Idempotent: re-running with an existing email is a no-op (exit 0),
    not an error — safe to wire into post-migrate deploy steps.
  * Refuses to overwrite an existing user's password without an explicit
    --reset-password flag.
  * Validates email + password with the same Pydantic rules the login API
    uses, so you can't bootstrap a credential the API would reject.
  * Never logs or prints the password.
"""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

# Make `app.*` importable when run as `python scripts/create_admin.py`.
_BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

from pydantic import BaseModel, EmailStr, Field, ValidationError  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

from app.core.enums import Role  # noqa: E402
from app.core.logger import configure_logging, get_logger  # noqa: E402
from app.core.security import hash_password  # noqa: E402
from app.db.session import SessionLocal  # noqa: E402
from app.models.user import User  # noqa: E402
from app.repositories.user_repository import UserRepository  # noqa: E402

# Must match LoginRequest at the API edge — see app/schemas/auth.py.
_MIN_PASSWORD_LENGTH = 8
_MAX_PASSWORD_LENGTH = 128

logger = get_logger("scripts.create_admin")


# ---------- Outcome enum (used by tests for stable string comparisons) ----------

CREATED = "created"
UPDATED = "updated"
EXISTS = "exists"

# ---------- Exit codes ----------

EXIT_OK = 0
EXIT_USAGE = 2          # missing/invalid inputs


# ---------- Input validation ----------

class _Creds(BaseModel):
    """Same validation rules the API applies at login."""

    email: EmailStr
    password: str = Field(min_length=_MIN_PASSWORD_LENGTH, max_length=_MAX_PASSWORD_LENGTH)
    role: Role = Role.ADMIN


# ---------- Core logic (testable, no I/O concerns) ----------

def create_or_update_admin(
    db: Session,
    *,
    email: str,
    password: str,
    role: Role = Role.ADMIN,
    reset_password: bool = False,
) -> tuple[str, User]:
    """Idempotently create (or optionally reset) an admin user.

    Returns (action, user) where action ∈ {"created", "updated", "exists"}.
    """
    repo = UserRepository(db)
    existing = repo.get_by_email(email)

    if existing is None:
        user = User(
            email=email.lower(),
            password_hash=hash_password(password),
            role=role.value,
        )
        repo.add(user)
        return CREATED, user

    if not reset_password:
        return EXISTS, existing

    repo.update(
        existing,
        {"password_hash": hash_password(password), "role": role.value},
    )
    return UPDATED, existing


# ---------- CLI entry ----------

def _parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Create or update the bootstrap admin user.",
    )
    parser.add_argument(
        "--email",
        default=os.environ.get("ADMIN_EMAIL"),
        help="Admin email. Defaults to $ADMIN_EMAIL.",
    )
    parser.add_argument(
        "--password",
        default=os.environ.get("ADMIN_PASSWORD"),
        help="Admin password. Defaults to $ADMIN_PASSWORD. Never logged.",
    )
    parser.add_argument(
        "--role",
        default=os.environ.get("ADMIN_ROLE", Role.ADMIN.value),
        choices=[r.value for r in Role],
        help="Role to assign. Defaults to $ADMIN_ROLE or 'admin'.",
    )
    parser.add_argument(
        "--reset-password",
        action="store_true",
        help="Overwrite the password if the user already exists.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = _parse_args(argv)
    configure_logging()

    if not args.email or not args.password:
        print(
            "ERROR: email and password are required. Provide them via "
            "ADMIN_EMAIL / ADMIN_PASSWORD environment variables or "
            "--email / --password flags.",
            file=sys.stderr,
        )
        return EXIT_USAGE

    try:
        creds = _Creds(email=args.email, password=args.password, role=args.role)
    except ValidationError as exc:
        # Surface readable validation errors — but never echo the password back.
        for err in exc.errors():
            loc = ".".join(str(p) for p in err["loc"])
            print(f"ERROR: invalid {loc}: {err['msg']}", file=sys.stderr)
        return EXIT_USAGE

    with SessionLocal() as db:
        action, user = create_or_update_admin(
            db,
            email=creds.email,
            password=creds.password,
            role=creds.role,
            reset_password=args.reset_password,
        )

    if action == CREATED:
        logger.info("Admin user created: %s (role=%s)", user.email, user.role)
    elif action == UPDATED:
        logger.info("Admin password reset: %s (role=%s)", user.email, user.role)
    else:  # EXISTS
        logger.info(
            "Admin user already exists: %s (role=%s). "
            "Pass --reset-password to overwrite.",
            user.email, user.role,
        )
    return EXIT_OK


if __name__ == "__main__":
    sys.exit(main())
