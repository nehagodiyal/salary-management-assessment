
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

## Why PostgreSQL (local + deploy target)
- Production-grade: persistent storage, concurrent writes, real types
- SQLAlchemy URL-driven, so local dev and Render share the same code path
- Local: `postgresql+psycopg2://postgres:***@localhost:5432/salary_management`
- Driver: `psycopg2-binary==2.9.10` (2.9.9 has no wheel for Python 3.13)

# Companion Docs
- [README.md](../README.md) — project overview, quick-start, repo layout
- [setup.md](setup.md) — clone-to-running guide + troubleshooting
- [architecture.md](architecture.md) — HLD/LLD with Mermaid diagrams
- [design-decisions.md](design-decisions.md) — every major choice + alternatives considered + tradeoffs
- [performance.md](performance.md) — indexes, pagination, bulk insert, query design
- [tests.md](tests.md) — testing approach

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

# Analytics Surface
- `GET /analytics/salary-stats` — global min/max/avg/median/count
- `GET /analytics/country/{country}/salary-stats` — same metrics filtered to one country
- `GET /analytics/avg-salary/job-title?country=…` — global or country-filtered
- `GET /analytics/avg-salary/country` / `…/department` — group-wise averages
- `GET /analytics/count/country` / `…/department` — head-counts
- `GET /analytics/top/country` / `…/department` — single highest-paying group
- `GET /analytics/dashboard` — bundled payload for one-round-trip dashboards
- Analytics page exposes a country filter that re-scopes stats panel + job-title chart

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
- Audit Logs
- Docker Compose
- CI/CD
- Frontend: dark-mode theme toggle
- Frontend: CSV export of filtered employee list
- Frontend: MSW-based integration tests (currently uses service mocks)
