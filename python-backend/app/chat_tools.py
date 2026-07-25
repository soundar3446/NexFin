import logging
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app import models
from app.mcc_categories import category_for_mcc

logger = logging.getLogger(__name__)

DEFAULT_LIMIT = 5
MAX_LIMIT = 20
MONEY_QUANT = Decimal("0.01")

_ACCOUNT_ID_PROP = {
    "type": "string",
    "description": "Optional account ID to restrict results to one account.",
}
_ACCOUNT_NICKNAME_PROP = {
    "type": "string",
    "description": (
        "Optional account nickname/name (e.g. Bills, Savings, Emergency). "
        "Case-insensitive exact match. If several accounts share the nickname, "
        "all of them are included. Prefer this when the user names an account "
        "instead of an ID."
    ),
}


def _as_decimal(value) -> Decimal:
    if isinstance(value, Decimal):
        return value
    return Decimal(str(value))


def _money(value) -> str:
    """Serialize money as a fixed 2-dp string (matches DB Numeric(18,2), avoids float noise)."""
    return format(_as_decimal(value).quantize(MONEY_QUANT, rounding=ROUND_HALF_UP), "f")


TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "list_accounts",
            "description": (
                "List the authenticated user's bank accounts from the NexFin database "
                "(nickname, currency, type, status). Use when the user asks what accounts "
                "they have, or needs to pick an account by name."
            ),
            "parameters": {
                "type": "object",
                "properties": {},
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_recent_transactions",
            "description": (
                "Fetch the most recent transactions for the user, newest first. "
                "Use for 'recent transactions', 'latest payments', or 'what did I spend lately'. "
                "Pass account_nickname when the user names an account (e.g. Bills)."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "account_id": _ACCOUNT_ID_PROP,
                    "account_nickname": _ACCOUNT_NICKNAME_PROP,
                    "limit": {
                        "type": "integer",
                        "description": f"How many transactions to return (1-{MAX_LIMIT}). Default {DEFAULT_LIMIT}.",
                        "minimum": 1,
                        "maximum": MAX_LIMIT,
                    },
                },
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "find_transactions",
            "description": (
                "Search the user's transactions by merchant name or description text "
                "(e.g. Netflix, gas, rent, Tesco). Use when the user asks whether they "
                "paid a merchant, or to find specific purchases. Optionally restrict to "
                "an account via account_nickname or account_id."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search text matched against merchant_name and transaction_information.",
                    },
                    "account_id": _ACCOUNT_ID_PROP,
                    "account_nickname": _ACCOUNT_NICKNAME_PROP,
                    "limit": {
                        "type": "integer",
                        "description": f"Max matches to return (1-{MAX_LIMIT}). Default {DEFAULT_LIMIT}.",
                        "minimum": 1,
                        "maximum": MAX_LIMIT,
                    },
                },
                "required": ["query"],
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "spend_summary",
            "description": (
                "Summarise spending and income for a calendar month: totals, top categories, "
                "and top merchants. Use for 'how much did I spend this month', "
                "'income vs expenses', 'where is my money going', or "
                "'monthly summary for my Bills account'. Pass account_nickname when the "
                "user names an account."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "month": {
                        "type": "string",
                        "description": "Month as YYYY-MM. Defaults to the current UTC month.",
                    },
                    "account_id": _ACCOUNT_ID_PROP,
                    "account_nickname": _ACCOUNT_NICKNAME_PROP,
                },
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "detect_subscriptions",
            "description": (
                "Detect likely recurring payments / subscriptions by finding merchants or "
                "descriptions that appear multiple times with similar debit amounts. "
                "Use for 'any subscriptions', 'recurring charges', or 'what am I paying monthly'. "
                "Pass account_nickname to limit to a named account."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "account_id": _ACCOUNT_ID_PROP,
                    "account_nickname": _ACCOUNT_NICKNAME_PROP,
                    "lookback_days": {
                        "type": "integer",
                        "description": "How many days of history to scan (7-365). Default 90.",
                        "minimum": 7,
                        "maximum": 365,
                    },
                },
                "additionalProperties": False,
            },
        },
    },
]


def _clamp_limit(limit: int | None) -> int:
    if limit is None:
        return DEFAULT_LIMIT
    return max(1, min(int(limit), MAX_LIMIT))


def _user_accounts(db: Session, user_sub: str) -> list[models.Account]:
    return db.query(models.Account).filter(models.Account.user_sub == user_sub).all()


def _resolve_account_scope(
    db: Session,
    user_sub: str,
    account_id: str | None = None,
    account_nickname: str | None = None,
) -> tuple[dict[str, str | None], list[str], list[dict]]:
    """Return (nickname_map, account_ids, matched_accounts).

    Priority: explicit account_id > account_nickname > all user accounts.
    Nickname match is case-insensitive exact; multiple matches are all included.
    """
    accounts = _user_accounts(db, user_sub)
    if not accounts:
        total = db.query(models.Account).count()
        logger.warning(
            "no accounts for user_sub=%s (accounts table total=%s)",
            user_sub,
            total,
        )
        return {}, [], []

    nicknames = {a.account_id: a.nickname for a in accounts}
    all_ids = list(nicknames.keys())

    if account_id is not None:
        if account_id not in nicknames:
            logger.warning(
                "account_id=%s not owned by user_sub=%s (owned=%s)",
                account_id,
                user_sub,
                all_ids,
            )
            return nicknames, [], []
        matched = [
            {
                "account_id": account_id,
                "nickname": nicknames.get(account_id),
            }
        ]
        return nicknames, [account_id], matched

    if account_nickname:
        needle = account_nickname.strip().casefold()
        matched_accounts = [
            a for a in accounts if (a.nickname or "").strip().casefold() == needle
        ]
        if not matched_accounts:
            logger.warning(
                "account_nickname=%r matched 0 accounts for user_sub=%s",
                account_nickname,
                user_sub,
            )
            return nicknames, [], []
        matched_ids = [a.account_id for a in matched_accounts]
        matched = [
            {"account_id": a.account_id, "nickname": a.nickname} for a in matched_accounts
        ]
        logger.info(
            "account_nickname=%r matched %s account(s): %s",
            account_nickname,
            len(matched_ids),
            matched_ids,
        )
        return nicknames, matched_ids, matched

    matched = [{"account_id": a.account_id, "nickname": a.nickname} for a in accounts]
    return nicknames, all_ids, matched


def _txn_category(txn: models.Transaction) -> str:
    if txn.category:
        return txn.category
    return category_for_mcc(txn.merchant_category_code) or "Uncategorised"


def _serialize_txn(txn: models.Transaction, nicknames: dict[str, str | None]) -> dict:
    return {
        "transaction_id": txn.transaction_id,
        "account_id": txn.account_id,
        "nickname": nicknames.get(txn.account_id),
        "amount": _money(txn.amount),
        "currency": txn.currency,
        "credit_debit_indicator": txn.credit_debit_indicator,
        "status": txn.status,
        "booking_datetime": txn.booking_datetime.isoformat(),
        "transaction_information": txn.transaction_information,
        "merchant_name": txn.merchant_name,
        "category": _txn_category(txn),
    }


def list_accounts(db: Session, user_sub: str) -> list[dict]:
    accounts = _user_accounts(db, user_sub)
    logger.info("list_accounts user_sub=%s count=%s", user_sub, len(accounts))
    return [
        {
            "account_id": a.account_id,
            "nickname": a.nickname,
            "currency": a.currency,
            "account_type": a.account_type,
            "account_category": a.account_category,
            "status": a.status,
            "synced_at": a.synced_at.isoformat() if a.synced_at else None,
        }
        for a in accounts
    ]


def get_recent_transactions(
    db: Session,
    user_sub: str,
    account_id: str | None = None,
    account_nickname: str | None = None,
    limit: int | None = None,
) -> list[dict]:
    resolved_limit = _clamp_limit(limit)
    logger.info(
        "get_recent_transactions start user_sub=%s account_id=%s account_nickname=%r limit=%s",
        user_sub,
        account_id,
        account_nickname,
        resolved_limit,
    )

    nicknames, account_ids, _matched = _resolve_account_scope(
        db, user_sub, account_id=account_id, account_nickname=account_nickname
    )
    if not account_ids:
        return []

    transactions = (
        db.query(models.Transaction)
        .filter(models.Transaction.account_id.in_(account_ids))
        .order_by(models.Transaction.booking_datetime.desc())
        .limit(resolved_limit)
        .all()
    )
    logger.info("get_recent_transactions returning %s row(s)", len(transactions))
    return [_serialize_txn(txn, nicknames) for txn in transactions]


def find_transactions(
    db: Session,
    user_sub: str,
    query: str,
    account_id: str | None = None,
    account_nickname: str | None = None,
    limit: int | None = None,
) -> list[dict]:
    resolved_limit = _clamp_limit(limit)
    needle = (query or "").strip()
    logger.info(
        "find_transactions start user_sub=%s query=%r account_id=%s account_nickname=%r limit=%s",
        user_sub,
        needle,
        account_id,
        account_nickname,
        resolved_limit,
    )
    if not needle:
        return []

    nicknames, account_ids, _matched = _resolve_account_scope(
        db, user_sub, account_id=account_id, account_nickname=account_nickname
    )
    if not account_ids:
        return []

    pattern = f"%{needle}%"
    transactions = (
        db.query(models.Transaction)
        .filter(
            models.Transaction.account_id.in_(account_ids),
            or_(
                models.Transaction.merchant_name.ilike(pattern),
                models.Transaction.transaction_information.ilike(pattern),
            ),
        )
        .order_by(models.Transaction.booking_datetime.desc())
        .limit(resolved_limit)
        .all()
    )
    logger.info("find_transactions returning %s row(s)", len(transactions))
    return [_serialize_txn(txn, nicknames) for txn in transactions]


def spend_summary(
    db: Session,
    user_sub: str,
    month: str | None = None,
    account_id: str | None = None,
    account_nickname: str | None = None,
) -> dict:
    if month:
        try:
            period = datetime.strptime(month, "%Y-%m").strftime("%Y-%m")
        except ValueError:
            period = datetime.now(timezone.utc).strftime("%Y-%m")
    else:
        period = datetime.now(timezone.utc).strftime("%Y-%m")

    logger.info(
        "spend_summary start user_sub=%s month=%s account_id=%s account_nickname=%r",
        user_sub,
        period,
        account_id,
        account_nickname,
    )

    nicknames, account_ids, matched = _resolve_account_scope(
        db, user_sub, account_id=account_id, account_nickname=account_nickname
    )
    scope_label = None
    if account_nickname:
        scope_label = account_nickname.strip()
    elif account_id:
        scope_label = nicknames.get(account_id)

    empty = {
        "period": period,
        "account_id": account_id,
        "account_nickname": account_nickname,
        "nickname": scope_label,
        "matched_accounts": matched,
        "match_count": len(matched),
        "total_spend": "0.00",
        "total_income": "0.00",
        "net": "0.00",
        "transaction_count": 0,
        "currency": "GBP",
        "by_category": [],
        "by_merchant": [],
    }
    if not account_ids:
        return empty

    year, month_num = map(int, period.split("-"))
    start = datetime(year, month_num, 1, tzinfo=timezone.utc)
    if month_num == 12:
        end = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
    else:
        end = datetime(year, month_num + 1, 1, tzinfo=timezone.utc)

    transactions = (
        db.query(models.Transaction)
        .filter(
            models.Transaction.account_id.in_(account_ids),
            models.Transaction.booking_datetime >= start,
            models.Transaction.booking_datetime < end,
        )
        .all()
    )

    total_spend = Decimal("0")
    total_income = Decimal("0")
    by_category: dict[str, Decimal] = defaultdict(lambda: Decimal("0"))
    by_merchant: dict[str, Decimal] = defaultdict(lambda: Decimal("0"))
    currency = "GBP"

    for txn in transactions:
        amount = _as_decimal(txn.amount)
        currency = txn.currency or currency
        if txn.credit_debit_indicator == "Debit":
            total_spend += amount
            by_category[_txn_category(txn)] += amount
            by_merchant[txn.merchant_name or txn.transaction_information or "Unknown"] += amount
        else:
            total_income += amount

    result = {
        "period": period,
        "account_id": account_id,
        "account_nickname": account_nickname,
        "nickname": scope_label,
        "matched_accounts": matched if (account_id or account_nickname) else [],
        "match_count": len(matched) if (account_id or account_nickname) else 0,
        "total_spend": _money(total_spend),
        "total_income": _money(total_income),
        "net": _money(total_income - total_spend),
        "transaction_count": len(transactions),
        "currency": currency,
        "by_category": [
            {"category": name, "total": _money(total)}
            for name, total in sorted(by_category.items(), key=lambda kv: -kv[1])[:8]
        ],
        "by_merchant": [
            {"merchant_name": name, "total": _money(total)}
            for name, total in sorted(by_merchant.items(), key=lambda kv: -kv[1])[:8]
        ],
    }
    logger.info(
        "spend_summary period=%s spend=%s income=%s count=%s match_count=%s",
        period,
        result["total_spend"],
        result["total_income"],
        result["transaction_count"],
        result["match_count"],
    )
    return result


def detect_subscriptions(
    db: Session,
    user_sub: str,
    account_id: str | None = None,
    account_nickname: str | None = None,
    lookback_days: int | None = None,
) -> list[dict]:
    days = 90 if lookback_days is None else max(7, min(int(lookback_days), 365))
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    logger.info(
        "detect_subscriptions start user_sub=%s account_id=%s account_nickname=%r lookback_days=%s",
        user_sub,
        account_id,
        account_nickname,
        days,
    )

    nicknames, account_ids, _matched = _resolve_account_scope(
        db, user_sub, account_id=account_id, account_nickname=account_nickname
    )
    if not account_ids:
        return []

    transactions = (
        db.query(models.Transaction)
        .filter(
            models.Transaction.account_id.in_(account_ids),
            models.Transaction.credit_debit_indicator == "Debit",
            models.Transaction.booking_datetime >= cutoff,
        )
        .order_by(models.Transaction.booking_datetime.desc())
        .all()
    )

    groups: dict[str, list[models.Transaction]] = defaultdict(list)
    for txn in transactions:
        label = (txn.merchant_name or txn.transaction_information or "").strip()
        if not label:
            continue
        groups[label.casefold()].append(txn)

    subscriptions = []
    for _key, rows in groups.items():
        if len(rows) < 2:
            continue
        amounts = [_as_decimal(r.amount) for r in rows]
        total = sum(amounts, Decimal("0"))
        avg = total / Decimal(len(amounts))
        # Similar amounts: all within 15% of the average (or £1 floor)
        tolerance = max(avg * Decimal("0.15"), Decimal("1.00"))
        if any(abs(a - avg) > tolerance for a in amounts):
            continue
        label = rows[0].merchant_name or rows[0].transaction_information or "Unknown"
        subscriptions.append(
            {
                "label": label,
                "occurrences": len(rows),
                "avg_amount": _money(avg),
                "currency": rows[0].currency,
                "last_seen": rows[0].booking_datetime.isoformat(),
                "account_ids": sorted({r.account_id for r in rows}),
                "nicknames": sorted(
                    {nicknames.get(r.account_id) or r.account_id for r in rows}
                ),
            }
        )

    subscriptions.sort(key=lambda s: (-s["occurrences"], -Decimal(s["avg_amount"])))
    logger.info("detect_subscriptions returning %s group(s)", len(subscriptions))
    return subscriptions[:10]


def dispatch_tool(
    name: str,
    arguments: dict,
    db: Session,
    user_sub: str,
    preferred_account_id: str | None = None,
) -> tuple[str, str, list | dict]:
    """Run a tool. Returns (tool_name, data_type, data)."""
    account_nickname = (arguments.get("account_nickname") or "").strip() or None
    # Nickname from the user question wins over the page-scoped account_id.
    if account_nickname:
        account_id = arguments.get("account_id") or None
    else:
        account_id = arguments.get("account_id") or preferred_account_id

    logger.info(
        "dispatch_tool name=%s args=%s preferred_account_id=%s "
        "resolved_account_id=%s account_nickname=%r",
        name,
        arguments,
        preferred_account_id,
        account_id,
        account_nickname,
    )

    if name == "list_accounts":
        return name, "accounts", list_accounts(db, user_sub)

    if name == "get_recent_transactions":
        rows = get_recent_transactions(
            db,
            user_sub,
            account_id=account_id,
            account_nickname=account_nickname,
            limit=arguments.get("limit"),
        )
        return name, "transactions", rows

    if name == "find_transactions":
        rows = find_transactions(
            db,
            user_sub,
            query=arguments.get("query") or "",
            account_id=account_id,
            account_nickname=account_nickname,
            limit=arguments.get("limit"),
        )
        return name, "transactions", rows

    if name == "spend_summary":
        summary = spend_summary(
            db,
            user_sub,
            month=arguments.get("month"),
            account_id=account_id,
            account_nickname=account_nickname,
        )
        return name, "spend_summary", summary

    if name == "detect_subscriptions":
        rows = detect_subscriptions(
            db,
            user_sub,
            account_id=account_id,
            account_nickname=account_nickname,
            lookback_days=arguments.get("lookback_days"),
        )
        return name, "subscriptions", rows

    raise ValueError(f"Unknown tool: {name}")
