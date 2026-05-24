from typing import Generator

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings


def _build_engine() -> Engine:
    """Create a SQLAlchemy engine configured for the active database.

    SQLite needs `check_same_thread=False` to be usable across FastAPI's
    thread pool. Pool sizing only applies to non-SQLite backends.
    """
    if settings.is_sqlite:
        return create_engine(
            settings.DATABASE_URL,
            echo=settings.DB_ECHO,
            connect_args={"check_same_thread": False},
            future=True,
        )

    return create_engine(
        settings.DATABASE_URL,
        echo=settings.DB_ECHO,
        pool_size=settings.DB_POOL_SIZE,
        max_overflow=settings.DB_MAX_OVERFLOW,
        pool_pre_ping=True,
        future=True,
    )


engine: Engine = _build_engine()

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
    class_=Session,
)


@event.listens_for(Engine, "connect")
def _enable_sqlite_fk(dbapi_connection, connection_record):
    """Enforce foreign-key constraints on SQLite connections."""
    if settings.is_sqlite:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a scoped DB session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
