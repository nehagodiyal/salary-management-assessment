from enum import Enum


class Role(str, Enum):
    ADMIN = "admin"
    USER = "user"

    @classmethod
    def values(cls) -> set[str]:
        return {r.value for r in cls}
