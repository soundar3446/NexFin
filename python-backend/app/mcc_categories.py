"""Canonical Merchant Category Code (MCC) -> spending category mapping.

Single source of truth: previously the AI categorizer's keyword-fallback path and the
plain monthly-spending breakdown each grouped raw MCCs their own way (or not at all),
so the same code could resolve to a different label — or no label — depending on
which endpoint was asked. Everything that needs to turn an MCC into a category name
goes through this map instead.

Category names match `categorizer.EXPENSE_CATEGORIES` exactly, so a transaction
categorized via this map and one categorized by the AI/keyword path are indistinguishable
downstream.
"""

MCC_CATEGORY_MAP: dict[str, str] = {
    # Groceries
    "5411": "Groceries",
    "5412": "Groceries",
    "5422": "Groceries",
    "5300": "Groceries",
    # Dining & Restaurants
    "5812": "Dining & Restaurants",
    "5813": "Dining & Restaurants",
    "5814": "Dining & Restaurants",
    # Transport
    "4111": "Transport",
    "4112": "Transport",
    "4121": "Transport",
    "5541": "Transport",
    "5542": "Transport",
    # Utilities & Bills — 1711 shows up in this sandbox's mock data tagging generic
    # bill-style merchants (gas, etc.), not its real-world "contractor" meaning.
    "1711": "Utilities & Bills",
    "4899": "Utilities & Bills",
    "4900": "Utilities & Bills",
    "5874": "Utilities & Bills",
    # Shopping
    "5311": "Shopping",
    "5651": "Shopping",
    "5732": "Shopping",
    # Entertainment & Leisure
    "5945": "Entertainment & Leisure",
    "7832": "Entertainment & Leisure",
    # Subscriptions
    "5815": "Subscriptions",
    # Health & Fitness
    "7997": "Health & Fitness",
    "8011": "Health & Fitness",
    "8021": "Health & Fitness",
    "8099": "Health & Fitness",
    # Travel
    "4511": "Travel",
    "7011": "Travel",
    # Insurance
    "6300": "Insurance",
    # Cash Withdrawal
    "6010": "Cash Withdrawal",
    "6011": "Cash Withdrawal",
}


def category_for_mcc(mcc: str | None) -> str | None:
    if not mcc:
        return None
    return MCC_CATEGORY_MAP.get(mcc)
