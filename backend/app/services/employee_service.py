from typing import Sequence, Tuple

from app.core.exceptions import ConflictError, NotFoundError, ValidationError
from app.models.employee import Employee
from app.repositories.employee_repository import EmployeeRepository
from app.schemas.employee import EmployeeCreate, EmployeeFacets, EmployeeFilter, EmployeeUpdate


class EmployeeService:
    """Business rules around Employee. Knows nothing about HTTP or SQL —
    routes call this; this calls the repository."""

    def __init__(self, employee_repo: EmployeeRepository) -> None:
        self._employees = employee_repo

    # ---------- Reads ----------

    def get(self, employee_id: str) -> Employee:
        employee = self._employees.get(employee_id)
        if employee is None:
            raise NotFoundError(
                "Employee not found.", error_code="EMPLOYEE_NOT_FOUND"
            )
        return employee

    def list(
        self, filters: EmployeeFilter, *, skip: int, limit: int
    ) -> Tuple[Sequence[Employee], int]:
        self._guard_salary_range(filters.salary_min, filters.salary_max)
        return self._employees.search(filters, skip=skip, limit=limit)

    def facets(self) -> EmployeeFacets:
        """Distinct values used to drive UI dropdowns."""
        return EmployeeFacets(
            countries=self._employees.distinct_countries(),
            departments=self._employees.distinct_departments(),
            job_titles=self._employees.distinct_job_titles(),
        )

    # ---------- Writes ----------

    def create(self, payload: EmployeeCreate) -> Employee:
        if self._employees.email_exists(payload.email):
            raise ConflictError(
                "Email is already registered to another employee.",
                error_code="EMPLOYEE_EMAIL_TAKEN",
            )
        employee = Employee(
            full_name=payload.full_name,
            email=payload.email,
            phone=payload.phone,
            country=payload.country,
            department=payload.department,
            job_title=payload.job_title,
            salary=payload.salary,
            hire_date=payload.hire_date,
            status=payload.status.value,
        )
        return self._employees.add(employee)

    def update(self, employee_id: str, payload: EmployeeUpdate) -> Employee:
        employee = self.get(employee_id)
        data = payload.model_dump(exclude_unset=True)
        if "email" in data and self._employees.email_exists(
            data["email"], exclude_id=employee_id
        ):
            raise ConflictError(
                "Email is already registered to another employee.",
                error_code="EMPLOYEE_EMAIL_TAKEN",
            )
        if "status" in data and data["status"] is not None:
            data["status"] = data["status"].value
        return self._employees.update(employee, data)

    def delete(self, employee_id: str) -> None:
        employee = self.get(employee_id)
        self._employees.delete(employee)

    # ---------- Validation helpers ----------

    @staticmethod
    def _guard_salary_range(salary_min, salary_max) -> None:
        if (
            salary_min is not None
            and salary_max is not None
            and salary_min > salary_max
        ):
            raise ValidationError(
                "salary_min cannot be greater than salary_max.",
                error_code="SALARY_RANGE_INVALID",
            )
