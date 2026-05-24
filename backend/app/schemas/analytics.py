from typing import List, Optional

from pydantic import BaseModel, Field


class SalaryStats(BaseModel):
    """Top-level aggregate over the whole employee population."""

    count: int = Field(ge=0)
    average: Optional[float] = None
    minimum: Optional[int] = None
    maximum: Optional[int] = None
    median: Optional[float] = None


class GroupAverageSalary(BaseModel):
    """One row of a `GROUP BY X` average-salary aggregation."""

    group: str
    average_salary: float
    employee_count: int


class GroupCount(BaseModel):
    """One row of a `GROUP BY X` head-count aggregation."""

    group: str
    employee_count: int


class TopGroup(BaseModel):
    """The single highest-paying group of a given dimension."""

    group: str
    average_salary: float


class DashboardSummary(BaseModel):
    """Compact payload designed to drive a dashboard with a single round-trip."""

    salary_stats: SalaryStats
    employees_by_country: List[GroupCount]
    employees_by_department: List[GroupCount]
    highest_paying_country: Optional[TopGroup] = None
    highest_paying_department: Optional[TopGroup] = None
