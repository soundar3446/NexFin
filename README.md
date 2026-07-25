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
