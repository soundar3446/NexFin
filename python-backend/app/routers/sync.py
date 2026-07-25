from fastapi import APIRouter, Depends, Header
from sqlalchemy.orm import Session

from app import schemas
from app.auth_utils import get_current_user_sub
from app.database import get_db
from app.sync_service import sync_accounts_and_transactions

router = APIRouter(prefix="/sync", tags=["sync"])


@router.post("/accounts", response_model=schemas.SyncResult)
async def sync_accounts(
    authorization: str = Header(...),
    user_sub: str = Depends(get_current_user_sub),
    db: Session = Depends(get_db),
):
    return await sync_accounts_and_transactions(db, user_sub, authorization)
