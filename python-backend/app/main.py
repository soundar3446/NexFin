from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.db_upgrades import apply_schema_upgrades
from app.routers import accounts, analysis, auth, insights, items, notice, sync

Base.metadata.create_all(bind=engine)
apply_schema_upgrades()

app = FastAPI(title="NexFin API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(items.router)
app.include_router(auth.router)
app.include_router(accounts.router)
app.include_router(notice.router)
app.include_router(sync.router)
app.include_router(analysis.router)
app.include_router(insights.router)


@app.get("/health")
def health():
    return {"status": "ok"}
