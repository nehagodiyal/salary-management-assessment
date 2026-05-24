# Salary Management

A full-stack admin console for managing employees and analyzing compensation data across countries and departments. Built as an end-to-end demonstration of modern FastAPI + React patterns: JWT auth with RBAC, a repository/service architecture, PostgreSQL, and an analytics dashboard with charts.

## Tech stack

| Layer | Choice | Purpose |
|---|---|---|
| Backend | **FastAPI** + Uvicorn | Async-ready REST API with auto-generated OpenAPI docs |
| ORM | **SQLAlchemy 2.0** + Alembic | Type-safe queries + versioned migrations |
| Database | **PostgreSQL 17** | Production-grade relational store |
| Auth | **JWT** (PyJWT) + Passlib (bcrypt) | Access + refresh tokens, role-based access control |
| Validation | **Pydantic v2** | Request/response schemas |
| Frontend | **React 18** + Vite | Fast HMR dev server, modern build pipeline |
| UI | **Material UI v5** | Production-ready component library |
| Data fetching | **React Query (TanStack)** | Server-state cache, retry, invalidation |
| Charts | **Recharts** | Composable React-friendly chart primitives |
| Forms | **Formik + Yup** | Declarative form state + schema validation |
| HTTP | **Axios** | Auth interceptor + auto token refresh |
| Testing | **pytest** (backend) + **Vitest** (frontend) | TDD-friendly, 97%+ backend coverage |

## Features

- **JWT authentication** with access (30 min) + refresh (7 day) tokens
- **Admin-only access** — non-admin tokens are rejected client-side after login
- **Admin-gated user provisioning** — admins create new users; no public signup
- **Employee CRUD** — create, read, update, delete, list with pagination + filters
- **Search & filter** — by country, department, job title, employment status, salary range, free-text
- **Analytics dashboard** — salary stats (min/max/avg/median), country & department breakdowns, top earners, distribution histograms, percentile rankings
- **Mobile-responsive** UI via MUI breakpoints
- **Seed script** — generates synthetic employee data for demos (1 to 10k+ rows)

## Quick start

Detailed setup is in [artifacts/setup.md](artifacts/setup.md). Short version:

```bash
# 1. Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env                    # then edit DATABASE_URL + SECRET_KEY
alembic upgrade head
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='YourStrongPassword' python scripts/create_admin.py
python scripts/seed.py --count 100 -f
uvicorn app.main:app --reload --port 8000

# 2. Frontend (new terminal)
cd frontend
npm install
npm run dev                              # opens http://localhost:3000
```

Login with the admin credentials you just created.

## Documentation

| Doc | What it covers |
|---|---|
| [artifacts/setup.md](artifacts/setup.md) | Step-by-step setup, troubleshooting, prerequisites |
| [artifacts/architecture.md](artifacts/architecture.md) | System architecture, layer diagram, request flow |
| [artifacts/design-decisions.md](artifacts/design-decisions.md) | Why each tech choice — alternatives considered & tradeoffs |
| [artifacts/performance.md](artifacts/performance.md) | DB indexes, pagination, bulk inserts, query design |
| [artifacts/knowledge-base.md](artifacts/knowledge-base.md) | Engineering decisions, patterns, common issues, future work |
| [artifacts/tests.md](artifacts/tests.md) | Testing approach |
| [artifacts/prompts.md](artifacts/prompts.md), [backend.md](artifacts/backend.md), [frontend.md](artifacts/frontend.md), [seeding.md](artifacts/seeding.md) | AI prompts used during the build |

## Repository layout

```
salary-management/
├── README.md                         this file
├── CLAUDE.md                         project instructions (auto-update rules)
├── backend/                          FastAPI service
│   ├── app/
│   │   ├── api/v1/endpoints/         route handlers
│   │   ├── core/                     config, security, logging, enums
│   │   ├── db/                       SQLAlchemy session + base
│   │   ├── middleware/               error handler, request-id, logging
│   │   ├── models/                   ORM models (User, Employee)
│   │   ├── repositories/             data access layer
│   │   ├── schemas/                  Pydantic request/response shapes
│   │   ├── services/                 business logic
│   │   ├── utils/                    helpers
│   │   └── main.py                   FastAPI app factory
│   ├── alembic/                      migrations
│   ├── scripts/                      create_admin.py, seed.py
│   ├── tests/                        pytest suite (unit + integration)
│   ├── requirements.txt
│   └── .env.example
├── frontend/                         React admin console
│   ├── src/
│   │   ├── api/                      Axios client + endpoints map
│   │   ├── components/               reusable UI (DataTable, ChartCard, ...)
│   │   ├── hooks/                    useEmployees, useAnalytics, ...
│   │   ├── pages/                    LoginPage, EmployeesPage, AnalyticsPage, ...
│   │   ├── services/                 thin service layer over Axios
│   │   ├── utils/                    query keys, formatters
│   │   ├── tests/                    Vitest unit + integration
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js                runs on port 3000
└── artifacts/                        all design/planning/prompts artifacts
    ├── architecture.md               HLD + LLD with Mermaid diagrams
    ├── design-decisions.md           tradeoffs & alternatives
    ├── performance.md                indexes, pagination, bulk insert, queries
    ├── setup.md                      clone-to-running guide
    ├── knowledge-base.md             engineering decisions, patterns, future work
    ├── tests.md                      testing approach
    ├── prompts.md                    master AI prompt list
    ├── backend.md                    backend prompt
    ├── frontend.md                   frontend prompt
    └── seeding.md                    seeder prompt
```

## API surface (summary)

```
POST   /api/v1/auth/login                      issue access + refresh tokens
POST   /api/v1/auth/refresh                    refresh access token
POST   /api/v1/auth/logout                     revoke (client-side)

POST   /api/v1/users                           admin: create user
GET    /api/v1/users/me                        current user

GET    /api/v1/employees?page=&page_size=...   list (paginated, filterable)
POST   /api/v1/employees                       create
GET    /api/v1/employees/{id}                  read
PUT    /api/v1/employees/{id}                  update
DELETE /api/v1/employees/{id}                  delete

GET    /api/v1/analytics/salary-stats          global salary stats
GET    /api/v1/analytics/country/{c}/...       per-country stats
GET    /api/v1/analytics/avg-salary/country    grouped averages
GET    /api/v1/analytics/avg-salary/department grouped averages
GET    /api/v1/analytics/count/country         head-counts by country
GET    /api/v1/analytics/top/country           highest-paying country
GET    /api/v1/analytics/dashboard             one-round-trip bundled payload
```

Full OpenAPI spec is auto-generated at `http://localhost:8000/docs` once the backend is running.

## License

This is an assessment project. No license intended for redistribution.
