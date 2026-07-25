from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import chat_service, schemas
from app.auth_utils import get_current_user_sub
from app.database import get_db

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("", response_model=schemas.ChatResponse)
def chat(
    payload: schemas.ChatRequest,
    user_sub: str = Depends(get_current_user_sub),
    db: Session = Depends(get_db),
):
    result = chat_service.handle_chat(
        db,
        user_sub,
        payload.message,
        preferred_account_id=payload.account_id,
    )
    return schemas.ChatResponse(**result)
