"""Pre-computed analytics queries.

All aggregations push work into the database; we never pull the full table
into Python (except a single column-scan for median, which is still O(N) and
fine up to ~100k rows). For larger datasets, switch median to a window
function (Postgres) or a materialized stat.
"""
import statistics
from typing import List, Optional, Sequence, Tuple

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.employee import Employee


class AnalyticsRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    # ---------- Scalars ----------

    def total_count(self) -> int:
        return int(
            self.db.execute(select(func.count()).select_from(Employee)).scalar_one()
        )

    def salary_min(self) -> Optional[int]:
        return self.db.execute(select(func.min(Employee.salary))).scalar()

    def salary_max(self) -> Optional[int]:
        return self.db.execute(select(func.max(Employee.salary))).scalar()

    def salary_avg(self) -> Optional[float]:
        result = self.db.execute(select(func.avg(Employee.salary))).scalar()
        return float(result) if result is not None else None

    def salary_median(self) -> Optional[float]:
        """Streams only the salary column. For 10k rows this is < 50ms; we
        avoid SQL-engine-specific percentile functions to keep the query
        portable between SQLite and Postgres."""
        salaries: Sequence[int] = self.db.execute(
            select(Employee.salary).order_by(Employee.salary)
        ).scalars().all()
        if not salaries:
            return None
        return float(statistics.median(salaries))

    # ---------- Grouped aggregations ----------

    def avg_salary_by_country(self) -> List[Tuple[str, float, int]]:
        stmt = (
            select(
                Employee.country,
                func.avg(Employee.salary).label("avg_salary"),
                func.count().label("emp_count"),
            )
            .group_by(Employee.country)
            .order_by(func.avg(Employee.salary).desc())
        )
        return [(row[0], float(row[1]), int(row[2])) for row in self.db.execute(stmt)]

    def avg_salary_by_job_title(self) -> List[Tuple[str, float, int]]:
        stmt = (
            select(
                Employee.job_title,
                func.avg(Employee.salary).label("avg_salary"),
                func.count().label("emp_count"),
            )
            .group_by(Employee.job_title)
            .order_by(func.avg(Employee.salary).desc())
        )
        return [(row[0], float(row[1]), int(row[2])) for row in self.db.execute(stmt)]

    def avg_salary_by_department(self) -> List[Tuple[str, float, int]]:
        stmt = (
            select(
                Employee.department,
                func.avg(Employee.salary).label("avg_salary"),
                func.count().label("emp_count"),
            )
            .group_by(Employee.department)
            .order_by(func.avg(Employee.salary).desc())
        )
        return [(row[0], float(row[1]), int(row[2])) for row in self.db.execute(stmt)]

    def count_by_country(self) -> List[Tuple[str, int]]:
        stmt = (
            select(Employee.country, func.count().label("emp_count"))
            .group_by(Employee.country)
            .order_by(func.count().desc())
        )
        return [(row[0], int(row[1])) for row in self.db.execute(stmt)]

    def count_by_department(self) -> List[Tuple[str, int]]:
        stmt = (
            select(Employee.department, func.count().label("emp_count"))
            .group_by(Employee.department)
            .order_by(func.count().desc())
        )
        return [(row[0], int(row[1])) for row in self.db.execute(stmt)]

    # ---------- Top-of-group shortcuts ----------

    def top_paying_country(self) -> Optional[Tuple[str, float]]:
        stmt = (
            select(Employee.country, func.avg(Employee.salary).label("avg_salary"))
            .group_by(Employee.country)
            .order_by(func.avg(Employee.salary).desc())
            .limit(1)
        )
        row = self.db.execute(stmt).first()
        return (row[0], float(row[1])) if row else None

    def top_paying_department(self) -> Optional[Tuple[str, float]]:
        stmt = (
            select(Employee.department, func.avg(Employee.salary).label("avg_salary"))
            .group_by(Employee.department)
            .order_by(func.avg(Employee.salary).desc())
            .limit(1)
        )
        row = self.db.execute(stmt).first()
        return (row[0], float(row[1])) if row else None
