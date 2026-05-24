"""Unit tests for BaseRepository using a tiny throwaway model.

We define `Widget` only in this test module so the generic CRUD surface can be
exercised without depending on real domain models (which arrive later).
"""
import pytest
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.repositories.base import BaseRepository


class Widget(Base):
    __tablename__ = "widgets_test"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50), unique=True)
    color: Mapped[str] = mapped_column(String(20))


class WidgetRepository(BaseRepository[Widget]):
    def __init__(self, db) -> None:
        super().__init__(db, Widget)


@pytest.fixture
def repo(db_session):
    Widget.__table__.create(bind=db_session.get_bind(), checkfirst=True)
    return WidgetRepository(db_session)


def test_add_and_get(repo):
    w = repo.add(Widget(name="alpha", color="red"))
    assert w.id is not None
    assert repo.get(w.id).name == "alpha"


def test_get_by_filter(repo):
    repo.add(Widget(name="beta", color="blue"))
    found = repo.get_by(color="blue")
    assert found is not None and found.name == "beta"


def test_list_with_pagination_and_order(repo):
    repo.add_many([Widget(name=f"w{i}", color="red") for i in range(5)])
    page = repo.list(skip=1, limit=2, order_by=Widget.name)
    assert [w.name for w in page] == ["w1", "w2"]


def test_count_and_exists(repo):
    repo.add_many([Widget(name="c1", color="red"), Widget(name="c2", color="green")])
    assert repo.count() == 2
    assert repo.count(color="red") == 1
    assert repo.exists(color="green") is True
    assert repo.exists(color="purple") is False


def test_update(repo):
    w = repo.add(Widget(name="orig", color="red"))
    updated = repo.update(w, {"color": "green"})
    assert updated.color == "green"
    assert repo.get(w.id).color == "green"


def test_delete(repo):
    w = repo.add(Widget(name="goner", color="red"))
    repo.delete(w)
    assert repo.get(w.id) is None
