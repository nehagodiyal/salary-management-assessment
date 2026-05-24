from typing import List, Optional, Sequence, Tuple

from sqlalchemy import Select, func, or_, select
from sqlalchemy.orm import Session

from app.core.enums import EmployeeSortField, SortDirection
from app.models.employee import Employee
from app.repositories.base import BaseRepository
from app.schemas.employee import EmployeeFilter

# Map sort-by enum -> ORM attribute. Centralized so routes never see a column
# name string (defense against arbitrary ORDER BY injection).
_SORT_COLUMNS = {
    EmployeeSortField.FULL_NAME: Employee.full_name,
    EmployeeSortField.SALARY: Employee.salary,
    EmployeeSortField.HIRE_DATE: Employee.hire_date,
    EmployeeSortField.COUNTRY: Employee.country,
    EmployeeSortField.DEPARTMENT: Employee.department,
    EmployeeSortField.CREATED_AT: Employee.created_at,
}


class EmployeeRepository(BaseRepository[Employee]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Employee)

    # ---------- Lookups ----------

    def get_by_email(self, email: str) -> Optional[Employee]:
        return self.get_by(email=email.lower())

    def email_exists(self, email: str, *, exclude_id: Optional[str] = None) -> bool:
        stmt = select(func.count()).select_from(Employee).where(
            Employee.email == email.lower()
        )
        if exclude_id is not None:
            stmt = stmt.where(Employee.id != exclude_id)
        return int(self.db.execute(stmt).scalar_one()) > 0

    # ---------- Search / filter / sort / paginate ----------

    def search(
        self,
        filters: EmployeeFilter,
        *,
        skip: int,
        limit: int,
    ) -> Tuple[Sequence[Employee], int]:
        """Return (page_items, total_count) in a single repository call.

        Both queries share the same `_apply_filters` builder so they can never
        drift out of sync (e.g. a filter that applies to one but not the other).
        """
        base_stmt = self._apply_filters(select(Employee), filters)
        count_stmt = self._apply_filters(
            select(func.count()).select_from(Employee), filters
        )

        order_col = _SORT_COLUMNS[filters.sort_by]
        if filters.sort_dir == SortDirection.DESC:
            order_col = order_col.desc()
        else:
            order_col = order_col.asc()

        page_stmt = base_stmt.order_by(order_col).offset(skip).limit(limit)
        items = self.db.execute(page_stmt).scalars().all()
        total = int(self.db.execute(count_stmt).scalar_one())
        return items, total

    # ---------- Facets (distinct value lookup) ----------

    def distinct_countries(self) -> List[str]:
        return self._distinct(Employee.country)

    def distinct_departments(self) -> List[str]:
        return self._distinct(Employee.department)

    def distinct_job_titles(self) -> List[str]:
        return self._distinct(Employee.job_title)

    def _distinct(self, column) -> List[str]:
        """Sorted, non-null, unique values for an indexed column.

        Bounded by the column's cardinality so a bare `SELECT DISTINCT` is
        fine even at 10k+ rows.
        """
        return list(
            self.db.execute(
                select(column).distinct().where(column.is_not(None)).order_by(column)
            ).scalars().all()
        )

    # ---------- Internal ----------

    @staticmethod
    def _apply_filters(stmt: Select, filters: EmployeeFilter) -> Select:
        if filters.search:
            needle = f"%{filters.search.lower()}%"
            # case-insensitive LIKE via `lower()` — works on Postgres without
            # depending on dialect-specific operators like ILIKE.
            stmt = stmt.where(
                or_(
                    func.lower(Employee.full_name).like(needle),
                    func.lower(Employee.email).like(needle),
                )
            )
        if filters.country:
            stmt = stmt.where(Employee.country == filters.country)
        if filters.department:
            stmt = stmt.where(Employee.department == filters.department)
        if filters.job_title:
            stmt = stmt.where(Employee.job_title == filters.job_title)
        if filters.status is not None:
            stmt = stmt.where(Employee.status == filters.status.value)
        if filters.salary_min is not None:
            stmt = stmt.where(Employee.salary >= filters.salary_min)
        if filters.salary_max is not None:
            stmt = stmt.where(Employee.salary <= filters.salary_max)
        return stmt
