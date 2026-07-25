import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from app import schemas
from app.auth_utils import get_current_user_sub
from app.config import settings
from app.database import get_db
from app.sync_service import sync_accounts_and_transactions

router = APIRouter(prefix="/auth", tags=["auth"])


async def _sync_after_login(db: Session, authorization: str) -> None:
    try:
        user_sub = get_current_user_sub(authorization)
        await sync_accounts_and_transactions(db, user_sub, authorization)
    except Exception:
        # Best-effort — a failed post-login sync must never surface as a broken
        # login. The Insights page still triggers its own sync before reading data.
        pass


async def _exchange_token(form: dict) -> dict:
    if not settings.auth_token_url or not settings.auth_client_id:
        raise HTTPException(status_code=500, detail="Auth is not configured")

    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(30.0, connect=10.0)) as client:
            response = await client.post(settings.auth_token_url, data=form)
    except httpx.TimeoutException as exc:
        raise HTTPException(status_code=504, detail=f"Auth server request timed out: {exc}") from exc
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"Auth server request failed: {exc}") from exc

    if response.status_code != 200:
        detail = "Invalid or expired refresh token" if form.get("grant_type") == "refresh_token" else "Invalid credentials"
        raise HTTPException(status_code=401, detail=detail)

    return response.json()


@router.post("/login", response_model=schemas.TokenResponse)
async def login(
    payload: schemas.LoginRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    token_data = await _exchange_token(
        {
            "client_id": settings.auth_client_id,
            "client_secret": settings.auth_client_secret,
            "username": payload.username,
            "password": payload.password,
            "grant_type": "password",
        }
    )

    access_token = token_data.get("access_token")
    if access_token:
        background_tasks.add_task(_sync_after_login, db, f"Bearer {access_token}")

    return token_data


@router.post("/refresh", response_model=schemas.TokenResponse)
async def refresh(payload: schemas.RefreshRequest):
    return await _exchange_token(
        {
            "client_id": settings.auth_client_id,
            "client_secret": settings.auth_client_secret,
            "refresh_token": payload.refresh_token,
            "grant_type": "refresh_token",
        }
    )
