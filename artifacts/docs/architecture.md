# Architecture

## High-level overview

```mermaid
flowchart TB
    subgraph Browser
        UI[React 18 + MUI<br/>Vite dev server :3000]
    end

    subgraph Backend["FastAPI service :8000"]
        MW[Middleware<br/>request-id · logging · error envelope · CORS]
        API[API endpoints<br/>auth · users · employees · analytics]
        SVC[Service layer<br/>business rules]
        REPO[Repository layer<br/>SQLAlchemy queries]
    end

    subgraph Data["Data layer"]
        DB[(PostgreSQL 17<br/>users · employees)]
    end

    UI -- "REST + JWT (Bearer)" --> MW
    MW --> API
    API --> SVC
    SVC --> REPO
    REPO -- "SQLAlchemy 2.0 ORM" --> DB

    UI -- "React Query cache" --> UI
```

## Request lifecycle

```mermaid
sequenceDiagram
    participant U as Browser (React)
    participant M as Middleware
    participant E as Endpoint
    participant S as Service
    participant R as Repository
    participant D as PostgreSQL

    U->>M: GET /api/v1/employees (Bearer JWT)
    M->>M: attach request_id, log, verify JWT
    M->>E: route to employees endpoint
    E->>E: validate query params (Pydantic)
    E->>S: list_employees(filters)
    S->>R: paginated_query(filters)
    R->>D: SELECT ... WHERE ... LIMIT
    D-->>R: rows
    R-->>S: List[Employee]
    S-->>E: PaginatedResponse
    E-->>M: 200 JSON
    M-->>U: response (+ request_id header)
```

## Layer responsibilities

| Layer | Owns | Doesn't own |
|---|---|---|
| **API / endpoint** | HTTP framing, request validation, status codes | Business rules, SQL |
| **Service** | Business rules, cross-repo orchestration, domain errors | HTTP shapes, SQL |
| **Repository** | SQL, query composition, returning ORM/domain objects | Business decisions, HTTP |
| **Model** | DB schema, constraints, indexes | Behavior — keep them dumb |
| **Schema (Pydantic)** | Request/response shapes, validation rules | DB shape — kept separate from models |

This separation lets us swap one layer without rewriting others — e.g., adding a CLI or a GraphQL layer reuses the same service + repository.

## Low-level call paths

```
AuthController       (auth.py)
    └─> AuthService             ─> UserRepository
EmployeeController   (employees.py)
    └─> EmployeeService         ─> EmployeeRepository
AnalyticsController  (analytics.py)
    └─> AnalyticsService        ─> AnalyticsRepository
```

## Frontend layers

```mermaid
flowchart LR
    Pages[Pages<br/>Login · Employees · Analytics · Dashboard]
    Hooks[Hooks<br/>useEmployees · useAnalytics · useAuth]
    Services[Services<br/>employeeService · analyticsService · authService]
    API[Axios client<br/>JWT interceptor · refresh-on-401]

    Pages --> Hooks
    Hooks --> Services
    Services --> API
    API --> Backend[(FastAPI)]
```

- **Pages** render UI and consume hooks.
- **Hooks** wrap React Query (cache + invalidation) over service calls.
- **Services** are thin wrappers around the Axios client — easy to mock in tests.
- **API client** owns auth (token attach + refresh on 401) and error normalization.

## Security boundaries

- **JWT verification** — happens in middleware before any handler sees the request. Unauthenticated requests are rejected before business logic runs.
- **Password hashing** — bcrypt via Passlib. Plaintext passwords are never logged.
- **Role-based access control** — `admin` role required for write endpoints and the user-provisioning route. Non-admin tokens are also rejected client-side after login (defense-in-depth).
- **CORS** — explicit allow-list via `CORS_ORIGINS` env var; no wildcards in production.
- **SQL injection** — every query goes through SQLAlchemy parameterized binding; no string concatenation of user input into SQL.
- **Validation** — Pydantic validates every request body and query param before business logic.
- **Defense in depth** — DB-level `CHECK (salary > 0)` constraint backs up the API-level Pydantic validation.

## Scalability path

Current state is single-instance ready. Listed in order of when you'd need each:

1. **Vertical scaling** — bigger DB instance. Free first lever.
2. **Connection pooling** — already enabled (`pool_size=5`, `max_overflow=10`, `pool_pre_ping`).
3. **Read replicas** — if read traffic outgrows a single Postgres node.
4. **Redis caching** — dashboard endpoints first (they're idempotent and hot).
5. **Materialized views** — for group-by-country analytics if the employee table grows past ~100k.
6. **Horizontal backend scaling** — JWT is stateless, so adding more uvicorn workers/instances is mechanical.
7. **CDN for frontend** — already free on Vercel.

## Deployment target

```mermaid
flowchart LR
    User((Browser))
    Vercel[Vercel<br/>static React build]
    Render[Render<br/>FastAPI Web Service]
    PG[(Render Postgres)]

    User -- HTTPS --> Vercel
    User -- HTTPS + JWT --> Render
    Render --> PG
```

- **Frontend → Vercel** — Vite build, automatic deploys per push to `main`.
- **Backend → Render** — Python Web Service, build `pip install -r requirements.txt`, start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
- **Database → Render Postgres** — Internal URL injected as `DATABASE_URL`.
- **Secrets → Render env vars** — `SECRET_KEY`, `CORS_ORIGINS` (Vercel URL), admin bootstrap creds.

See [setup.md](setup.md) for local setup and the deployment preview section.
