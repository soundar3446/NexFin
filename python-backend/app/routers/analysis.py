from collections import defaultdict

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth_utils import get_current_user_sub
from app.database import get_db

router = APIRouter(prefix="/analysis", tags=["analysis"])


@router.get("/monthly-spending", response_model=list[schemas.MonthlySpendSummary])
def monthly_spending(
    user_sub: str = Depends(get_current_user_sub),
    db: Session = Depends(get_db),
):
    account_ids = [
        row[0]
        for row in db.query(models.Account.account_id)
        .filter(models.Account.user_sub == user_sub)
        .all()
    ]
    if not account_ids:
        return []

    transactions = (
        db.query(models.Transaction).filter(models.Transaction.account_id.in_(account_ids)).all()
    )

    months = defaultdict(
        lambda: {
            "total_spend": 0.0,
            "total_income": 0.0,
            "pending_spend": 0.0,
            "pending_income": 0.0,
            "transaction_count": 0,
            "by_category": defaultdict(float),
            "by_merchant": defaultdict(float),
        }
    )

    for txn in transactions:
        month_key = txn.booking_datetime.strftime("%Y-%m")
        bucket = months[month_key]
        amount = float(txn.amount)
        is_pending = txn.status == "PDNG"
        bucket["transaction_count"] += 1

        if txn.credit_debit_indicator == "Debit":
            bucket["total_spend"] += amount
            if is_pending:
                bucket["pending_spend"] += amount
            bucket["by_category"][txn.merchant_category_code or "Uncategorised"] += amount
            bucket["by_merchant"][txn.merchant_name or "Unknown"] += amount
        else:
            bucket["total_income"] += amount
            if is_pending:
                bucket["pending_income"] += amount

    result = []
    for month_key in sorted(months.keys(), reverse=True):
        bucket = months[month_key]
        result.append(
            schemas.MonthlySpendSummary(
                month=month_key,
                total_spend=round(bucket["total_spend"], 2),
                total_income=round(bucket["total_income"], 2),
                pending_spend=round(bucket["pending_spend"], 2),
                pending_income=round(bucket["pending_income"], 2),
                transaction_count=bucket["transaction_count"],
                by_category=[
                    schemas.MonthlyCategoryBreakdown(merchant_category_code=code, total=round(total, 2))
                    for code, total in sorted(
                        bucket["by_category"].items(), key=lambda kv: -kv[1]
                    )
                ],
                by_merchant=[
                    schemas.MonthlyMerchantBreakdown(merchant_name=name, total=round(total, 2))
                    for name, total in sorted(
                        bucket["by_merchant"].items(), key=lambda kv: -kv[1]
                    )
                ],
            )
        )
    return result
