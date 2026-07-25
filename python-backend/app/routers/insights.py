from collections import defaultdict
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app import models, schemas
from app.anomaly_detector import detect_unusual_spending
from app.auth_utils import get_current_user_sub
from app.categorizer import categorize_transactions
from app.database import get_db
from app.narratives import (
    category_breakdown_insight,
    income_expense_trend_insight,
    unusual_spending_insight,
)

router = APIRouter(prefix="/insights", tags=["insights"])


def _months_ago(months: int) -> datetime:
    now = datetime.now(timezone.utc)
    year, month = now.year, now.month - months
    while month <= 0:
        month += 12
        year -= 1
    return now.replace(year=year, month=month, day=1, hour=0, minute=0, second=0, microsecond=0)


def _user_transactions(db: Session, user_sub: str, cutoff: datetime) -> list[models.Transaction]:
    account_ids = [
        row[0]
        for row in db.query(models.Account.account_id).filter(models.Account.user_sub == user_sub).all()
    ]
    if not account_ids:
        return []

    return (
        db.query(models.Transaction)
        .filter(
            models.Transaction.account_id.in_(account_ids),
            models.Transaction.booking_datetime >= cutoff,
        )
        .all()
    )


@router.get("/category-breakdown", response_model=schemas.CategoryBreakdownResponse)
async def category_breakdown(
    months: int = Query(default=3, ge=1, le=24),
    user_sub: str = Depends(get_current_user_sub),
    db: Session = Depends(get_db),
):
    cutoff = _months_ago(months)
    transactions = _user_transactions(db, user_sub, cutoff)
    expense_txns = [txn for txn in transactions if txn.credit_debit_indicator == "Debit"]

    await categorize_transactions(db, expense_txns)

    totals: dict[str, dict] = defaultdict(lambda: {"total": 0.0, "count": 0})
    for txn in expense_txns:
        bucket = totals[txn.category or "Other Expense"]
        bucket["total"] += float(txn.amount)
        bucket["count"] += 1

    total_expense = sum(bucket["total"] for bucket in totals.values())
    categories = [
        {
            "category": name,
            "total": round(bucket["total"], 2),
            "percentage": round((bucket["total"] / total_expense * 100) if total_expense else 0, 1),
            "transaction_count": bucket["count"],
        }
        for name, bucket in sorted(totals.items(), key=lambda kv: -kv[1]["total"])
    ]

    insight, source = await category_breakdown_insight(categories, total_expense, months)

    return schemas.CategoryBreakdownResponse(
        period_months=months,
        total_expense=round(total_expense, 2),
        categories=[schemas.CategoryAmount(**category) for category in categories],
        insight=insight,
        insight_source=source,
    )


@router.get("/income-expense-trend", response_model=schemas.IncomeExpenseTrendResponse)
async def income_expense_trend(
    months: int = Query(default=6, ge=1, le=24),
    user_sub: str = Depends(get_current_user_sub),
    db: Session = Depends(get_db),
):
    cutoff = _months_ago(months)
    transactions = _user_transactions(db, user_sub, cutoff)

    buckets: dict[str, dict] = defaultdict(lambda: {"income": 0.0, "expense": 0.0})
    for txn in transactions:
        key = txn.booking_datetime.strftime("%Y-%m")
        if txn.credit_debit_indicator == "Debit":
            buckets[key]["expense"] += float(txn.amount)
        else:
            buckets[key]["income"] += float(txn.amount)

    month_rows = [
        {
            "month": key,
            "income": round(buckets[key]["income"], 2),
            "expense": round(buckets[key]["expense"], 2),
            "net": round(buckets[key]["income"] - buckets[key]["expense"], 2),
        }
        for key in sorted(buckets.keys())
    ]

    count = len(month_rows) or 1
    average_income = sum(m["income"] for m in month_rows) / count
    average_expense = sum(m["expense"] for m in month_rows) / count
    average_savings_rate = (
        (average_income - average_expense) / average_income * 100 if average_income else 0.0
    )

    insight, source = await income_expense_trend_insight(
        month_rows, average_income, average_expense, average_savings_rate
    )

    return schemas.IncomeExpenseTrendResponse(
        period_months=months,
        months=[schemas.MonthlyIncomeExpense(**m) for m in month_rows],
        average_income=round(average_income, 2),
        average_expense=round(average_expense, 2),
        average_savings_rate=round(average_savings_rate, 1),
        insight=insight,
        insight_source=source,
    )


@router.get("/unusual-spending", response_model=schemas.UnusualSpendingResponse)
async def unusual_spending(
    months: int = Query(default=3, ge=1, le=24),
    user_sub: str = Depends(get_current_user_sub),
    db: Session = Depends(get_db),
):
    cutoff = _months_ago(months)
    transactions = _user_transactions(db, user_sub, cutoff)
    expense_txns = [txn for txn in transactions if txn.credit_debit_indicator == "Debit"]

    await categorize_transactions(db, expense_txns)

    anomalies = detect_unusual_spending(transactions)
    insight, source = await unusual_spending_insight(anomalies, months)

    return schemas.UnusualSpendingResponse(
        period_months=months,
        anomalies=[schemas.UnusualTransaction(**anomaly) for anomaly in anomalies],
        insight=insight,
        insight_source=source,
    )
