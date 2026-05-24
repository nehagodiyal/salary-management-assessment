"""Seed the employees table with synthetic data.

Run from the `backend/` directory:

    python scripts/seed.py                # 10,000 employees, deterministic
    python scripts/seed.py --count 500    # smaller dataset
    python scripts/seed.py --force        # skip the confirmation prompt
    python scripts/seed.py --no-truncate  # append instead of replace
    python scripts/seed.py --seed 7       # different random seed

Performance: uses SQLAlchemy Core `insert()` + executemany in chunks so 10k
rows complete in a few seconds on Postgres, with `--batch-size` commits.
"""
from __future__ import annotations

import argparse
import logging
import random
import sys
import time
import uuid
from datetime import date, timedelta
from pathlib import Path
from typing import Dict, Iterable, List

# Make `app.*` importable when running this file as a script (not via -m).
_BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

from sqlalchemy import delete, func, insert, select  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

from app.core.enums import EmploymentStatus  # noqa: E402
from app.core.logger import configure_logging, get_logger  # noqa: E402
from app.db.session import SessionLocal  # noqa: E402
from app.models.employee import Employee  # noqa: E402

# ---------- File layout (per artifacts/seeding.md) ----------

DATA_DIR = Path(__file__).resolve().parent
FIRST_NAMES_PATH = DATA_DIR / "first_names.txt"
LAST_NAMES_PATH = DATA_DIR / "last_names.txt"
COUNTRIES_PATH = DATA_DIR / "countries.txt"
JOB_TITLES_PATH = DATA_DIR / "job_titles.txt"

# ---------- Defaults ----------

DEFAULT_COUNT = 10_000
DEFAULT_BATCH_SIZE = 1_000
DEFAULT_SEED = 42

# ---------- Salary configuration ----------

# Base salary per department (whole currency units, expressed in a "USA equivalent").
DEPARTMENT_BASE_SALARY: Dict[str, int] = {
    "Engineering": 95_000,
    "Product": 90_000,
    "Sales": 75_000,
    "Marketing": 70_000,
    "Finance": 80_000,
    "HR": 65_000,
    "Operations": 60_000,
    "Customer Success": 65_000,
}

# Cost-of-living / market multiplier per country.
COUNTRY_MULTIPLIERS: Dict[str, float] = {
    "United States": 1.20,
    "United Kingdom": 1.05,
    "Germany": 1.00,
    "France": 0.95,
    "Spain": 0.85,
    "Netherlands": 1.10,
    "Sweden": 1.05,
    "Canada": 1.00,
    "Australia": 1.05,
    "India": 0.55,
    "Brazil": 0.65,
    "Mexico": 0.60,
    "Singapore": 1.10,
    "Japan": 1.05,
    "United Arab Emirates": 1.00,
}

# Seniority keywords detected in the job title -> salary multiplier.
SENIORITY_KEYWORDS = [
    (("Staff", "Lead", "Principal", "VP", "Head", "Director", "CFO"), 1.8),
    (("Senior", "Sr", "Manager", "Controller"), 1.4),
    (("Junior", "Jr", "Coordinator", "Specialist", "BDR", "Recruiter"), 0.85),
]


logger = get_logger("scripts.seed")


# ---------- Public API ----------

def seed_employees(
    db: Session,
    *,
    count: int = DEFAULT_COUNT,
    batch_size: int = DEFAULT_BATCH_SIZE,
    seed: int = DEFAULT_SEED,
    truncate: bool = True,
) -> int:
    """Insert `count` synthetic employees. Returns rows inserted.

    Deterministic for a given `seed`. Commits once per batch so failures
    don't lose all progress.
    """
    if count <= 0:
        return 0
    if batch_size <= 0:
        raise ValueError("batch_size must be positive")

    rng = random.Random(seed)
    first_names = _load_names(FIRST_NAMES_PATH)
    last_names = _load_names(LAST_NAMES_PATH)
    countries = _load_names(COUNTRIES_PATH)
    titles_by_dept = _load_job_titles(JOB_TITLES_PATH)
    flat_titles: List[tuple[str, str]] = [
        (dept, title) for dept, titles in titles_by_dept.items() for title in titles
    ]

    if truncate:
        deleted = db.execute(delete(Employee)).rowcount
        db.commit()
        logger.info("Truncated employees table (removed %d rows)", deleted)

    started = time.perf_counter()
    inserted = 0
    for batch in _batched(
        _row_generator(count, first_names, last_names, countries, flat_titles, rng),
        batch_size,
    ):
        db.execute(insert(Employee), batch)
        db.commit()
        inserted += len(batch)
        logger.info("Inserted batch: total=%d / %d", inserted, count)

    elapsed = time.perf_counter() - started
    logger.info(
        "Seeded %d employees in %.2fs (%.0f rows/s)",
        inserted,
        elapsed,
        inserted / max(elapsed, 1e-9),
    )
    return inserted


# ---------- File loaders ----------

def _load_names(path: Path) -> List[str]:
    if not path.exists():
        raise FileNotFoundError(f"Required data file missing: {path}")
    lines = [
        line.strip()
        for line in path.read_text().splitlines()
        if line.strip() and not line.startswith("#")
    ]
    if not lines:
        raise ValueError(f"Data file is empty: {path}")
    return lines


def _load_job_titles(path: Path) -> Dict[str, List[str]]:
    """Parse `Department:Title` lines into {department: [titles, ...]}."""
    result: Dict[str, List[str]] = {}
    for line in _load_names(path):
        if ":" not in line:
            raise ValueError(
                f"Invalid line in {path.name} (expected 'Department:Title'): {line!r}"
            )
        dept, title = line.split(":", 1)
        dept, title = dept.strip(), title.strip()
        if not dept or not title:
            raise ValueError(f"Empty department or title in {path.name}: {line!r}")
        result.setdefault(dept, []).append(title)
    return result


# ---------- Row generation ----------

def _row_generator(count, first_names, last_names, countries, flat_titles, rng):
    for i in range(count):
        yield _make_row(i, first_names, last_names, countries, flat_titles, rng)


def _make_row(index, first_names, last_names, countries, flat_titles, rng):
    first = rng.choice(first_names)
    last = rng.choice(last_names)
    department, title = rng.choice(flat_titles)
    country = rng.choice(countries)

    return {
        "id": str(uuid.uuid4()),
        "full_name": f"{first} {last}",
        # `index` guarantees email uniqueness even when names collide.
        "email": f"{first.lower()}.{last.lower()}.{index}@example.com",
        "phone": f"+1-{rng.randint(200, 999)}-{rng.randint(100, 999)}-{rng.randint(1000, 9999)}",
        "country": country,
        "department": department,
        "job_title": title,
        "salary": _generate_salary(department, title, country, rng),
        "hire_date": _generate_hire_date(rng),
        "status": _generate_status(rng),
    }


def _generate_salary(department: str, title: str, country: str, rng: random.Random) -> int:
    base = DEPARTMENT_BASE_SALARY.get(department, 60_000)
    seniority = _seniority_multiplier(title)
    country_mult = COUNTRY_MULTIPLIERS.get(country, 1.0)
    noise = rng.uniform(0.85, 1.20)
    return max(1, int(round(base * seniority * country_mult * noise)))


def _seniority_multiplier(title: str) -> float:
    title_lower = title.lower()
    for keywords, multiplier in SENIORITY_KEYWORDS:
        if any(kw.lower() in title_lower for kw in keywords):
            return multiplier
    return 1.0


def _generate_hire_date(rng: random.Random) -> date:
    """Random hire date in the last 10 years."""
    return date.today() - timedelta(days=rng.randint(0, 365 * 10))


def _generate_status(rng: random.Random) -> str:
    # 90% active, 7% on leave, 3% terminated — keeps analytics interesting.
    r = rng.random()
    if r < 0.90:
        return EmploymentStatus.ACTIVE.value
    if r < 0.97:
        return EmploymentStatus.ON_LEAVE.value
    return EmploymentStatus.TERMINATED.value


# ---------- Batch helper ----------

def _batched(iterable: Iterable[dict], size: int) -> Iterable[List[dict]]:
    batch: List[dict] = []
    for item in iterable:
        batch.append(item)
        if len(batch) >= size:
            yield batch
            batch = []
    if batch:
        yield batch


# ---------- Confirmation guard ----------

def _confirm_or_abort(db: Session, args: argparse.Namespace) -> bool:
    """Return True if we should proceed, False if the user aborted.

    Empty DB or `--force`: proceed silently. Otherwise prompt on a TTY,
    refuse outright on a non-TTY pipe (CI, redirection) so accidental
    automation can't wipe data.
    """
    existing = int(db.execute(select(func.count()).select_from(Employee)).scalar_one())
    if existing == 0:
        return True
    if args.force:
        logger.warning("Skipping confirmation prompt (--force). Existing rows: %d", existing)
        return True

    warning = f"⚠️  Database already contains {existing:,} employees."
    if args.no_truncate:
        detail = f"This will APPEND {args.count:,} more employees."
    else:
        detail = "Re-seeding will DELETE all existing employees and insert new ones."

    if not sys.stdin.isatty():
        # Pipe / CI / nohup: never silently destroy data.
        print(warning, file=sys.stderr)
        print("Refusing to proceed in non-interactive mode without --force.", file=sys.stderr)
        return False

    print(warning)
    print(detail)
    try:
        answer = input("Continue? [y/N]: ").strip().lower()
    except (EOFError, KeyboardInterrupt):
        print("\nAborted.")
        return False

    if answer in ("y", "yes"):
        return True
    print("Aborted. No changes were made.")
    return False


# ---------- CLI entry ----------

def _parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed the employees table.")
    parser.add_argument("--count", type=int, default=DEFAULT_COUNT)
    parser.add_argument("--batch-size", type=int, default=DEFAULT_BATCH_SIZE)
    parser.add_argument("--seed", type=int, default=DEFAULT_SEED)
    parser.add_argument(
        "--no-truncate",
        action="store_true",
        help="Append to existing rows instead of clearing the table first.",
    )
    parser.add_argument(
        "-f",
        "--force",
        action="store_true",
        help="Skip the confirmation prompt when existing data is present.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = _parse_args(argv)

    configure_logging()
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)

    with SessionLocal() as db:
        if not _confirm_or_abort(db, args):
            return 1
        seed_employees(
            db,
            count=args.count,
            batch_size=args.batch_size,
            seed=args.seed,
            truncate=not args.no_truncate,
        )
    return 0


if __name__ == "__main__":
    sys.exit(main())
