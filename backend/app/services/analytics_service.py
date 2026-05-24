from typing import List

from app.repositories.analytics_repository import AnalyticsRepository
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


class AnalyticsService:
    """Maps raw aggregation tuples to DTOs and assembles the dashboard payload.

    Has no DB or HTTP knowledge — the repository owns the queries and the
    router owns the response shape.
    """

    def __init__(self, analytics_repo: AnalyticsRepository) -> None:
        self._repo = analytics_repo

    # ---------- Single-metric endpoints ----------

    def salary_stats(self) -> SalaryStats:
        return SalaryStats(
            count=self._repo.total_count(),
            average=self._repo.salary_avg(),
            minimum=self._repo.salary_min(),
            maximum=self._repo.salary_max(),
            median=self._repo.salary_median(),
        )

    def avg_salary_by_country(self) -> List[GroupAverageSalary]:
        return [
            GroupAverageSalary(group=g, average_salary=avg, employee_count=cnt)
            for g, avg, cnt in self._repo.avg_salary_by_country()
        ]

    def avg_salary_by_job_title(
        self,
        country: str | None = None,
        department: str | None = None,
    ) -> List[GroupAverageSalary]:
        return [
            GroupAverageSalary(group=g, average_salary=avg, employee_count=cnt)
            for g, avg, cnt in self._repo.avg_salary_by_job_title(
                country=country, department=department
            )
        ]

    def salary_distribution(
        self,
        bucket_size: int = 25_000,
        country: str | None = None,
        department: str | None = None,
    ) -> List[SalaryBucket]:
        rows = self._repo.salary_distribution(
            bucket_size=bucket_size, country=country, department=department
        )
        return [
            SalaryBucket(
                bucket_low=low, bucket_high=low + bucket_size, count=count
            )
            for low, count in rows
        ]

    def salary_percentiles(
        self,
        country: str | None = None,
        department: str | None = None,
    ) -> SalaryPercentiles:
        count, percentiles = self._repo.salary_percentiles(
            country=country, department=department
        )
        return SalaryPercentiles(count=count, **percentiles)

    def tenure_bands(
        self,
        country: str | None = None,
        department: str | None = None,
    ) -> List[TenureBand]:
        return [
            TenureBand(band=name, employee_count=count, average_salary=avg)
            for name, count, avg in self._repo.tenure_bands(
                country=country, department=department
            )
        ]

    def hiring_trends(
        self,
        granularity: str = "year",
        country: str | None = None,
        department: str | None = None,
    ) -> List[HiringTrendPoint]:
        return [
            HiringTrendPoint(period=period, hire_count=count)
            for period, count in self._repo.hiring_trends(
                granularity=granularity, country=country, department=department
            )
        ]

    def salary_stats_for_country(self, country: str) -> SalaryStats:
        count, minimum, maximum, average, median = (
            self._repo.salary_stats_for_country(country)
        )
        return SalaryStats(
            count=count,
            minimum=minimum,
            maximum=maximum,
            average=average,
            median=median,
        )

    def avg_salary_by_department(self) -> List[GroupAverageSalary]:
        return [
            GroupAverageSalary(group=g, average_salary=avg, employee_count=cnt)
            for g, avg, cnt in self._repo.avg_salary_by_department()
        ]

    def count_by_country(self) -> List[GroupCount]:
        return [GroupCount(group=g, employee_count=c) for g, c in self._repo.count_by_country()]

    def count_by_department(self) -> List[GroupCount]:
        return [GroupCount(group=g, employee_count=c) for g, c in self._repo.count_by_department()]

    def count_by_status(self) -> List[GroupCount]:
        return [GroupCount(group=g, employee_count=c) for g, c in self._repo.count_by_status()]

    def highest_paying_country(self):
        row = self._repo.top_paying_country()
        return TopGroup(group=row[0], average_salary=row[1]) if row else None

    def highest_paying_department(self):
        row = self._repo.top_paying_department()
        return TopGroup(group=row[0], average_salary=row[1]) if row else None

    # ---------- Aggregated dashboard ----------

    def dashboard(self) -> DashboardSummary:
        return DashboardSummary(
            salary_stats=self.salary_stats(),
            employees_by_country=self.count_by_country(),
            employees_by_department=self.count_by_department(),
            employees_by_status=self.count_by_status(),
            highest_paying_country=self.highest_paying_country(),
            highest_paying_department=self.highest_paying_department(),
        )
