from typing import Annotated, Optional

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import CurrentUser, EmployeeServiceDep, require_roles
from app.core.enums import EmployeeSortField, EmploymentStatus, Role, SortDirection
from app.schemas.employee import (
    EmployeeCreate,
    EmployeeFacets,
    EmployeeFilter,
    EmployeeRead,
    EmployeeUpdate,
)
from app.schemas.pagination import PaginatedResponse, PaginationParams

router = APIRouter()

AdminOnly = Depends(require_roles(Role.ADMIN))


@router.get("", response_model=PaginatedResponse[EmployeeRead])
def list_employees(
    _: CurrentUser,
    svc: EmployeeServiceDep,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, max_length=100),
    country: Optional[str] = None,
    department: Optional[str] = None,
    job_title: Optional[str] = None,
    status_: Annotated[Optional[EmploymentStatus], Query(alias="status")] = None,
    salary_min: Optional[int] = Query(None, ge=0),
    salary_max: Optional[int] = Query(None, ge=0),
    sort_by: EmployeeSortField = EmployeeSortField.CREATED_AT,
    sort_dir: SortDirection = SortDirection.DESC,
) -> PaginatedResponse[EmployeeRead]:
    filters = EmployeeFilter(
        search=search,
        country=country,
        department=department,
        job_title=job_title,
        status=status_,
        salary_min=salary_min,
        salary_max=salary_max,
        sort_by=sort_by,
        sort_dir=sort_dir,
    )
    pagination = PaginationParams(page=page, page_size=page_size)
    items, total = svc.list(filters, skip=pagination.skip, limit=pagination.limit)
    return PaginatedResponse.build(
        items=[EmployeeRead.model_validate(e) for e in items],
        total=total,
        page=pagination.page,
        page_size=pagination.page_size,
    )


@router.get(
    "/facets",
    response_model=EmployeeFacets,
    summary="Distinct countries / departments / job titles used in the DB",
)
def get_employee_facets(
    _: CurrentUser, svc: EmployeeServiceDep
) -> EmployeeFacets:
    return svc.facets()


@router.get("/{employee_id}", response_model=EmployeeRead)
def get_employee(
    employee_id: str,
    _: CurrentUser,
    svc: EmployeeServiceDep,
) -> EmployeeRead:
    return EmployeeRead.model_validate(svc.get(employee_id))


@router.post(
    "",
    response_model=EmployeeRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[AdminOnly],
)
def create_employee(
    payload: EmployeeCreate, svc: EmployeeServiceDep
) -> EmployeeRead:
    return EmployeeRead.model_validate(svc.create(payload))


@router.put(
    "/{employee_id}",
    response_model=EmployeeRead,
    dependencies=[AdminOnly],
)
def update_employee(
    employee_id: str,
    payload: EmployeeUpdate,
    svc: EmployeeServiceDep,
) -> EmployeeRead:
    return EmployeeRead.model_validate(svc.update(employee_id, payload))


@router.delete(
    "/{employee_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[AdminOnly],
)
def delete_employee(employee_id: str, svc: EmployeeServiceDep) -> None:
    svc.delete(employee_id)
