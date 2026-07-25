from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routers import accounts, auth, items, notice

Base.metadata.create_all(bind=engine)

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


@app.get("/health")
def health():
    return {"status": "ok"}
