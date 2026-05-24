"""Re-export models here so `import app.models` registers them on Base.metadata.

Alembic's `env.py` and tests rely on this side effect for autogenerate and
`Base.metadata.create_all`.
"""
from app.models.employee import Employee  # noqa: F401
from app.models.user import User  # noqa: F401

__all__ = ["User", "Employee"]
