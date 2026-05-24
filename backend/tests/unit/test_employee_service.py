from datetime import date

import pytest

from app.core.enums import EmployeeSortField, EmploymentStatus, SortDirection
from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.schemas.employee import EmployeeCreate, EmployeeFilter, EmployeeUpdate


def _payload(**overrides):
    base = dict(
        full_name="Created Employee",
        email="new@example.com",
        phone="+1-555-9999",
        country="United States",
        department="Engineering",
        job_title="Software Engineer",
        salary=90_000,
        hire_date=date(2023, 6, 1),
        status=EmploymentStatus.ACTIVE,
    )
    base.update(overrides)
    return EmployeeCreate(**base)


def _filter(**overrides):
    defaults = dict(
        search=None,
        country=None,
        department=None,
        job_title=None,
        status=None,
        salary_min=None,
        salary_max=None,
        sort_by=EmployeeSortField.CREATED_AT,
        sort_dir=SortDirection.DESC,
    )
    defaults.update(overrides)
    return EmployeeFilter(**defaults)


# ---------- create ----------

def test_create_persists_employee(employee_service):
    created = employee_service.create(_payload())
    assert created.id and created.email == "new@example.com"


def test_create_normalizes_email(employee_service):
    created = employee_service.create(_payload(email="UPPER@Example.com"))
    assert created.email == "upper@example.com"


def test_create_rejects_duplicate_email(employee_service):
    employee_service.create(_payload(email="dup@example.com"))
    with pytest.raises(ConflictError) as exc:
        employee_service.create(_payload(email="DUP@example.com"))
    assert exc.value.error_code == "EMPLOYEE_EMAIL_TAKEN"


# ---------- get / list ----------

def test_get_missing_raises(employee_service):
    with pytest.raises(NotFoundError) as exc:
        employee_service.get("does-not-exist")
    assert exc.value.error_code == "EMPLOYEE_NOT_FOUND"


def test_list_with_inverted_salary_range_raises(employee_service):
    with pytest.raises(ValidationError) as exc:
        employee_service.list(
            _filter(salary_min=100_000, salary_max=50_000), skip=0, limit=10
        )
    assert exc.value.error_code == "SALARY_RANGE_INVALID"


def test_list_returns_items_and_total(employee_service, sample_dataset):
    items, total = employee_service.list(_filter(), skip=0, limit=5)
    assert total == 7
    assert len(items) == 5


# ---------- update ----------

def test_update_applies_partial_fields(employee_service):
    created = employee_service.create(_payload())
    updated = employee_service.update(
        created.id, EmployeeUpdate(salary=125_000, country="Germany")
    )
    assert updated.salary == 125_000
    assert updated.country == "Germany"
    # Other fields unchanged.
    assert updated.email == created.email


def test_update_missing_raises(employee_service):
    with pytest.raises(NotFoundError):
        employee_service.update("ghost", EmployeeUpdate(salary=50_000))


def test_update_email_conflict_with_other_employee(employee_service):
    a = employee_service.create(_payload(email="a@example.com"))
    employee_service.create(_payload(email="b@example.com"))
    with pytest.raises(ConflictError):
        employee_service.update(a.id, EmployeeUpdate(email="b@example.com"))


def test_update_same_email_does_not_conflict(employee_service):
    created = employee_service.create(_payload(email="same@example.com"))
    updated = employee_service.update(
        created.id, EmployeeUpdate(email="same@example.com", salary=99_999)
    )
    assert updated.salary == 99_999


# ---------- delete ----------

def test_delete_removes_employee(employee_service):
    created = employee_service.create(_payload())
    employee_service.delete(created.id)
    with pytest.raises(NotFoundError):
        employee_service.get(created.id)


def test_delete_missing_raises(employee_service):
    with pytest.raises(NotFoundError):
        employee_service.delete("ghost")
