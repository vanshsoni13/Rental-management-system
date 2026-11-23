# Rental-management-systeam
A rental management system with integrated razorpay payment gateway

# RentHub Rental Management System

The existing React/Vite application now uses a Python/FastAPI REST backend and the existing MySQL/MariaDB database. The frontend pages, components, styles, and Vite API proxy remain in place.

## Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Axios, React Router
- **Backend:** Python 3.10+, FastAPI, Pydantic request parsing, PyMySQL, JWT, bcrypt
- **Database:** Existing MySQL/MariaDB schema and records
- **Payments:** Razorpay Test Mode (server-side order verification) and cash collection
- **AI:** Local TF-IDF content-based rental recommendations with popularity and customer rental-history signals
- **Analysis:** SciPy-backed descriptive, correlation, and paired task-time analysis

## Run locally (Windows)

Prerequisites: Python 3.10 or later, Node.js/npm (for the existing frontend), and a running MySQL-compatible database.

1. Configure the backend environment:

   ```powershell
   Copy-Item backend\.env.example backend\.env
   ```

   Set `JWT_SECRET` to a unique random value of at least 32 characters and enter the existing database connection details. Add Razorpay Test Mode credentials only if online checkout is being tested. Never put secrets in frontend variables.

2. Install Python dependencies and apply the safe, additive schema updates:

   ```powershell
   python -m pip install -r backend\requirements.txt
   Set-Location backend
   python -m app.migrate
   ```

   The migration is explicit and idempotent. It adds missing feature columns/tables and enum values without dropping the existing rental, payment, user, or product data. Back up the database before applying schema changes. Do **not** run the old database initialization/seed scripts against an existing database.

3. Start the API (from `backend`):

   ```powershell
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 5000
   ```

   API health: `http://localhost:5000/api/health`
   Interactive OpenAPI docs: `http://localhost:5000/docs`

4. In another terminal, run the unchanged frontend:

   ```powershell
   Set-Location frontend
   npm install
   npm run dev
   ```

   Open `http://localhost:3000`. Vite continues to proxy `/api` and `/uploads` to port 5000. `run-project.bat` starts both servers.

5. Run backend tests (from `backend`):

   ```powershell
   python -m pytest -q
   ```

## Configuration

See [`backend/.env.example`](backend/.env.example). `CORS_ORIGINS` is a comma-separated allowlist; by default it permits only the local Vite development origins. Keep database and Razorpay credentials server-side. The API refuses to issue tokens until a `JWT_SECRET` is configured.

## API compatibility and data flow

The frontend keeps its `/api` base URL and existing JSON shapes. The API validates requests, authenticates the existing Authorization header convention, checks the user's role and record ownership, runs parameterized MySQL queries/transactions, then returns JSON to the existing pages. Product images remain under `/uploads/products`.

| API group | Existing workflows |
|---|---|
| `/api/auth` | Customer/seller registration, login, current profile |
| `/api/categories`, `/api/products` | Catalog filtering, availability, owner/admin product CRUD and image upload |
| `/api/sellers`, `/api/admin/sellers` | Seller application, profile, approval, dashboard and reports |
| `/api/rentals`, `/api/customer`, `/api/admin` | Booking, status changes, dashboards, customer/rental/revenue reports |
| `/api/payments` | Razorpay order creation/signature and gateway-state verification, COD/cash collection |
| `/api/returns`, `/api/invoices`, `/api/late-fees`, `/api/security-deposits` | Returns, invoices, fee calculations, deposit accounting and audit logs |
| `/api/notifications` | User-scoped notification listing and updates |
| `/api/ai` | Local recommendations, similar items, and frequently rented products |
| `/api/analysis` | Admin-only analysis endpoints; supplied observations are analyzed in memory and not stored |

Razorpay secrets are not returned to the browser. Payment verification checks the HMAC signature and confirms captured amount/currency/order status with Razorpay before updating MySQL. The legacy mock-payment endpoint is disabled unless `ENABLE_MOCK_PAYMENTS=true`, and it is always disabled when `APP_ENV=production` or `NODE_ENV=production`.

## Migration notes

- The original frontend and UI were not recreated or redesigned.
- MySQL/MariaDB and existing records are retained; the Python service does not initialize or seed the database at startup.
- Run `python -m app.migrate` only after reviewing and backing up the configured database. It is not run implicitly when the server starts.
- Existing Razorpay Test Mode setup must use a test key ID beginning with `rzp_test_`.
- Use TLS, a strong secret manager, restricted database permissions, and a production CORS allowlist for deployment.

## Academic material

[`backend/ACADEMIC_METHODOLOGY.md`](backend/ACADEMIC_METHODOLOGY.md) documents the five design-thinking stages, a proposed non-fabricated survey and sampling plan, the Python/web architecture, local AI recommendation method, analysis methods, assumptions, and limitations. No user research results or prototype effectiveness claims are invented.


razorpay card detail 
5555 5100 0008 1006
12/30
123
test user