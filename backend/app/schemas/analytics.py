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


class TenureBand(BaseModel):
    """One bucket of the tenure histogram (e.g. '1–3 years')."""

    band: str
    employee_count: int = Field(ge=0)
    average_salary: Optional[float] = None


class HiringTrendPoint(BaseModel):
    """Hire count for one period (year or year-month)."""

    period: str  # 'YYYY' or 'YYYY-MM' depending on granularity
    hire_count: int = Field(ge=0)


class SalaryBucket(BaseModel):
    """One bin of a salary histogram. `bucket_low` is the inclusive lower
    boundary; `bucket_high` is exclusive."""

    bucket_low: int = Field(ge=0)
    bucket_high: int = Field(ge=0)
    count: int = Field(ge=0)


class SalaryPercentiles(BaseModel):
    """Common percentiles of salary distribution. All values are integers
    (whole currency units). None when the filtered population is empty."""

    count: int = Field(ge=0)
    p10: Optional[int] = None
    p25: Optional[int] = None
    p50: Optional[int] = None  # median
    p75: Optional[int] = None
    p90: Optional[int] = None
    p99: Optional[int] = None


class DashboardSummary(BaseModel):
    """Compact payload designed to drive a dashboard with a single round-trip."""

    salary_stats: SalaryStats
    employees_by_country: List[GroupCount]
    employees_by_department: List[GroupCount]
    employees_by_status: List[GroupCount] = Field(default_factory=list)
    highest_paying_country: Optional[TopGroup] = None
    highest_paying_department: Optional[TopGroup] = None
