from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth_utils import get_current_user_sub
from app.database import get_db

router = APIRouter(prefix="/me/notice", tags=["notice"])


@router.get("", response_model=schemas.AcknowledgementStatus)
def get_notice_status(
    user_sub: str = Depends(get_current_user_sub),
    db: Session = Depends(get_db),
):
    ack = (
        db.query(models.DataUsageAcknowledgement)
        .filter(models.DataUsageAcknowledgement.user_sub == user_sub)
        .first()
    )
    if ack is None:
        return schemas.AcknowledgementStatus(acknowledged=False)
    return schemas.AcknowledgementStatus(acknowledged=True, acknowledged_at=ack.acknowledged_at)


@router.post("/ack", response_model=schemas.AcknowledgementStatus)
def acknowledge_notice(
    user_sub: str = Depends(get_current_user_sub),
    db: Session = Depends(get_db),
):
    ack = (
        db.query(models.DataUsageAcknowledgement)
        .filter(models.DataUsageAcknowledgement.user_sub == user_sub)
        .first()
    )
    if ack is None:
        ack = models.DataUsageAcknowledgement(user_sub=user_sub)
        db.add(ack)
        db.commit()
        db.refresh(ack)

    return schemas.AcknowledgementStatus(acknowledged=True, acknowledged_at=ack.acknowledged_at)
