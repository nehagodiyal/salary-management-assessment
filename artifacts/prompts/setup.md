# Setup Guide

End-to-end instructions to clone the repo and have the app running locally.

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| **Python** | 3.13 | The backend pins `psycopg2-binary==2.9.10` because earlier versions have no wheel for 3.13 |
| **Node.js** | 18+ | Vite 5 requires Node 18 |
| **PostgreSQL** | 17 | Earlier 13+ versions also work — adjust the URL accordingly |
| **npm** or **pnpm** | latest | Either works |
| **git** | any recent | Standard clone workflow |

Verify versions:

```bash
python --version       # 3.13.x
node --version         # 18.x or higher
psql --version         # 17.x (or 13+)
```

## 1. Clone the repository

```bash
git clone <repo-url>
cd salary-management
```

## 2. Set up PostgreSQL

Create a database and confirm you can connect:

```bash
# As the postgres superuser:
psql -U postgres -c "CREATE DATABASE salary_management;"

# Verify:
psql -U postgres -d salary_management -c "SELECT current_database();"
```

If you don't remember your postgres password, follow your installer's password-reset procedure (e.g., temporarily switch `pg_hba.conf` to `trust`, `ALTER USER postgres WITH PASSWORD '...'`, then revert).

## 3. Backend setup

```bash
cd backend

# Create and activate a virtualenv
python -m venv .venv
source .venv/bin/activate                # macOS/Linux
# .venv\Scripts\activate                 # Windows

# Install dependencies
pip install -r requirements.txt

# Copy the example env file and edit it
cp .env.example .env
```

Open [backend/.env](../backend/.env) and set at minimum:

```
DATABASE_URL=postgresql+psycopg2://postgres:YOUR_PASSWORD@localhost:5432/salary_management
SECRET_KEY=<generate with: python -c "import secrets; print(secrets.token_urlsafe(48))">
CORS_ORIGINS=http://localhost:3000
```

Run migrations to create tables:

```bash
alembic upgrade head
```

Create the bootstrap admin user:

```bash
ADMIN_EMAIL=admin@example.com \
ADMIN_PASSWORD='YourStrongPassword' \
python scripts/create_admin.py
```

(Optional) Seed sample employees so the analytics dashboard has data:

```bash
python scripts/seed.py --count 100 -f
```

Start the backend:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Verify the API is up:

```bash
curl http://localhost:8000/health
# {"status":"ok","app":"Salary Management API","version":"0.1.0","env":"development"}
```

OpenAPI docs are at [http://localhost:8000/docs](http://localhost:8000/docs).

## 4. Frontend setup

In a **new terminal**:

```bash
cd frontend
npm install
npm run dev
```

Vite will start the dev server at [http://localhost:3000](http://localhost:3000) (port is pinned in [vite.config.js](../frontend/vite.config.js)).

## 5. Log in

Open [http://localhost:3000](http://localhost:3000) and log in with the admin email + password you set in step 3.

You should see:
- Dashboard with stat cards
- Employees page populated from the seeded data
- Analytics page with charts

## Running tests

**Backend:**
```bash
cd backend
.venv/bin/pytest -q
```

Tests use in-memory SQLite (not Postgres) for speed — this is a test-only optimization; production runs on Postgres.

**Frontend:**
```bash
cd frontend
npm test
```

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `psycopg2.OperationalError: connection refused` | Postgres not running | `pg_isready -h localhost -p 5432` to check |
| `psycopg2 wheel build fails` | Using `psycopg2-binary` < 2.9.10 on Python 3.13 | Already pinned in requirements.txt to 2.9.10 |
| Login returns 401 | Wrong credentials or admin not created | Re-run `scripts/create_admin.py` |
| Browser network errors | Backend not running | Start uvicorn in a second terminal |
| CORS error in browser | Vercel/other origin not in `CORS_ORIGINS` | Add it to `backend/.env` |
| Port 3000 already in use | Another Vite/dev server running | Kill it or change the port in `vite.config.js` |

## Production deployment (preview)

For deploying to Render (backend) + Vercel (frontend):

1. **Render** — create a Web Service from the repo, root dir `backend/`, build `pip install -r requirements.txt`, start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`. Add a free Postgres database, copy its Internal URL into `DATABASE_URL`.
2. **Vercel** — create a project, root dir `frontend/`, Vite framework preset. Set `VITE_API_BASE_URL` to your Render service URL.
3. **CORS** — add the Vercel URL to `CORS_ORIGINS` on Render.

See the future-work section of [knowledge-base.md](knowledge-base.md) for the full deploy checklist.
