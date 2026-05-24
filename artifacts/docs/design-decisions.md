# Design Decisions & Tradeoffs

This document explains *why* each major technology was chosen and what alternatives were considered. For each decision: **chose**, **alternatives**, **why this won**.

## Backend framework

- **Chose:** FastAPI
- **Alternatives:** Django REST Framework, Flask
- **Why:** FastAPI gives async-ready endpoints, automatic OpenAPI/Swagger docs, Pydantic-based request validation out of the box, and the lowest boilerplate for a JSON-only API. Django would have been overkill (we don't need its ORM, admin, or templating). Flask would have required assembling validation, docs, and async support from third-party extensions.

## Database

- **Chose:** PostgreSQL 17
- **Alternatives:** MySQL, SQLite, MongoDB
- **Why:** PostgreSQL is the industry standard for relational data with strong consistency, rich indexing, and broad managed-hosting support (Render, Supabase, RDS). MongoDB was rejected because employee/salary data is intrinsically relational with a fixed schema — there's no document-shape benefit. SQLite was used briefly during initial scaffolding but switched to Postgres for production parity. MySQL is comparable to Postgres, but Postgres edges out for analytics-heavy queries (window functions, percentile_cont, JSONB).

## ORM

- **Chose:** SQLAlchemy 2.0 (typed) + Alembic
- **Alternatives:** SQLModel, Tortoise ORM, raw SQL
- **Why:** SQLAlchemy 2.0's typed `Mapped[]` API gives static-type safety without sacrificing query flexibility. Alembic is the de-facto standard for SQLAlchemy migrations. SQLModel layers Pydantic over SQLAlchemy — convenient but couples DB models to API schemas, which we explicitly wanted to separate (models live in `app/models/`, schemas in `app/schemas/`). Raw SQL would have been faster to write initially but loses the migration story and type safety.

## Authentication

- **Chose:** JWT (access + refresh tokens) with bcrypt password hashing
- **Alternatives:** Server-side sessions (cookie-based), OAuth via third-party
- **Why:** JWT scales statelessly — every backend instance can validate tokens without shared session storage. Access tokens are short-lived (30 min) for safety; refresh tokens are longer (7 days) to keep the user logged in. Sessions would have required Redis or sticky load balancing. Third-party OAuth was out of scope for an internal admin tool.

## RBAC strategy

- **Chose:** Single `role` field on User with admin-gated provisioning
- **Alternatives:** Full RBAC (roles + permissions tables), attribute-based access control
- **Why:** The product has exactly two roles (`admin`, `user`) and admin-only screens. A full permissions matrix is over-engineering. The non-admin role is enforced *post-login on the frontend* (token discarded), so the backend's role check is defense-in-depth rather than the only gate.

## Backend architecture pattern

- **Chose:** Repository + Service + Schema layers (MVC-ish)
- **Alternatives:** Anemic models with logic in route handlers, Domain-Driven Design (DDD) with aggregates
- **Why:** Repository isolates SQL from business logic; service holds business rules; schema validates the wire. Route handlers stay thin (3–5 lines). DDD-style aggregates were unnecessary for this domain's complexity. Repositories also make testing trivial — you mock the repo, not the database.

## Frontend framework

- **Chose:** React 18 + Vite
- **Alternatives:** Vue 3, Angular, Next.js
- **Why:** React has the largest ecosystem of UI libraries (MUI), data libraries (React Query), and chart libraries (Recharts) — all of which we use. Vite was chosen over Create-React-App (deprecated) and Next.js (we don't need SSR; this is an SPA). Vite's HMR is also dramatically faster than Webpack during dev.

## UI library

- **Chose:** Material UI v5 (MUI)
- **Alternatives:** Tailwind CSS, Chakra UI, Ant Design
- **Why:** MUI ships with a complete set of production-ready components (tables, forms, dialogs, snackbars, theming) so we don't reinvent low-level UI primitives. Tailwind requires building each component from scratch (great for design freedom, slower for an admin console). Chakra is similar to MUI but smaller ecosystem. Ant Design is older and less idiomatic React.

## Server-state management

- **Chose:** React Query (TanStack Query)
- **Alternatives:** Redux Toolkit + RTK Query, plain Axios + useEffect, SWR
- **Why:** React Query eliminates manual loading/error/cache plumbing. List endpoints automatically deduplicate, cache, and re-invalidate. Adding a new endpoint is a one-line `useQuery({ queryKey, queryFn })`. Redux was rejected because there is essentially zero client-only state in this app — almost everything we manage is server state. SWR is comparable but React Query has richer cache invalidation semantics.

## Forms

- **Chose:** Formik + Yup
- **Alternatives:** React Hook Form + Zod, plain `useState` per field
- **Why:** Formik gives a clean declarative form model and Yup validation schemas read naturally. React Hook Form is faster (uncontrolled inputs) but has a steeper API. For a single Employee form with ~10 fields, Formik's overhead is negligible.

## Charts

- **Chose:** Recharts
- **Alternatives:** Chart.js, Victory, Nivo, ApexCharts
- **Why:** Recharts is built specifically for React (composable JSX components instead of imperative APIs), supports the chart types we need (bar, pie, line), and renders SVG so it's responsive without extra work. Chart.js requires a wrapper library and uses canvas (harder to style).

## HTTP client

- **Chose:** Axios
- **Alternatives:** Native `fetch`, ky
- **Why:** Axios's interceptor API lets us attach the JWT and handle 401-triggered token refresh in a single place ([frontend/src/api/](../frontend/src/api/)). Native `fetch` would have required wrapping it ourselves to get the same hooks. Axios also gives consistent JSON parsing and error handling cross-browser.

## Frontend service layer

- **Chose:** Thin service modules under `src/services/`
- **Alternatives:** Calling Axios directly in components, RTK Query
- **Why:** Components import `employeeService.list(filters)`, not Axios. Means swapping the HTTP client or mocking in tests is one-file work. Same pattern as the backend repository — separation of "where data comes from" vs "what we do with it."

## Test strategy

- **Chose:** pytest (backend, in-memory SQLite) + Vitest (frontend, jsdom)
- **Alternatives:** Real Postgres for tests, Jest, Cypress for everything
- **Why:** In-memory SQLite makes the backend test suite finish in ~25 seconds with 198 tests + 97% coverage. Real Postgres in tests is more "production-like" but materially slower and adds setup complexity (test DB lifecycle, transaction rollback). The tradeoff is accepted: SQLAlchemy abstracts the DB so SQLite differences rarely affect business logic. Vitest is the natural choice for Vite projects (same config, faster than Jest).

## Pagination

- **Chose:** Offset/limit with capped page size (max 100)
- **Alternatives:** Cursor-based, keyset pagination
- **Why:** Offset pagination is simpler for clients (just pass `page` + `page_size`). At our scale (10s of thousands of employees) the offset cost is acceptable. Cursor pagination would matter at millions of rows or for stable ordering during inserts. The page-size cap prevents accidental "page_size=1000000" DoS-style queries.

## Bulk insert in seed script

- **Chose:** SQLAlchemy Core `insert()` + `executemany` in batches
- **Alternatives:** ORM `session.add_all()`, `COPY FROM STDIN` (Postgres-only)
- **Why:** Core `executemany` is 10–100x faster than ORM `add_all` because it skips the unit-of-work overhead. `COPY FROM STDIN` is the absolute fastest but is Postgres-specific and harder to compose with our deterministic-seed/idempotent semantics. For 10k rows, executemany is fast enough (~1–2 seconds).

## Analytics query design

- **Chose:** All aggregations pushed to the DB; median computed in Python
- **Alternatives:** SQL `percentile_cont` for median, full Python aggregation
- **Why:** DB aggregation (SUM, AVG, GROUP BY) is massively faster than pulling rows into Python. Median is the exception — we stream just the salary column (already indexed) and use Python's `statistics.median`. Postgres's `percentile_cont` would work but adds dialect coupling for a single function. The streaming approach is also independent of the column ordering on disk.

## Logging

- **Chose:** stdlib `logging` with `python-json-logger`, request-id middleware
- **Alternatives:** structlog, loguru
- **Why:** Stdlib + JSON formatter integrates cleanly with any log aggregator (Render's log drain, CloudWatch). Request-IDs propagated through middleware make per-request tracing trivial. structlog/loguru are nicer DX but introduce a dependency for marginal benefit.

## Error envelope

- **Chose:** Uniform `{"error": {"code", "message", "request_id", "details?"}}` for all 4xx/5xx
- **Alternatives:** RFC 7807 Problem Details, raw stack traces
- **Why:** A single, predictable shape lets the frontend's Axios interceptor extract `error.code` and route to user-friendly messages. RFC 7807 would have been valid but yet another spec to teach reviewers. Stack traces are obviously never returned to clients (logged only).

## Configuration

- **Chose:** `pydantic-settings` reading from `.env` with typed Settings
- **Alternatives:** `os.environ` lookups, `python-decouple`
- **Why:** Typed settings catch typos at boot, not at request time. `.env` is gitignored; secrets never enter the repo. The `@lru_cache` singleton means we read the env once per process.

## What we *didn't* build (intentional cuts)

- **Audit log** — useful for production but adds a row-per-write and a new model; out of scope for an assessment.
- **Redis** — would speed up analytics caching, but React Query already caches on the client. Premature optimization.
- **Docker Compose** — useful for onboarding but the project runs fine with native Python/Node.
- **CI/CD** — listed in `Future Improvements` of [knowledge-base.md](knowledge-base.md).
- **Internationalization** — single-language (English) is enough for this scope.
- **Dark mode** — listed as a future improvement.

These choices are deliberate. Adding them later is straightforward; building them now without a real driver is YAGNI.
