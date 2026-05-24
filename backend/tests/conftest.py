"""Shared pytest fixtures.

The application config is forced into the `test` environment before anything
else imports `app.core.config`, and every test gets an isolated in-memory
SQLite database with the schema rebuilt fresh.
"""
import os

os.environ.setdefault("APP_ENV", "test")
os.environ.setdefault("DATABASE_URL", "sqlite:///:memory:")
os.environ.setdefault("SECRET_KEY", "test-secret-key-test-secret-key-test-secret-key")
os.environ.setdefault("LOG_LEVEL", "WARNING")

from typing import Generator  # noqa: E402

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import Session, sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.core.enums import Role  # noqa: E402
from app.core.security import hash_password  # noqa: E402
from app.db.base import Base  # noqa: E402
from app.db.session import get_db  # noqa: E402
from app.main import create_app  # noqa: E402
from app.models.user import User  # noqa: E402
from app.repositories.user_repository import UserRepository  # noqa: E402
from app.services.auth_service import AuthService  # noqa: E402

# Importing the models package ensures tables are registered on Base.metadata.
import app.models  # noqa: E402, F401


@pytest.fixture(scope="session")
def test_engine():
    """Single in-memory SQLite engine shared across the session.

    StaticPool keeps the same underlying connection alive, which is required
    for ":memory:" databases that would otherwise vanish between connections.
    """
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        future=True,
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture
def db_session(test_engine) -> Generator[Session, None, None]:
    """Transactional fixture: each test runs inside a SAVEPOINT that is rolled back."""
    connection = test_engine.connect()
    transaction = connection.begin()
    TestingSession = sessionmaker(bind=connection, autoflush=False, autocommit=False)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture
def client(db_session) -> Generator[TestClient, None, None]:
    """FastAPI TestClient with `get_db` overridden to use the test session."""
    app = create_app()

    def _override_get_db() -> Generator[Session, None, None]:
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


# ---------- Auth fixtures ----------

@pytest.fixture
def user_repo(db_session) -> UserRepository:
    return UserRepository(db_session)


@pytest.fixture
def auth_service(user_repo) -> AuthService:
    return AuthService(user_repo)


@pytest.fixture
def make_user(db_session):
    """Factory that creates and persists a user with the given role."""

    def _make(
        email: str = "alice@example.com",
        password: str = "Sup3rSecret!",
        role: Role = Role.USER,
    ) -> User:
        user = User(
            email=email.lower(),
            password_hash=hash_password(password),
            role=role.value,
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)
        return user

    return _make


@pytest.fixture
def admin_user(make_user) -> User:
    return make_user(email="admin@example.com", role=Role.ADMIN)


@pytest.fixture
def regular_user(make_user) -> User:
    return make_user(email="user@example.com", role=Role.USER)


@pytest.fixture
def auth_header_for(auth_service):
    """Return a callable that builds an `Authorization: Bearer ...` header
    for any persisted user — handy for hitting protected routes in tests."""

    def _build(user: User) -> dict:
        tokens = auth_service.issue_tokens(user)
        return {"Authorization": f"Bearer {tokens.access_token}"}

    return _build
