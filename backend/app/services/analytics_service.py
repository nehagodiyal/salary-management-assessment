from typing import List

from app.repositories.analytics_repository import AnalyticsRepository
from app.schemas.analytics import (
    DashboardSummary,
    GroupAverageSalary,
    GroupCount,
    SalaryStats,
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

    def avg_salary_by_job_title(self) -> List[GroupAverageSalary]:
        return [
            GroupAverageSalary(group=g, average_salary=avg, employee_count=cnt)
            for g, avg, cnt in self._repo.avg_salary_by_job_title()
        ]

    def avg_salary_by_department(self) -> List[GroupAverageSalary]:
        return [
            GroupAverageSalary(group=g, average_salary=avg, employee_count=cnt)
            for g, avg, cnt in self._repo.avg_salary_by_department()
        ]

    def count_by_country(self) -> List[GroupCount]:
        return [GroupCount(group=g, employee_count=c) for g, c in self._repo.count_by_country()]

    def count_by_department(self) -> List[GroupCount]:
        return [GroupCount(group=g, employee_count=c) for g, c in self._repo.count_by_department()]

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
            highest_paying_country=self.highest_paying_country(),
            highest_paying_department=self.highest_paying_department(),
        )
