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

from app.db.base import Base  # noqa: E402
from app.db.session import get_db  # noqa: E402
from app.main import create_app  # noqa: E402

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
