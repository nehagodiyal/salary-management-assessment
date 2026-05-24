# Performance Considerations

Practical decisions that keep the app fast under realistic load (10k–100k employees, low concurrent admin users). Each section explains *what* we did and *why* it matters.

## Database indexes

The `employees` table is indexed on every column commonly used for filtering, sorting, or grouping. See [backend/app/models/employee.py](../backend/app/models/employee.py):

| Column | Index | Used for |
|---|---|---|
| `id` | Primary key (unique) | Direct lookup |
| `full_name` | B-tree | Search (LIKE), sort |
| `email` | Unique B-tree | Login, duplicate detection |
| `country` | B-tree | Filter, group-by in analytics |
| `department` | B-tree | Filter, group-by |
| `job_title` | B-tree | Filter, group-by |
| `salary` | B-tree | Range filter, ORDER BY, MIN/MAX, percentiles |
| `status` | B-tree | Filter (active/inactive) |

The `users` table is indexed on `email` (unique) for login lookups.

**Why this matters:** without these indexes, every list query and analytics aggregation degrades to a sequential scan. With them, even 100k+ row queries return in milliseconds.

**Cost:** indexes add write overhead and disk space. Acceptable here because the app is read-heavy (lots of dashboard refreshes, occasional CRUD).

## Pagination

All list endpoints use offset/limit pagination with bounded page size. See [backend/app/schemas/pagination.py](../backend/app/schemas/pagination.py):

```python
page: int = Field(1, ge=1)
page_size: int = Field(20, ge=1, le=100)   # capped at 100
```

- **Why `page` + `page_size`?** Simplest contract for the client. URLs are bookmarkable.
- **Why cap at 100?** Prevents `page_size=1000000` from pulling the entire table into memory. A defensive guardrail against accidental or malicious overload.
- **Tradeoff:** offset pagination becomes slow at very deep pages (`OFFSET 1000000`). For our expected dataset size, this is a non-issue. If we ever hit millions of rows, we'd switch to keyset pagination (`WHERE id > last_id ORDER BY id LIMIT n`).

## Bulk insert in `seed.py`

The seed script generates synthetic employees via SQLAlchemy Core `insert()` + `executemany` in batches, not ORM `session.add_all()`. See [backend/scripts/seed.py](../backend/scripts/seed.py):

```python
db.execute(insert(Employee), batch)
db.commit()
```

- **Why Core instead of ORM?** Core skips the unit-of-work overhead (no identity map, no relationship tracking, no flush events). 10–100x speedup for bulk inserts.
- **Why batched commits?** A single 10k-row transaction would lock more rows for longer and risk OOM with very large datasets. Batching gives steady progress and bounded memory.
- **Result:** 10k rows complete in a few seconds; 100k in well under a minute.

## Analytics query design

All aggregations push computation to the database — we never pull the full table into Python. See [backend/app/repositories/analytics_repository.py](../backend/app/repositories/analytics_repository.py):

```python
# Good: DB-side aggregation
select(func.avg(Employee.salary)).scalar()

# Avoided: pull all rows, average in Python
[e.salary for e in db.query(Employee).all()] / n   # would be a disaster at scale
```

- **Group-by queries** (`avg_salary_by_country`, `count_by_department`, etc.) use `GROUP BY` + `func.avg/count` so Postgres can use the index on `country`/`department` for the grouping and return ~20 rows instead of 10k.
- **Filtered stats** (`salary_stats_for_country`) push the `WHERE country = ?` to SQL so Postgres only reads matching rows.

**Cost:** more SQL complexity in the repository. Worth it — these queries scale linearly with the *result* size, not the table size.

## Median computation tradeoff

Median is the one analytics metric we don't push entirely to SQL. See `salary_median()`:

```python
salaries = db.execute(select(Employee.salary).order_by(Employee.salary)).scalars().all()
return statistics.median(salaries)
```

- **Why not `percentile_cont`?** Postgres-specific. We considered it but kept the implementation portable.
- **Why is this OK?** We stream only one column (`salary`), which is indexed → already sorted on disk. For 10k rows this completes in <50ms.
- **Limit:** at ~100k+ rows we'd switch to `percentile_cont(0.5) WITHIN GROUP (ORDER BY salary)` or a materialized stat.

## Distribution histograms (integer bucketing)

For salary-distribution charts, buckets are computed via integer arithmetic in a single SQL pass:

```python
bucket_col = (Employee.salary - (Employee.salary % bucket_size)).label("bucket")
select(bucket_col, func.count()).group_by(bucket_col)
```

- **Why?** A salary of 67_000 with `bucket_size=25_000` lands in the 50_000 bucket. Returns ~10 rows (one per bucket), not 10k.
- **Used by:** the distribution chart on the analytics dashboard.

## Percentile rankings

`salary_percentiles()` streams the salary column once (sorted by index) and picks nearest-rank percentile values in Python:

```python
salaries = db.execute(select(Employee.salary).order_by(Employee.salary)).scalars().all()
for p in (10, 25, 50, 75, 90, 99):
    idx = max(0, min(n - 1, int((p / 100) * n)))
    result[f"p{p}"] = int(salaries[idx])
```

One pass through the data computes all six percentiles. Filter-aware (country/department) so per-slice rankings are equally fast.

## DISTINCT lookups for filter dropdowns

Filter dropdowns (country, department, job_title) need the unique values. The repository's `_distinct()` helper:

```python
select(column).distinct().where(column.is_not(None)).order_by(column)
```

Hits the index on the column, so it's an index-only scan rather than a full table scan.

## React Query caching (frontend)

Server state is cached client-side via React Query. See [frontend/src/hooks/](../frontend/src/hooks/).

- **`useEmployees`** — cached per filter combination. Returning to the page doesn't re-fetch immediately.
- **`useAnalytics`** — dashboard widgets share cache across pages.
- **Cache invalidation** — mutations (create/update/delete employee) invalidate the relevant query keys so the UI reflects the change without a manual refresh.
- **Result:** fewer redundant network calls; snappy navigation between pages.

## Auth token refresh

Axios interceptor in [frontend/src/api/](../frontend/src/api/) catches 401 responses, attempts a refresh, and replays the original request. Effects:

- Users stay logged in across the 30-minute access-token lifetime without seeing errors.
- A single 401 + refresh + retry happens transparently; the UI never shows a flash of unauthenticated state.

## Database connection pooling

The non-test code path configures SQLAlchemy with a connection pool. See [backend/app/db/session.py](../backend/app/db/session.py):

```python
create_engine(
    settings.DATABASE_URL,
    pool_size=settings.DB_POOL_SIZE,      # default 5
    max_overflow=settings.DB_MAX_OVERFLOW, # default 10
    pool_pre_ping=True,                    # detect stale connections
)
```

- **`pool_pre_ping`** issues a lightweight `SELECT 1` before each checkout, so a dropped Postgres connection (idle timeout, restart, network) doesn't surface as a request-time error.
- **`pool_size=5` + `max_overflow=10`** = up to 15 concurrent DB connections per worker. Tuned for the expected workload (1–3 concurrent admins doing CRUD + dashboard refreshes).

## Logging overhead

- JSON logs are only enabled when `LOG_JSON=true` (production), keeping local development readable.
- Request-id middleware adds a UUID per request without DB writes — it's purely in-memory tagging for log correlation.
- Log level defaults to `INFO`; debug-level SQL echo is gated behind `DB_ECHO=true` so it doesn't run in production.

## What we measured vs. what we estimated

- **Measured:** test suite finishes in 25 seconds with 198 tests + 97% coverage. Seed of 50 employees completes in ~10ms; 10k in ~1–2 seconds (local SQLite, similar on Postgres).
- **Estimated:** index speedup, DB-side aggregation savings — based on standard Postgres query planning knowledge rather than benchmarked here. For production deployment, the next step would be running EXPLAIN ANALYZE on the analytics endpoints with a representative dataset.

## Future performance work (not yet done)

These are listed in [knowledge-base.md](knowledge-base.md) under Future Improvements:

- **Redis cache** for dashboard endpoints — would reduce DB load if many users refresh the dashboard simultaneously.
- **Materialized views** for expensive group-by-country aggregations if the table grows past 100k rows.
- **Frontend code splitting** — route-based chunks to reduce initial bundle size.
- **Image/font preloading** — minor TTI improvement.
- **Postgres `percentile_cont`** for median if Postgres becomes the only target (which it now is — could be done as a follow-up).
