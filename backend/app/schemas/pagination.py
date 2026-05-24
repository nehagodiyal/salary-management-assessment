from math import ceil
from typing import Generic, List, TypeVar

from pydantic import BaseModel, Field

ItemT = TypeVar("ItemT")


class PaginationParams(BaseModel):
    """Query-string pagination. Bounded so a single request can't pull a huge page."""

    page: int = Field(1, ge=1, description="1-indexed page number.")
    page_size: int = Field(20, ge=1, le=100, description="Items per page (max 100).")

    @property
    def skip(self) -> int:
        return (self.page - 1) * self.page_size

    @property
    def limit(self) -> int:
        return self.page_size


class PaginatedResponse(BaseModel, Generic[ItemT]):
    """Envelope returned by every list endpoint so the client always sees the
    same shape regardless of the resource."""

    items: List[ItemT]
    total: int = Field(ge=0)
    page: int = Field(ge=1)
    page_size: int = Field(ge=1)
    pages: int = Field(ge=0)

    @classmethod
    def build(
        cls,
        items: List[ItemT],
        *,
        total: int,
        page: int,
        page_size: int,
    ) -> "PaginatedResponse[ItemT]":
        pages = ceil(total / page_size) if total else 0
        return cls(items=items, total=total, page=page, page_size=page_size, pages=pages)
