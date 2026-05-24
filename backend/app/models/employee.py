import uuid
from datetime import date

from sqlalchemy import CheckConstraint, Date, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.enums import EmploymentStatus
from app.db.base import Base, TimestampMixin


class Employee(Base, TimestampMixin):
    __tablename__ = "employees"
    # Salary must be positive; enforced both at the schema layer (Pydantic
    # validation) and at the DB layer as a defense-in-depth check.
    __table_args__ = (CheckConstraint("salary > 0", name="ck_employees_salary_positive"),)

    id: Mapped[str] = mapped_column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    full_name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    phone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    country: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    department: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    job_title: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    salary: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    hire_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default=EmploymentStatus.ACTIVE.value,
        index=True,
    )

    def __repr__(self) -> str:
        return f"<Employee id={self.id} email={self.email} salary={self.salary}>"
