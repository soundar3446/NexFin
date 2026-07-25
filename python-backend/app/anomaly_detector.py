import statistics
from collections import defaultdict
from datetime import timedelta

from app import models

_CATEGORY_MIN_SAMPLES = 3
_MODIFIED_Z_THRESHOLD = 3.5  # standard Iglewicz & Hoaglin robust-outlier threshold
_HIGH_SEVERITY_Z_THRESHOLD = 6.0
_CATEGORY_RATIO_THRESHOLD = 1.3
_DUPLICATE_WINDOW = timedelta(hours=24)
_MAX_RESULTS = 25


def _flag(flags: dict, txn: models.Transaction, reason: str, severity: str) -> None:
    entry = flags.setdefault(txn.transaction_id, {"txn": txn, "reasons": [], "severity": severity})
    if reason not in entry["reasons"]:
        entry["reasons"].append(reason)
    if severity == "high":
        entry["severity"] = "high"


def _median_and_mad(amounts: list[float]) -> tuple[float, float]:
    median = statistics.median(amounts)
    mad = statistics.median(abs(amount - median) for amount in amounts)
    return median, mad


def _outliers_against_baseline(
    txns: list[models.Transaction], median: float, mad: float
) -> list[tuple[models.Transaction, float, float]]:
    """Flags amounts far above a median/MAD baseline using a modified z-score. Unlike
    mean/stdev, a single huge outlier can't drag its own baseline up and hide itself —
    the median and MAD barely move when one value in the group is extreme."""
    outliers = []
    for txn in txns:
        amount = float(txn.amount)
        if amount <= median or amount < median * _CATEGORY_RATIO_THRESHOLD:
            continue
        if mad > 0:
            modified_z = 0.6745 * (amount - median) / mad
            if modified_z >= _MODIFIED_Z_THRESHOLD:
                outliers.append((txn, amount, modified_z))
        else:
            outliers.append((txn, amount, _HIGH_SEVERITY_Z_THRESHOLD))
    return outliers


def _flag_category_outliers(flags: dict, debit_txns: list[models.Transaction]) -> None:
    by_category = defaultdict(list)
    for txn in debit_txns:
        by_category[txn.category or "Other Expense"].append(txn)

    overall_median, overall_mad = _median_and_mad([float(txn.amount) for txn in debit_txns])

    for category, txns in by_category.items():
        if len(txns) >= _CATEGORY_MIN_SAMPLES:
            median, mad = _median_and_mad([float(txn.amount) for txn in txns])
            for txn, amount, modified_z in _outliers_against_baseline(txns, median, mad):
                _flag(
                    flags,
                    txn,
                    f"{amount:.2f} is unusually high for {category} (typical spend ~{median:.2f}).",
                    "high" if modified_z >= _HIGH_SEVERITY_Z_THRESHOLD else "medium",
                )
        elif len(debit_txns) >= _CATEGORY_MIN_SAMPLES:
            # Too few transactions in this category for its own baseline — fall back to the
            # spread across all spending so sparse categories still get a sanity check.
            for txn, amount, _ in _outliers_against_baseline(txns, overall_median, overall_mad):
                _flag(
                    flags,
                    txn,
                    f"{amount:.2f} is unusually large compared to your typical spending (~{overall_median:.2f}).",
                    "medium",
                )


def _flag_duplicate_charges(flags: dict, debit_txns: list[models.Transaction]) -> None:
    groups = defaultdict(list)
    for txn in debit_txns:
        merchant_key = (txn.merchant_name or txn.transaction_information or "").strip().lower()
        if not merchant_key:
            continue
        groups[(merchant_key, float(txn.amount))].append(txn)

    for (merchant_key, amount), txns in groups.items():
        if len(txns) < 2:
            continue
        ordered = sorted(txns, key=lambda t: t.booking_datetime)
        for prev, curr in zip(ordered, ordered[1:]):
            if curr.booking_datetime - prev.booking_datetime <= _DUPLICATE_WINDOW:
                reason = (
                    f"Same amount ({amount:.2f}) charged by "
                    f"{(curr.merchant_name or merchant_key).title()} within 24 hours of another transaction."
                )
                _flag(flags, curr, reason, "medium")
                _flag(flags, prev, reason, "medium")


def detect_unusual_spending(transactions: list[models.Transaction]) -> list[dict]:
    debit_txns = [txn for txn in transactions if txn.credit_debit_indicator == "Debit"]
    if not debit_txns:
        return []

    flags: dict[str, dict] = {}
    _flag_category_outliers(flags, debit_txns)
    _flag_duplicate_charges(flags, debit_txns)

    results = [
        {
            "transaction_id": entry["txn"].transaction_id,
            "booking_date": entry["txn"].booking_datetime.strftime("%Y-%m-%d"),
            "merchant": entry["txn"].merchant_name,
            "category": entry["txn"].category or "Other Expense",
            "amount": round(float(entry["txn"].amount), 2),
            "reason": " ".join(entry["reasons"]),
            "severity": entry["severity"],
        }
        for entry in flags.values()
    ]
    results.sort(key=lambda r: (r["severity"] != "high", -r["amount"]))
    return results[:_MAX_RESULTS]
