from typing import Any, Generic, Iterable, List, Optional, Sequence, Type, TypeVar

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.base import Base

ModelT = TypeVar("ModelT", bound=Base)


class BaseRepository(Generic[ModelT]):
    """Generic CRUD repository.

    Concrete repositories inherit this and pass their model in:
        class UserRepository(BaseRepository[User]):
            def __init__(self, db: Session) -> None:
                super().__init__(db, User)
    """

    def __init__(self, db: Session, model: Type[ModelT]) -> None:
        self.db = db
        self.model = model

    # ----- Reads -----

    def get(self, id_: Any) -> Optional[ModelT]:
        return self.db.get(self.model, id_)

    def get_by(self, **filters: Any) -> Optional[ModelT]:
        stmt = select(self.model).filter_by(**filters)
        return self.db.execute(stmt).scalar_one_or_none()

    def list(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
        order_by: Any = None,
        **filters: Any,
    ) -> Sequence[ModelT]:
        stmt = select(self.model).filter_by(**filters).offset(skip).limit(limit)
        if order_by is not None:
            stmt = stmt.order_by(order_by)
        return self.db.execute(stmt).scalars().all()

    def count(self, **filters: Any) -> int:
        stmt = select(func.count()).select_from(self.model).filter_by(**filters)
        return int(self.db.execute(stmt).scalar_one())

    def exists(self, **filters: Any) -> bool:
        return self.count(**filters) > 0

    # ----- Writes -----

    def add(self, instance: ModelT, *, commit: bool = True) -> ModelT:
        self.db.add(instance)
        if commit:
            self.db.commit()
            self.db.refresh(instance)
        else:
            self.db.flush()
        return instance

    def add_many(self, instances: Iterable[ModelT], *, commit: bool = True) -> List[ModelT]:
        items = list(instances)
        self.db.add_all(items)
        if commit:
            self.db.commit()
        else:
            self.db.flush()
        return items

    def update(self, instance: ModelT, data: dict, *, commit: bool = True) -> ModelT:
        for key, value in data.items():
            setattr(instance, key, value)
        if commit:
            self.db.commit()
            self.db.refresh(instance)
        else:
            self.db.flush()
        return instance

    def delete(self, instance: ModelT, *, commit: bool = True) -> None:
        self.db.delete(instance)
        if commit:
            self.db.commit()
        else:
            self.db.flush()
