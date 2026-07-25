# NexFin

FastAPI backend + React (Vite) frontend, with Postgres.

Stores and analyses Open Banking data — see [PRIVACY.md](PRIVACY.md) for the legal basis (PSD2/GDPR) and data model plan before adding any customer-data storage.

## Run everything with Docker

```
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:8000 (docs at /docs)
- Postgres: localhost:5432 (user/pass/db: `nexfin`)

## Run locally without Docker

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

Interactive docs (Swagger UI) are also available at `/docs` once the backend is running. A Postman collection covering all of these lives at `python-backend/NexFin-Backend.postman_collection.json`. For how each endpoint works internally and the service layer underneath it, see [python-backend/WIKI.md](python-backend/WIKI.md).

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | — | Liveness check |
| POST | `/auth/login` | — | Exchanges `{username, password}` for a Keycloak token (password grant), using `AUTH_CLIENT_ID`/`AUTH_CLIENT_SECRET` from env |
| GET | `/items/` | — | List items |
| POST | `/items/` | — | Create an item |
| GET | `/items/{item_id}` | — | Get an item by id (404 if missing) |
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

"Bearer" means the request needs an `Authorization: Bearer <token>` header — get a token from `/auth/login` first. For the `/accounts/*` routes the token is forwarded as-is to core-api; for `/me/notice*`, `/sync/*`, and `/analysis/*` the backend reads the token's `sub` claim to identify the user (signature isn't verified there — core-api independently verifies the token on every real data request). Run `/sync/accounts` before calling `/analysis/monthly-spending` — the analysis endpoint only reads what's already been synced into the DB, it doesn't hit core-api itself.
