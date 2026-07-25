# NexFin

Open Banking account aggregation with AI-assisted spend analysis: connect a bank account via Open Banking, sync its transactions, and get monthly spending breakdowns, financial-health observations, and AI-generated insights — with a rule-based fallback for everything the AI produces, so nothing breaks silently if the model is unavailable.

## Features

- **Login** via Keycloak (OAuth2 password grant) against an Open Banking sandbox, with a one-time data-usage notice on first login.
- **Live account access** — accounts, balances, and transactions proxied straight from the bank's Open Banking API (OBIE AISP v4.0).
- **Sync to Postgres** — a local copy of accounts and full transaction history, fetched concurrently per account, so analysis doesn't have to hit the bank on every request.
- **Monthly spending analysis** — totals, pending-vs-settled split, and breakdowns by category, merchant, and account.
- **Financial health observations** — spend-vs-income ratio, month-over-month trend, category concentration, each independently flagged good/info/warning.
- **AI-powered insights** — category breakdown, income/expense trend, and unusual-spending (anomaly) detection, each with a plain-English summary from an LLM and a templated fallback sentence if the model isn't reachable. Transaction categorization itself falls back to merchant-keyword and merchant-category-code rules.
- **Anomaly detection** — flags unusually large transactions relative to their category's typical spend, and duplicate charges from the same merchant within 24 hours.
- **React dashboard** — overview, accounts, per-account detail (overview/transactions/insights), transactions, and insights pages, with light/dark theme support.

## Architecture

A React client talks to one FastAPI backend, which is the only thing that touches the database or calls out to external services (Keycloak for login, the bank's core-api for account data, Hugging Face for AI insights). Diagrams (system view, an example call sequence) are in **[ARCHITECTURE.md](ARCHITECTURE.md)**.

For how a specific endpoint calculates its results, see [ENDPOINTS.md](ENDPOINTS.md). For the code-level implementation and service layer, see [python-backend/WIKI.md](python-backend/WIKI.md). For the legal/data-handling rationale (PSD2/GDPR) behind what gets stored, see [PRIVACY.md](PRIVACY.md).

## Tech stack

| | |
|---|---|
| Backend | FastAPI, SQLAlchemy, PostgreSQL, httpx |
| Auth | Keycloak (OAuth2 password grant), PyJWT (reading claims only) |
| Banking data | Open Banking core-api (OBIE AISP v4.0) |
| AI | Hugging Face inference API (categorization + narrative insights) |
| Frontend | React + Vite, React Router |
| Infra | Docker Compose |

## Getting started

### Run everything with Docker

```
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000 (docs at `/docs`)
- Postgres: localhost:5432 (user/pass/db: `nexfin`)

### Run locally without Docker

Backend (requires Python 3.10+):

```
cd python-backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # point DATABASE_URL at a local Postgres if not using Docker's db
uvicorn app.main:app --reload
```

Frontend (requires Node 20+):

```
cd react-frontend
npm install
cp .env.example .env
npm run dev
```

## Endpoints

Interactive docs (Swagger UI) are available at `/docs` once the backend is running. A Postman collection covering the backend directly lives at `python-backend/NexFin-Backend.postman_collection.json`.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | — | Liveness check |
| POST | `/auth/login` | — | Exchanges `{username, password}` for a Keycloak token (password grant), using `AUTH_CLIENT_ID`/`AUTH_CLIENT_SECRET` from env. Access tokens are short-lived (5 min in the sandbox) — also kicks off a background sync of the caller's accounts/transactions |
| POST | `/auth/refresh` | — | Exchanges `{refresh_token}` for a new access/refresh token pair (Keycloak refresh-token grant), without requiring the username/password again |
| GET | `/accounts?type=` | Bearer | Proxies to core-api: list accounts (optional `type` filter, e.g. `domestic`) |
| GET | `/accounts/{account_id}` | Bearer | Proxies to core-api: single account |
| GET | `/accounts/{account_id}/balances` | Bearer | Proxies to core-api: account balances |
| GET | `/accounts/{account_id}/transactions?pageIndex=&pageSize=` | Bearer | Proxies to core-api: account transactions, paginated |
| GET | `/me/notice` | Bearer | Whether the current user has acknowledged the data-usage notice (`{acknowledged, acknowledged_at}`) |
| POST | `/me/notice/ack` | Bearer | Records the current user's acknowledgement (idempotent) |
| DELETE | `/me/notice/ack` | Bearer | Revokes the current user's acknowledgement (idempotent) |
| POST | `/sync/accounts` | Bearer | Pulls the caller's accounts + all transactions from core-api and upserts them into the DB (see [PRIVACY.md](PRIVACY.md) for exactly which fields are stored and why) |
| GET | `/analysis/monthly-spending` | Bearer | Reads the caller's stored transactions and returns per-month spend/income totals (with a pending vs. settled breakdown) plus category, merchant, and per-account breakdowns |
| GET | `/analysis/financial-health` | Bearer | Per-month observations derived from the same stored transactions: spend-vs-income ratio, month-over-month spending trend, and category concentration (each flagged `good`/`info`/`warning`) |
| GET | `/insights/category-breakdown?months=` | Bearer | AI-categorized spend by category over a rolling window, with a plain-English summary |
| GET | `/insights/income-expense-trend?months=` | >Bearer | Monthly income/expense/net trend with averages and savings rate, with a plain-English summary |
| GET | `/insights/unusual-spending?months=` | Bearer | Flags unusually large transactions and duplicate charges, with a plain-English summary |

"Bearer" means the request needs an `Authorization: Bearer <token>` header — get a token from `/auth/login` first. For the `/accounts/*` routes the token is forwarded as-is to core-api; for `/me/notice*`, `/sync/*`, `/analysis/*`, and `/insights/*` the backend reads the token's `sub` claim to identify the user (signature isn't verified there — core-api independently verifies the token on every real data request). Run `/sync/accounts` before calling `/analysis/*` or `/insights/*` — those endpoints only read what's already been synced into the DB, they don't hit core-api themselves.

## Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** — system diagram and an example end-to-end call sequence.
- **[ENDPOINTS.md](ENDPOINTS.md)** — the logic behind each endpoint: what's calculated and how, no code.
- **[CALCULATIONS.md](CALCULATIONS.md)** — the same logic with fields used and a worked numeric example for each endpoint.
- **[FRONTEND_ENDPOINTS.md](FRONTEND_ENDPOINTS.md)** — which frontend page calls which backend endpoint.
- **[python-backend/WIKI.md](python-backend/WIKI.md)** — code-level implementation and the service layer underneath each endpoint.
- **[PRIVACY.md](PRIVACY.md)** — the legal basis (PSD2/GDPR) and data model rationale for what gets stored.


Recording link - https://drive.google.com/file/d/1UVnmVVwBDPPDwVWKfQ-PmaawFCJnUGxZ/view?usp=drive_link