from typing import List, Optional

from fastapi import APIRouter, Path, Query

from app.api.deps import AnalyticsServiceDep, CurrentUser
from app.schemas.analytics import (
    DashboardSummary,
    GroupAverageSalary,
    GroupCount,
    HiringTrendPoint,
    SalaryBucket,
    SalaryPercentiles,
    SalaryStats,
    TenureBand,
    TopGroup,
)

router = APIRouter()


@router.get("/dashboard", response_model=DashboardSummary)
def dashboard(_: CurrentUser, svc: AnalyticsServiceDep) -> DashboardSummary:
    return svc.dashboard()


@router.get("/salary-stats", response_model=SalaryStats)
def salary_stats(_: CurrentUser, svc: AnalyticsServiceDep) -> SalaryStats:
    return svc.salary_stats()


@router.get("/avg-salary/country", response_model=List[GroupAverageSalary])
def avg_salary_by_country(
    _: CurrentUser, svc: AnalyticsServiceDep
) -> List[GroupAverageSalary]:
    return svc.avg_salary_by_country()


@router.get("/avg-salary/job-title", response_model=List[GroupAverageSalary])
def avg_salary_by_job_title(
    _: CurrentUser,
    svc: AnalyticsServiceDep,
    country: Optional[str] = Query(
        None,
        max_length=100,
        description="Optional country filter. Omit for the global aggregation.",
    ),
    department: Optional[str] = Query(
        None,
        max_length=100,
        description="Optional department filter; composes with country.",
    ),
) -> List[GroupAverageSalary]:
    return svc.avg_salary_by_job_title(country=country, department=department)


@router.get(
    "/salary-distribution",
    response_model=List[SalaryBucket],
    summary="Histogram of salaries bucketed by range",
)
def salary_distribution(
    _: CurrentUser,
    svc: AnalyticsServiceDep,
    country: Optional[str] = Query(None, max_length=100),
    department: Optional[str] = Query(None, max_length=100),
    bucket_size: int = Query(
        25_000,
        ge=1_000,
        le=10_000_000,
        description="Bucket width in currency units (default ₹25,000).",
    ),
) -> List[SalaryBucket]:
    return svc.salary_distribution(
        bucket_size=bucket_size, country=country, department=department
    )


@router.get(
    "/percentiles",
    response_model=SalaryPercentiles,
    summary="P10 / P25 / P50 / P75 / P90 / P99 of salary",
)
def salary_percentiles(
    _: CurrentUser,
    svc: AnalyticsServiceDep,
    country: Optional[str] = Query(None, max_length=100),
    department: Optional[str] = Query(None, max_length=100),
) -> SalaryPercentiles:
    return svc.salary_percentiles(country=country, department=department)


@router.get(
    "/tenure-bands",
    response_model=List[TenureBand],
    summary="Average pay grouped by tenure bands (<1y, 1-3y, 3-5y, 5-10y, 10+y)",
)
def tenure_bands(
    _: CurrentUser,
    svc: AnalyticsServiceDep,
    country: Optional[str] = Query(None, max_length=100),
    department: Optional[str] = Query(None, max_length=100),
) -> List[TenureBand]:
    return svc.tenure_bands(country=country, department=department)


@router.get(
    "/hiring-trends",
    response_model=List[HiringTrendPoint],
    summary="Hire count over time (yearly or monthly buckets)",
)
def hiring_trends(
    _: CurrentUser,
    svc: AnalyticsServiceDep,
    granularity: str = Query(
        "year",
        pattern="^(year|month)$",
        description="Bucket size for the time axis.",
    ),
    country: Optional[str] = Query(None, max_length=100),
    department: Optional[str] = Query(None, max_length=100),
) -> List[HiringTrendPoint]:
    return svc.hiring_trends(
        granularity=granularity, country=country, department=department
    )


@router.get(
    "/country/{country}/salary-stats",
    response_model=SalaryStats,
    summary="Min / max / avg / median salary for one country",
)
def salary_stats_for_country(
    _: CurrentUser,
    svc: AnalyticsServiceDep,
    country: str = Path(..., min_length=1, max_length=100),
) -> SalaryStats:
    return svc.salary_stats_for_country(country)


@router.get("/avg-salary/department", response_model=List[GroupAverageSalary])
def avg_salary_by_department(
    _: CurrentUser, svc: AnalyticsServiceDep
) -> List[GroupAverageSalary]:
    return svc.avg_salary_by_department()


@router.get("/count/country", response_model=List[GroupCount])
def employee_count_by_country(
    _: CurrentUser, svc: AnalyticsServiceDep
) -> List[GroupCount]:
    return svc.count_by_country()


@router.get("/count/department", response_model=List[GroupCount])
def employee_count_by_department(
    _: CurrentUser, svc: AnalyticsServiceDep
) -> List[GroupCount]:
    return svc.count_by_department()


@router.get("/top/country", response_model=Optional[TopGroup])
def highest_paying_country(
    _: CurrentUser, svc: AnalyticsServiceDep
) -> Optional[TopGroup]:
    return svc.highest_paying_country()


@router.get("/top/department", response_model=Optional[TopGroup])
def highest_paying_department(
    _: CurrentUser, svc: AnalyticsServiceDep
) -> Optional[TopGroup]:
    return svc.highest_paying_department()
