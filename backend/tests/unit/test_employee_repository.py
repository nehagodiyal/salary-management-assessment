from datetime import date

import pytest
from sqlalchemy.exc import IntegrityError

from app.core.enums import EmployeeSortField, EmploymentStatus, SortDirection
from app.models.employee import Employee
from app.schemas.employee import EmployeeFilter


def _filter(**overrides):
    """Build an EmployeeFilter with sensible defaults plus overrides."""
    defaults = dict(
        search=None,
        country=None,
        department=None,
        job_title=None,
        status=None,
        salary_min=None,
        salary_max=None,
        sort_by=EmployeeSortField.SALARY,
        sort_dir=SortDirection.DESC,
    )
    defaults.update(overrides)
    return EmployeeFilter(**defaults)


# ---------- Lookups ----------

def test_get_by_email_is_case_insensitive(employee_repo, make_employee):
    make_employee(email="MixedCase@Example.com")
    found = employee_repo.get_by_email("mixedcase@example.com")
    assert found is not None
    assert found.email == "mixedcase@example.com"


def test_email_exists_with_and_without_exclude(employee_repo, make_employee):
    emp = make_employee(email="taken@example.com")
    assert employee_repo.email_exists("taken@example.com") is True
    assert employee_repo.email_exists("taken@example.com", exclude_id=emp.id) is False
    assert employee_repo.email_exists("free@example.com") is False


def test_email_uniqueness_enforced(employee_repo, make_employee, db_session):
    make_employee(email="dup@example.com")
    duplicate = Employee(
        full_name="Other Person",
        email="dup@example.com",
        country="Germany",
        department="Sales",
        job_title="AE",
        salary=70_000,
        hire_date=date(2024, 1, 1),
        status=EmploymentStatus.ACTIVE.value,
    )
    with pytest.raises(IntegrityError):
        employee_repo.add(duplicate)
    db_session.rollback()


def test_salary_check_constraint_rejects_zero(employee_repo, db_session):
    bad = Employee(
        full_name="Zero Salary",
        email="zero@example.com",
        country="United States",
        department="Engineering",
        job_title="Software Engineer",
        salary=0,
        hire_date=date(2024, 1, 1),
        status=EmploymentStatus.ACTIVE.value,
    )
    with pytest.raises(IntegrityError):
        employee_repo.add(bad)
    db_session.rollback()


# ---------- Search / filter / sort ----------

def test_search_matches_partial_name_case_insensitive(employee_repo, make_employee):
    make_employee(full_name="Alice Smith", email="a@x.com")
    make_employee(full_name="Bob Jones", email="b@x.com")
    items, total = employee_repo.search(_filter(search="ALICE"), skip=0, limit=10)
    assert total == 1 and items[0].email == "a@x.com"


def test_search_matches_partial_email(employee_repo, make_employee):
    make_employee(email="finance.lead@example.com")
    make_employee(email="random@example.com")
    items, total = employee_repo.search(_filter(search="finance"), skip=0, limit=10)
    assert total == 1


def test_filter_by_country(employee_repo, sample_dataset):
    items, total = employee_repo.search(_filter(country="Germany"), skip=0, limit=10)
    assert total == 2
    assert all(e.country == "Germany" for e in items)


def test_filter_by_department(employee_repo, sample_dataset):
    items, total = employee_repo.search(_filter(department="Engineering"), skip=0, limit=10)
    assert total == 4


def test_filter_by_status(employee_repo, make_employee):
    make_employee(email="a@x.com", status=EmploymentStatus.ACTIVE)
    make_employee(email="b@x.com", status=EmploymentStatus.ON_LEAVE)
    items, total = employee_repo.search(
        _filter(status=EmploymentStatus.ON_LEAVE), skip=0, limit=10
    )
    assert total == 1 and items[0].status == "on_leave"


def test_filter_by_salary_range(employee_repo, sample_dataset):
    items, total = employee_repo.search(
        _filter(salary_min=100_000, salary_max=140_000), skip=0, limit=10
    )
    assert total == 3
    assert all(100_000 <= e.salary <= 140_000 for e in items)


def test_sort_by_salary_asc(employee_repo, sample_dataset):
    items, _ = employee_repo.search(
        _filter(sort_by=EmployeeSortField.SALARY, sort_dir=SortDirection.ASC),
        skip=0,
        limit=10,
    )
    salaries = [e.salary for e in items]
    assert salaries == sorted(salaries)


def test_sort_by_salary_desc(employee_repo, sample_dataset):
    items, _ = employee_repo.search(
        _filter(sort_by=EmployeeSortField.SALARY, sort_dir=SortDirection.DESC),
        skip=0,
        limit=10,
    )
    salaries = [e.salary for e in items]
    assert salaries == sorted(salaries, reverse=True)


def test_pagination_returns_correct_page(employee_repo, sample_dataset):
    page1, total = employee_repo.search(_filter(), skip=0, limit=3)
    page2, _ = employee_repo.search(_filter(), skip=3, limit=3)
    assert total == 7
    assert len(page1) == 3 and len(page2) == 3
    assert {e.id for e in page1}.isdisjoint({e.id for e in page2})


# ---------- Facets ----------

def test_distinct_countries_empty(employee_repo):
    assert employee_repo.distinct_countries() == []


def test_distinct_countries_sorted(employee_repo, sample_dataset):
    assert employee_repo.distinct_countries() == ["Germany", "India", "United States"]


def test_distinct_departments_sorted(employee_repo, sample_dataset):
    assert employee_repo.distinct_departments() == ["Engineering", "HR", "Sales"]


def test_distinct_job_titles_unique_and_sorted(employee_repo, sample_dataset):
    titles = employee_repo.distinct_job_titles()
    assert titles == sorted(titles)
    assert len(titles) == len(set(titles))
    assert "Software Engineer" in titles
