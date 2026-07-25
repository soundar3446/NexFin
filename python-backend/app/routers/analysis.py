from collections import defaultdict

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth_utils import get_current_user_sub
from app.database import get_db

router = APIRouter(prefix="/analysis", tags=["analysis"])


def _compute_monthly_summaries(db: Session, user_sub: str) -> list[schemas.MonthlySpendSummary]:
    """Returns monthly summaries in ascending (oldest-first) month order."""
    accounts = db.query(models.Account).filter(models.Account.user_sub == user_sub).all()
    if not accounts:
        return []

    account_nicknames = {account.account_id: account.nickname for account in accounts}
    account_ids = list(account_nicknames.keys())

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
            "by_account": defaultdict(
                lambda: {"total_spend": 0.0, "total_income": 0.0, "transaction_count": 0}
            ),
        }
    )

    for txn in transactions:
        month_key = txn.booking_datetime.strftime("%Y-%m")
        bucket = months[month_key]
        amount = float(txn.amount)
        is_pending = txn.status == "PDNG"
        bucket["transaction_count"] += 1

        account_bucket = bucket["by_account"][txn.account_id]
        account_bucket["transaction_count"] += 1

        if txn.credit_debit_indicator == "Debit":
            bucket["total_spend"] += amount
            account_bucket["total_spend"] += amount
            if is_pending:
                bucket["pending_spend"] += amount
            bucket["by_category"][txn.merchant_category_code or "Uncategorised"] += amount
            bucket["by_merchant"][txn.merchant_name or "Unknown"] += amount
        else:
            bucket["total_income"] += amount
            account_bucket["total_income"] += amount
            if is_pending:
                bucket["pending_income"] += amount

    summaries = []
    for month_key in sorted(months.keys()):
        bucket = months[month_key]
        summaries.append(
            schemas.MonthlySpendSummary(
                month=month_key,
                total_spend=round(bucket["total_spend"], 2),
                total_income=round(bucket["total_income"], 2),
                pending_spend=round(bucket["pending_spend"], 2),
                pending_income=round(bucket["pending_income"], 2),
                transaction_count=bucket["transaction_count"],
                by_category=[
                    schemas.MonthlyCategoryBreakdown(merchant_category_code=code, total=round(total, 2))
                    for code, total in sorted(bucket["by_category"].items(), key=lambda kv: -kv[1])
                ],
                by_merchant=[
                    schemas.MonthlyMerchantBreakdown(merchant_name=name, total=round(total, 2))
                    for name, total in sorted(bucket["by_merchant"].items(), key=lambda kv: -kv[1])
                ],
                by_account=[
                    schemas.MonthlyAccountBreakdown(
                        account_id=account_id,
                        nickname=account_nicknames.get(account_id),
                        total_spend=round(account_bucket["total_spend"], 2),
                        total_income=round(account_bucket["total_income"], 2),
                        transaction_count=account_bucket["transaction_count"],
                    )
                    for account_id, account_bucket in sorted(
                        bucket["by_account"].items(), key=lambda kv: -kv[1]["total_spend"]
                    )
                ],
            )
        )
    return summaries


@router.get("/monthly-spending", response_model=list[schemas.MonthlySpendSummary])
def monthly_spending(
    user_sub: str = Depends(get_current_user_sub),
    db: Session = Depends(get_db),
):
    return list(reversed(_compute_monthly_summaries(db, user_sub)))


@router.get("/financial-health", response_model=list[schemas.MonthlyHealthSummary])
def financial_health(
    user_sub: str = Depends(get_current_user_sub),
    db: Session = Depends(get_db),
):
    summaries = _compute_monthly_summaries(db, user_sub)
    result = []

    for i, summary in enumerate(summaries):
        observations = []

        if summary.total_income > 0:
            ratio = summary.total_spend / summary.total_income
            if ratio > 1:
                observations.append(
                    schemas.HealthObservation(
                        type="spend_vs_income",
                        severity="warning",
                        message=f"Spending exceeded income by {round((ratio - 1) * 100)}% this month.",
                    )
                )
            elif ratio > 0.8:
                observations.append(
                    schemas.HealthObservation(
                        type="spend_vs_income",
                        severity="info",
                        message=f"Spending used {round(ratio * 100)}% of income this month.",
                    )
                )
            else:
                observations.append(
                    schemas.HealthObservation(
                        type="spend_vs_income",
                        severity="good",
                        message=f"Spending stayed within {round(ratio * 100)}% of income this month.",
                    )
                )
        elif summary.total_spend > 0:
            observations.append(
                schemas.HealthObservation(
                    type="spend_vs_income",
                    severity="warning",
                    message="Spending occurred with no recorded income this month.",
                )
            )

        if i > 0 and summaries[i - 1].total_spend > 0:
            prev_spend = summaries[i - 1].total_spend
            change = (summary.total_spend - prev_spend) / prev_spend
            if change > 0.2:
                observations.append(
                    schemas.HealthObservation(
                        type="trend",
                        severity="warning",
                        message=f"Spending increased {round(change * 100)}% compared to last month.",
                    )
                )
            elif change < -0.2:
                observations.append(
                    schemas.HealthObservation(
                        type="trend",
                        severity="good",
                        message=f"Spending decreased {round(abs(change) * 100)}% compared to last month.",
                    )
                )

        if summary.total_spend > 0 and summary.by_category:
            top_category = summary.by_category[0]
            share = top_category.total / summary.total_spend
            if share > 0.5:
                observations.append(
                    schemas.HealthObservation(
                        type="concentration",
                        severity="info",
                        message=(
                            f"{round(share * 100)}% of spending this month was in one category "
                            f"({top_category.merchant_category_code})."
                        ),
                    )
                )

        if not observations:
            observations.append(
                schemas.HealthObservation(
                    type="none",
                    severity="info",
                    message="No notable financial health signals this month.",
                )
            )

        result.append(schemas.MonthlyHealthSummary(month=summary.month, observations=observations))

    return list(reversed(result))
