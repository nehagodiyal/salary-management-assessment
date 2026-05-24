"""Pre-computed analytics queries.

All aggregations push work into the database; we never pull the full table
into Python (except a single column-scan for median, which is still O(N) and
fine up to ~100k rows). For larger datasets, switch median to a window
function (Postgres) or a materialized stat.
"""
import statistics
from collections import Counter
from datetime import date
from typing import List, Optional, Sequence, Tuple

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.employee import Employee


# Canonical tenure bands. Ranges are [low, high) in years; the last is open-ended.
_TENURE_BANDS: List[Tuple[str, float, float]] = [
    ("< 1 year", 0.0, 1.0),
    ("1–3 years", 1.0, 3.0),
    ("3–5 years", 3.0, 5.0),
    ("5–10 years", 5.0, 10.0),
    ("10+ years", 10.0, float("inf")),
]


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
        compute the median in Python rather than relying on Postgres's
        percentile_cont so the implementation stays simple."""
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

    def avg_salary_by_job_title(
        self,
        country: Optional[str] = None,
        department: Optional[str] = None,
    ) -> List[Tuple[str, float, int]]:
        """Average salary per job title with optional country/department filters.

        Filters compose with AND. Omitting both preserves the original contract
        (full-population aggregation).
        """
        stmt = (
            select(
                Employee.job_title,
                func.avg(Employee.salary).label("avg_salary"),
                func.count().label("emp_count"),
            )
            .group_by(Employee.job_title)
            .order_by(func.avg(Employee.salary).desc())
        )
        if country:
            stmt = stmt.where(Employee.country == country)
        if department:
            stmt = stmt.where(Employee.department == department)
        return [(row[0], float(row[1]), int(row[2])) for row in self.db.execute(stmt)]

    # ---------- Salary distribution / percentiles ----------

    def salary_distribution(
        self,
        bucket_size: int = 25_000,
        country: Optional[str] = None,
        department: Optional[str] = None,
    ) -> List[Tuple[int, int]]:
        """Returns [(bucket_low, count), ...] sorted ascending.

        Buckets are computed via integer arithmetic so a salary of 67_000
        with bucket_size=25_000 lands in the 50_000 bucket. Filters compose
        with AND.
        """
        if bucket_size <= 0:
            raise ValueError("bucket_size must be positive")

        bucket_col = (Employee.salary - (Employee.salary % bucket_size)).label("bucket")
        stmt = (
            select(bucket_col, func.count().label("cnt"))
            .group_by(bucket_col)
            .order_by(bucket_col)
        )
        if country:
            stmt = stmt.where(Employee.country == country)
        if department:
            stmt = stmt.where(Employee.department == department)

        return [(int(row[0]), int(row[1])) for row in self.db.execute(stmt)]

    def salary_percentiles(
        self,
        country: Optional[str] = None,
        department: Optional[str] = None,
        percentiles: Tuple[int, ...] = (10, 25, 50, 75, 90, 99),
    ) -> Tuple[int, dict]:
        """Returns (count, {p10, p25, p50, p75, p90, p99}).

        Streams the salary column (already indexed + ORDER BY) and picks
        ceiling-index values. Linear in the filtered population size; cheap
        for any single department/country slice.
        """
        stmt = select(Employee.salary).order_by(Employee.salary)
        if country:
            stmt = stmt.where(Employee.country == country)
        if department:
            stmt = stmt.where(Employee.department == department)
        salaries = self.db.execute(stmt).scalars().all()
        n = len(salaries)
        if n == 0:
            return 0, {f"p{p}": None for p in percentiles}
        result = {}
        for p in percentiles:
            # Nearest-rank percentile: index = ceil(p/100 * n) - 1, clamped.
            idx = max(0, min(n - 1, int((p / 100) * n)))
            result[f"p{p}"] = int(salaries[idx])
        return n, result

    # ---------- Per-country scalars ----------

    def salary_stats_for_country(
        self, country: str
    ) -> Tuple[int, Optional[int], Optional[int], Optional[float], Optional[float]]:
        """(count, min, max, avg, median) restricted to one country.

        Returns count=0 with None metrics when the country has no employees.
        Median streams only the salary column for that country — bounded by
        the largest country head-count, so still cheap.
        """
        row = self.db.execute(
            select(
                func.count(),
                func.min(Employee.salary),
                func.max(Employee.salary),
                func.avg(Employee.salary),
            ).where(Employee.country == country)
        ).one()
        count = int(row[0])
        minimum = row[1]
        maximum = row[2]
        average = float(row[3]) if row[3] is not None else None

        if count == 0:
            return 0, None, None, None, None

        salaries: Sequence[int] = self.db.execute(
            select(Employee.salary)
            .where(Employee.country == country)
            .order_by(Employee.salary)
        ).scalars().all()
        median = float(statistics.median(salaries)) if salaries else None
        return count, minimum, maximum, average, median

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

    def count_by_status(self) -> List[Tuple[str, int]]:
        """Headcount per employment status (active / on_leave / terminated)."""
        stmt = (
            select(Employee.status, func.count().label("emp_count"))
            .group_by(Employee.status)
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

    # ---------- Workforce / tenure analysis ----------

    def tenure_bands(
        self,
        country: Optional[str] = None,
        department: Optional[str] = None,
        as_of: Optional[date] = None,
    ) -> List[Tuple[str, int, Optional[float]]]:
        """Returns [(band_label, count, avg_salary), ...] in canonical order.

        Tenure = (today - hire_date) in years. Empty bands return count=0,
        avg_salary=None so the UI can render a stable, fixed-width band axis
        regardless of which slices have data.
        """
        today = as_of or date.today()
        stmt = select(Employee.hire_date, Employee.salary)
        if country:
            stmt = stmt.where(Employee.country == country)
        if department:
            stmt = stmt.where(Employee.department == department)

        buckets: Dict[str, List[int]] = {name: [] for name, _, _ in _TENURE_BANDS}
        for hire_date, salary in self.db.execute(stmt):
            years = (today - hire_date).days / 365.25
            for name, lo, hi in _TENURE_BANDS:
                if lo <= years < hi:
                    buckets[name].append(int(salary))
                    break

        result: List[Tuple[str, int, Optional[float]]] = []
        for name, _, _ in _TENURE_BANDS:
            salaries = buckets[name]
            avg = sum(salaries) / len(salaries) if salaries else None
            result.append((name, len(salaries), avg))
        return result

    def hiring_trends(
        self,
        granularity: str = "year",
        country: Optional[str] = None,
        department: Optional[str] = None,
    ) -> List[Tuple[str, int]]:
        """Returns [(period_label, hire_count), ...] sorted ascending.

        `granularity` is 'year' (default — fewer points, scannable) or
        'month' (denser, more useful for short windows). Computed in Python
        to stay portable across SQLite (no native date_trunc).
        """
        if granularity not in ("year", "month"):
            raise ValueError("granularity must be 'year' or 'month'")

        stmt = select(Employee.hire_date)
        if country:
            stmt = stmt.where(Employee.country == country)
        if department:
            stmt = stmt.where(Employee.department == department)

        dates = self.db.execute(stmt).scalars().all()
        if granularity == "month":
            counts = Counter(d.strftime("%Y-%m") for d in dates)
        else:
            counts = Counter(d.strftime("%Y") for d in dates)
        return sorted(counts.items())
