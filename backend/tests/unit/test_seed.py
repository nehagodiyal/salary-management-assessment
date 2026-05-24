"""Tests for the employee seeder (scripts/seed.py).

Covers three concerns:
  1. Data-file loaders (text → Python structure).
  2. `seed_employees` behavior (count, uniqueness, names from files, etc.).
  3. The interactive `_confirm_or_abort` guard (force / TTY / yes / no).
"""
from argparse import Namespace

import pytest
from sqlalchemy import func, select

from app.models.employee import Employee
from scripts.seed import (
    FIRST_NAMES_PATH,
    JOB_TITLES_PATH,
    LAST_NAMES_PATH,
    _confirm_or_abort,
    _load_job_titles,
    _load_names,
    seed_employees,
)


def _args(force: bool = False, no_truncate: bool = False, count: int = 10) -> Namespace:
    """Build a minimal Namespace that matches what argparse produces."""
    return Namespace(force=force, no_truncate=no_truncate, count=count)


# ---------- File loaders ----------

def test_first_names_file_loads_with_real_names():
    names = _load_names(FIRST_NAMES_PATH)
    assert len(names) >= 100
    assert all(n.strip() == n for n in names)
    assert all(n for n in names)


def test_last_names_file_loads_with_real_names():
    names = _load_names(LAST_NAMES_PATH)
    assert len(names) >= 100


def test_load_names_rejects_missing_file(tmp_path):
    missing = tmp_path / "nope.txt"
    with pytest.raises(FileNotFoundError):
        _load_names(missing)


def test_load_names_rejects_empty_file(tmp_path):
    empty = tmp_path / "empty.txt"
    empty.write_text("\n\n# only a comment\n")
    with pytest.raises(ValueError):
        _load_names(empty)


def test_load_names_strips_comments_and_blank_lines(tmp_path):
    f = tmp_path / "names.txt"
    f.write_text("# header comment\nAlice\n\nBob\n   \nCharlie\n")
    assert _load_names(f) == ["Alice", "Bob", "Charlie"]


def test_load_job_titles_parses_real_file():
    titles = _load_job_titles(JOB_TITLES_PATH)
    assert "Engineering" in titles
    assert "Software Engineer" in titles["Engineering"]
    assert all(isinstance(v, list) and v for v in titles.values())


def test_load_job_titles_rejects_missing_colon(tmp_path):
    bad = tmp_path / "bad.txt"
    bad.write_text("just-a-title-no-colon\n")
    with pytest.raises(ValueError):
        _load_job_titles(bad)


def test_load_job_titles_rejects_empty_dept(tmp_path):
    bad = tmp_path / "bad.txt"
    bad.write_text(":Title Only\n")
    with pytest.raises(ValueError):
        _load_job_titles(bad)


# ---------- seed_employees behavior ----------

def test_seed_inserts_correct_count(db_session):
    n = seed_employees(db_session, count=50, batch_size=20, seed=42, truncate=True)
    assert n == 50
    total = db_session.execute(select(func.count()).select_from(Employee)).scalar_one()
    assert total == 50


def test_seeded_emails_are_unique(db_session):
    seed_employees(db_session, count=300, batch_size=100, seed=42, truncate=True)
    emails = db_session.execute(select(Employee.email)).scalars().all()
    assert len(emails) == 300
    assert len(set(emails)) == 300


def test_seeded_full_names_come_only_from_data_files(db_session):
    seed_employees(db_session, count=100, batch_size=100, seed=42, truncate=True)
    first_pool = set(_load_names(FIRST_NAMES_PATH))
    last_pool = set(_load_names(LAST_NAMES_PATH))
    full_names = db_session.execute(select(Employee.full_name)).scalars().all()
    for name in full_names:
        first, last = name.split(" ", 1)
        assert first in first_pool, f"{first!r} not present in first_names.txt"
        assert last in last_pool, f"{last!r} not present in last_names.txt"


def test_seeded_salaries_are_positive(db_session):
    seed_employees(db_session, count=200, batch_size=200, seed=42, truncate=True)
    salaries = db_session.execute(select(Employee.salary)).scalars().all()
    assert all(s > 0 for s in salaries)


def test_seed_is_deterministic_for_fixed_seed(db_session):
    seed_employees(db_session, count=25, batch_size=25, seed=42, truncate=True)
    first = db_session.execute(
        select(Employee.full_name, Employee.salary).order_by(Employee.email)
    ).all()

    seed_employees(db_session, count=25, batch_size=25, seed=42, truncate=True)
    second = db_session.execute(
        select(Employee.full_name, Employee.salary).order_by(Employee.email)
    ).all()

    assert first == second


def test_truncate_replaces_existing_rows(db_session):
    seed_employees(db_session, count=30, batch_size=30, seed=1, truncate=True)
    seed_employees(db_session, count=10, batch_size=10, seed=2, truncate=True)
    total = db_session.execute(select(func.count()).select_from(Employee)).scalar_one()
    assert total == 10


def test_no_truncate_appends_rows(db_session):
    seed_employees(db_session, count=20, batch_size=20, seed=1, truncate=True)
    seed_employees(db_session, count=15, batch_size=15, seed=2, truncate=False)
    total = db_session.execute(select(func.count()).select_from(Employee)).scalar_one()
    assert total == 35


def test_seed_zero_is_noop(db_session):
    assert seed_employees(db_session, count=0, seed=42) == 0


def test_seed_invalid_batch_size_raises(db_session):
    with pytest.raises(ValueError):
        seed_employees(db_session, count=10, batch_size=0)


def test_seeded_status_values_are_valid(db_session):
    seed_employees(db_session, count=200, batch_size=200, seed=42, truncate=True)
    statuses = set(db_session.execute(select(Employee.status)).scalars().all())
    assert statuses <= {"active", "on_leave", "terminated"}


# ---------- Confirmation guard ----------

def test_confirm_proceeds_when_db_empty(db_session):
    assert _confirm_or_abort(db_session, _args()) is True


def test_confirm_proceeds_with_force_flag(db_session, make_employee):
    make_employee()
    assert _confirm_or_abort(db_session, _args(force=True)) is True


def test_confirm_refuses_non_tty_without_force(
    db_session, make_employee, monkeypatch, capsys
):
    make_employee()
    monkeypatch.setattr("sys.stdin.isatty", lambda: False)
    assert _confirm_or_abort(db_session, _args()) is False
    err = capsys.readouterr().err
    assert "already contains" in err
    assert "non-interactive" in err.lower()


def test_confirm_accepts_yes(db_session, make_employee, monkeypatch):
    make_employee()
    monkeypatch.setattr("sys.stdin.isatty", lambda: True)
    monkeypatch.setattr("builtins.input", lambda *a, **kw: "y")
    assert _confirm_or_abort(db_session, _args()) is True


def test_confirm_accepts_yes_full_word(db_session, make_employee, monkeypatch):
    make_employee()
    monkeypatch.setattr("sys.stdin.isatty", lambda: True)
    monkeypatch.setattr("builtins.input", lambda *a, **kw: "YES")
    assert _confirm_or_abort(db_session, _args()) is True


def test_confirm_rejects_no(db_session, make_employee, monkeypatch, capsys):
    make_employee()
    monkeypatch.setattr("sys.stdin.isatty", lambda: True)
    monkeypatch.setattr("builtins.input", lambda *a, **kw: "n")
    assert _confirm_or_abort(db_session, _args()) is False
    assert "Aborted" in capsys.readouterr().out


def test_confirm_rejects_empty_input(db_session, make_employee, monkeypatch):
    make_employee()
    monkeypatch.setattr("sys.stdin.isatty", lambda: True)
    monkeypatch.setattr("builtins.input", lambda *a, **kw: "")
    assert _confirm_or_abort(db_session, _args()) is False


def test_confirm_handles_ctrl_c_during_prompt(
    db_session, make_employee, monkeypatch
):
    make_employee()
    monkeypatch.setattr("sys.stdin.isatty", lambda: True)

    def _raise(*a, **kw):
        raise KeyboardInterrupt

    monkeypatch.setattr("builtins.input", _raise)
    assert _confirm_or_abort(db_session, _args()) is False


def test_confirm_no_truncate_shows_append_warning(
    db_session, make_employee, monkeypatch, capsys
):
    make_employee()
    monkeypatch.setattr("sys.stdin.isatty", lambda: True)
    monkeypatch.setattr("builtins.input", lambda *a, **kw: "n")
    _confirm_or_abort(db_session, _args(no_truncate=True, count=500))
    output = capsys.readouterr().out
    assert "APPEND" in output
    assert "500" in output
