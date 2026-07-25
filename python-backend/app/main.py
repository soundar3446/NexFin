import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.db_upgrades import apply_schema_upgrades
from app.routers import accounts, analysis, auth, insights, chat, items, notice, sync

# Uvicorn only configures its own loggers; app.* INFO otherwise never reaches the console.
logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s:%(name)s:%(message)s",
    force=True,
)
logging.getLogger("app").setLevel(logging.INFO)

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
app.include_router(chat.router)


@app.get("/health")
def health():
    return {"status": "ok"}
