from enum import Enum


class Role(str, Enum):
    ADMIN = "admin"
    USER = "user"

    @classmethod
    def values(cls) -> set[str]:
        return {r.value for r in cls}


class EmploymentStatus(str, Enum):
    ACTIVE = "active"
    ON_LEAVE = "on_leave"
    TERMINATED = "terminated"


class EmployeeSortField(str, Enum):
    FULL_NAME = "full_name"
    SALARY = "salary"
    HIRE_DATE = "hire_date"
    COUNTRY = "country"
    DEPARTMENT = "department"
    CREATED_AT = "created_at"


class SortDirection(str, Enum):
    ASC = "asc"
    DESC = "desc"
