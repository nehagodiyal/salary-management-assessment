import logging
import sys
from contextvars import ContextVar
from logging.config import dictConfig
from typing import Optional

from app.core.config import settings

request_id_ctx: ContextVar[Optional[str]] = ContextVar("request_id", default=None)


class RequestIdFilter(logging.Filter):
    """Inject the current request_id (if any) into every log record."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = request_id_ctx.get() or "-"
        return True


def configure_logging() -> None:
    """Configure root + uvicorn loggers based on settings.

    Idempotent — safe to call multiple times.
    """
    fmt_plain = (
        "%(asctime)s | %(levelname)-8s | %(name)s | rid=%(request_id)s | %(message)s"
    )
    fmt_json = (
        '{"time":"%(asctime)s","level":"%(levelname)s","logger":"%(name)s",'
        '"request_id":"%(request_id)s","message":"%(message)s"}'
    )

    config = {
        "version": 1,
        "disable_existing_loggers": False,
        "filters": {
            "request_id": {"()": RequestIdFilter},
        },
        "formatters": {
            "default": {"format": fmt_json if settings.LOG_JSON else fmt_plain},
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "stream": sys.stdout,
                "formatter": "default",
                "filters": ["request_id"],
                "level": settings.LOG_LEVEL,
            },
        },
        "root": {
            "handlers": ["console"],
            "level": settings.LOG_LEVEL,
        },
        "loggers": {
            "uvicorn":         {"handlers": ["console"], "level": settings.LOG_LEVEL, "propagate": False},
            "uvicorn.error":   {"handlers": ["console"], "level": settings.LOG_LEVEL, "propagate": False},
            "uvicorn.access":  {"handlers": ["console"], "level": "WARNING",          "propagate": False},
            "sqlalchemy.engine": {"handlers": ["console"], "level": "WARNING",        "propagate": False},
        },
    }
    dictConfig(config)


def get_logger(name: str) -> logging.Logger:
    return logging.getLogger(name)
