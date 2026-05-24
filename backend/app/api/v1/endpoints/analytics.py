from typing import List, Optional

from fastapi import APIRouter

from app.api.deps import AnalyticsServiceDep, CurrentUser
from app.schemas.analytics import (
    DashboardSummary,
    GroupAverageSalary,
    GroupCount,
    SalaryStats,
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
    _: CurrentUser, svc: AnalyticsServiceDep
) -> List[GroupAverageSalary]:
    return svc.avg_salary_by_job_title()


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
