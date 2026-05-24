
# KNOWLEDGE BASE

# Engineering Decisions

## Why FastAPI
- Async ready
- Type safe
- Fast development

## Why React
- Reusable components
- Large ecosystem

## Why Vite
- Fast dev server, instant HMR for the admin console

## Why Material UI
- Production-ready component library
- Theming & responsive primitives out of the box

## Why React Query
- Cache, retry and invalidate server state for employees + analytics
- Eliminates manual loading/error plumbing in components

## Why Recharts
- Composable React-friendly chart primitives for dashboard widgets

## Why Formik + Yup
- Declarative form state + schema validation for the employee form

## Why SQLite
- Assessment simplicity
- Easy local setup

# Patterns Used
- MVC
- Repository Pattern
- Service Layer
- Dependency Injection
- Alembic migrations
- Pagination schema (shared)
- Frontend service layer (`src/services/*`) keeps Axios calls out of components
- React Query hooks (`useEmployees`, `useAnalytics`) own server state
- Auth context + Axios interceptor for token attach + refresh
- Reusable `DataTable`, `PaginationBar`, `EmployeeForm`, `ChartCard` primitives
- Admin-only access enforced post-login (non-admin role rejected client-side)

# Authentication
- JWT access token
- Refresh token support
- Role-based access control (RBAC)
- Admin-gated user provisioning
- Frontend: admin-only sign-in; non-admin tokens are discarded post-login
- Frontend stores tokens in localStorage; Axios interceptor auto-refreshes on 401

# Common Issues

## Token Expired
Solution:
- Refresh endpoint

## Slow Queries
Solution:
- DB indexes
- Pagination

# Future Improvements
- Redis
- PostgreSQL
- Audit Logs
- Docker Compose
- CI/CD
- Frontend: dark-mode theme toggle
- Frontend: CSV export of filtered employee list
- Frontend: MSW-based integration tests (currently uses service mocks)
