import httpx
from fastapi import APIRouter, HTTPException

from app import schemas
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=schemas.TokenResponse)
async def login(payload: schemas.LoginRequest):
    if not settings.auth_token_url or not settings.auth_client_id:
        raise HTTPException(status_code=500, detail="Auth is not configured")

    form = {
        "client_id": settings.auth_client_id,
        "client_secret": settings.auth_client_secret,
        "username": payload.username,
        "password": payload.password,
        "grant_type": "password",
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(settings.auth_token_url, data=form)

    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return response.json()
