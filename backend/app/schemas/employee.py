from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.core.enums import EmployeeSortField, EmploymentStatus, SortDirection

# Validation bounds. Salary is an int (whole currency units) — the realistic
# range is intentionally wide so test data is unconstrained but bad input
# still gets rejected.
_SALARY_MIN = 1
_SALARY_MAX = 100_000_000


class EmployeeBase(BaseModel):
    full_name: str = Field(min_length=2, max_length=200)
    email: EmailStr
    phone: Optional[str] = Field(default=None, max_length=32)
    country: str = Field(min_length=1, max_length=100)
    department: str = Field(min_length=1, max_length=100)
    job_title: str = Field(min_length=1, max_length=150)
    salary: int = Field(ge=_SALARY_MIN, le=_SALARY_MAX)
    hire_date: date
    status: EmploymentStatus = EmploymentStatus.ACTIVE

    @field_validator("email", mode="after")
    @classmethod
    def _lower_email(cls, value: str) -> str:
        return value.lower()


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    """Partial update. Every field is optional; only provided ones are written."""

    full_name: Optional[str] = Field(default=None, min_length=2, max_length=200)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(default=None, max_length=32)
    country: Optional[str] = Field(default=None, min_length=1, max_length=100)
    department: Optional[str] = Field(default=None, min_length=1, max_length=100)
    job_title: Optional[str] = Field(default=None, min_length=1, max_length=150)
    salary: Optional[int] = Field(default=None, ge=_SALARY_MIN, le=_SALARY_MAX)
    hire_date: Optional[date] = None
    status: Optional[EmploymentStatus] = None

    @field_validator("email", mode="after")
    @classmethod
    def _lower_email(cls, value: Optional[str]) -> Optional[str]:
        return value.lower() if value else value


class EmployeeRead(EmployeeBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
    updated_at: datetime


class EmployeeFacets(BaseModel):
    """Distinct values present in the employee table, sorted ascending.

    Drives the dropdowns in the employee create/edit form so users pick from
    the same set the rest of the system already knows about.
    """

    countries: list[str]
    departments: list[str]
    job_titles: list[str]


class EmployeeFilter(BaseModel):
    """Optional query filters. None means "no constraint on this field"."""

    search: Optional[str] = Field(
        default=None,
        max_length=100,
        description="Substring match against full_name or email.",
    )
    country: Optional[str] = None
    department: Optional[str] = None
    job_title: Optional[str] = None
    status: Optional[EmploymentStatus] = None
    salary_min: Optional[int] = Field(default=None, ge=0)
    salary_max: Optional[int] = Field(default=None, ge=0)
    sort_by: EmployeeSortField = EmployeeSortField.CREATED_AT
    sort_dir: SortDirection = SortDirection.DESC
