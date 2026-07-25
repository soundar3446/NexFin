import json
import re

from sqlalchemy.orm import Session

from app import models
from app.hf_client import HfUnavailable, chat_complete

EXPENSE_CATEGORIES = [
    "Groceries",
    "Dining & Restaurants",
    "Transport",
    "Utilities & Bills",
    "Rent & Mortgage",
    "Shopping",
    "Entertainment & Leisure",
    "Health & Fitness",
    "Travel",
    "Subscriptions",
    "Insurance",
    "Education",
    "Cash Withdrawal",
    "Fees & Charges",
    "Other Expense",
]

INCOME_CATEGORIES = [
    "Salary",
    "Interest & Investment Income",
    "Refunds",
    "Transfers In",
    "Other Income",
]

ALL_CATEGORIES = EXPENSE_CATEGORIES + INCOME_CATEGORIES

_BATCH_SIZE = 25

_EXPENSE_KEYWORD_RULES: list[tuple[list[str], str]] = [
    (["tesco", "asda", "walmart", "sainsbury", "aldi", "lidl", "kroger", "whole foods", "grocery", "supermarket", "morrisons", "waitrose"], "Groceries"),
    (["uber eats", "deliveroo", "just eat", "doordash", "grubhub", "restaurant", "cafe", "coffee", "mcdonald", "starbucks", "kfc", "pizza", "burger"], "Dining & Restaurants"),
    (["uber", "lyft", "bolt", "taxi", "transport for london", "tfl", "train", "rail", "bus fare", "fuel", "petrol", "shell ", " bp ", "parking"], "Transport"),
    (["electric", "gas bill", "water bill", "utility", "council tax", "broadband", "mobile bill", "vodafone", "o2 ", "ee limited", " sse ", "energy"], "Utilities & Bills"),
    (["rent payment", "mortgage"], "Rent & Mortgage"),
    (["amazon", "ebay", "asos", "zara", "h&m", "ikea", "argos"], "Shopping"),
    (["netflix", "spotify", "disney+", "prime video", "subscription", "apple.com/bill", "youtube premium", "hulu"], "Subscriptions"),
    (["cinema", "theatre", "concert", "steam", "playstation", "xbox", "cineworld", "odeon"], "Entertainment & Leisure"),
    (["gym", "fitness", "pharmacy", "clinic", "dental", "boots", "nhs"], "Health & Fitness"),
    (["hotel", "airline", "airbnb", "booking.com", "flight", "expedia"], "Travel"),
    (["insurance"], "Insurance"),
    (["university", "school fees", "tuition", "course fee"], "Education"),
    (["atm withdrawal", "cash withdrawal"], "Cash Withdrawal"),
    (["overdraft fee", "service charge", "late fee", "bank charge"], "Fees & Charges"),
]

_INCOME_KEYWORD_RULES: list[tuple[list[str], str]] = [
    (["salary", "payroll", "wages"], "Salary"),
    (["interest", "dividend"], "Interest & Investment Income"),
    (["refund", "reversal"], "Refunds"),
    (["transfer from", "faster payment", "standing order in"], "Transfers In"),
]

_MCC_RULES: dict[str, str] = {
    "5411": "Groceries",
    "5412": "Groceries",
    "5812": "Dining & Restaurants",
    "5814": "Dining & Restaurants",
    "4111": "Transport",
    "4121": "Transport",
    "5541": "Transport",
    "5542": "Transport",
    "4900": "Utilities & Bills",
    "5300": "Groceries",
    "5732": "Shopping",
    "5651": "Shopping",
    "7011": "Travel",
    "4511": "Travel",
    "7997": "Health & Fitness",
    "8011": "Health & Fitness",
    "6011": "Cash Withdrawal",
    "6010": "Cash Withdrawal",
}


def _contains_keyword(text: str, keyword: str) -> bool:
    return re.search(rf"\b{re.escape(keyword.strip())}\b", text) is not None


def _fallback_category(txn: models.Transaction) -> str:
    text = f"{txn.transaction_information or ''} {txn.merchant_name or ''}".lower()
    rules = _EXPENSE_KEYWORD_RULES if txn.credit_debit_indicator == "Debit" else _INCOME_KEYWORD_RULES

    for keywords, category in rules:
        if any(_contains_keyword(text, keyword) for keyword in keywords):
            return category

    if txn.merchant_category_code and txn.merchant_category_code in _MCC_RULES:
        return _MCC_RULES[txn.merchant_category_code]

    return "Other Expense" if txn.credit_debit_indicator == "Debit" else "Other Income"


def _extract_json(raw: str) -> dict:
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if not match:
        raise ValueError(f"No JSON object found in model output: {raw!r}")
    return json.loads(match.group(0))


def _build_prompt(batch: list[models.Transaction]) -> list[dict]:
    allowed = ", ".join(ALL_CATEGORIES)
    lines = []
    for txn in batch:
        lines.append(
            {
                "id": txn.transaction_id,
                "direction": txn.credit_debit_indicator,
                "description": txn.transaction_information or "",
                "merchant": txn.merchant_name or "",
                "mcc": txn.merchant_category_code or "",
                "amount": str(txn.amount),
            }
        )

    system = (
        "You are a bank transaction categorizer. Classify each transaction into exactly one "
        f"category from this fixed list: {allowed}. "
        "Debit transactions must use an expense category; Credit transactions must use an income category. "
        "Respond with ONLY a JSON object of the form "
        '{"categories": [{"id": "<transaction id>", "category": "<one category from the list>"}, ...]}. '
        "No other text."
    )
    user = json.dumps({"transactions": lines})
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]


async def _categorize_batch(batch: list[models.Transaction]) -> None:
    try:
        raw = await chat_complete(_build_prompt(batch))
        parsed = _extract_json(raw)
        by_id = {str(item.get("id")): item.get("category") for item in parsed.get("categories", [])}
    except (HfUnavailable, ValueError, json.JSONDecodeError):
        by_id = {}

    for txn in batch:
        category = by_id.get(txn.transaction_id)
        expected_kind = EXPENSE_CATEGORIES if txn.credit_debit_indicator == "Debit" else INCOME_CATEGORIES
        if category in expected_kind:
            txn.category = category
            txn.category_source = "ai"
        else:
            txn.category = _fallback_category(txn)
            txn.category_source = "fallback"


async def categorize_transactions(db: Session, transactions: list[models.Transaction]) -> None:
    pending = [txn for txn in transactions if txn.category is None]
    if not pending:
        return

    for i in range(0, len(pending), _BATCH_SIZE):
        await _categorize_batch(pending[i : i + _BATCH_SIZE])

    db.commit()
