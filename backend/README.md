# FastAPI backend

Python backend for the existing RentHub React application. It retains the current MySQL/MariaDB schema, JWT request header, `/api` routes, JSON response conventions, and product-image URLs.

## Setup

From the repository root in PowerShell:

```powershell
Copy-Item backend\.env.example backend\.env
# Configure JWT_SECRET, DB_* and optional RAZORPAY_* in backend\.env
python -m pip install -r backend\requirements.txt
Set-Location backend
python -m app.migrate
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 5000
```

`app.migrate` is a manual, idempotent, additive migration. It does not initialize, truncate, or seed the database. Back up existing data before schema changes. Do not run legacy Node initialization scripts against an existing database.

OpenAPI UI is available at `/docs`; health check is `/api/health`. The frontend runs separately from `frontend` using `npm install` and `npm run dev`.

## Tests

```powershell
python -m pytest -q
```

Tests use known synthetic values for deterministic statistical tests and do not write to the application database. Endpoint-level integration that requires MySQL or Razorpay credentials must be run against a configured test service; test results are not inferred from unit tests.

## Statistical analysis

Reusable functions are under `app/analysis`. Admin-only endpoints accept explicitly supplied observations at:

- `POST /api/analysis/descriptive`
- `POST /api/analysis/correlation`
- `POST /api/analysis/paired-task-time`

Observations are processed in memory and are not persisted. See [`ACADEMIC_METHODOLOGY.md`](ACADEMIC_METHODOLOGY.md) for variable choices, assumptions, and research conduct.

## Local AI recommendations

The local recommendation and search helpers are under `app/ai`. Recommendations create TF-IDF vectors from product names, descriptions, and categories, then rank related inventory using cosine similarity and aggregate rental counts. Customer recommendations can use that customer's own qualifying rental history; unauthenticated visitors receive popularity-based picks. Catalog search expands common rental synonyms (for example, `bike` to `bicycle`) before querying names and descriptions. These helpers do not call an external AI service or store a user profile.

- `GET /api/ai/recommendations` returns personalized picks when a customer has rental history, otherwise popular catalog picks.
- `GET /api/ai/recommendations?product_id=123` returns related active products for an item.
- `GET /api/ai/frequently-rented` returns active products ranked by approved, active, and completed rentals.

Recommendations are explanations and ranking scores, not purchase or availability guarantees. Availability is still checked separately during booking.
