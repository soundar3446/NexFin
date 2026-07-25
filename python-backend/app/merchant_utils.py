_PLACEHOLDER_MERCHANT_NAMES = {"n/a", "na", "unknown", "none"}


def clean_merchant_name(name: str | None) -> str | None:
    """Returns a usable merchant name, or None if it's missing or one of the meaningless
    placeholder strings the bank sends instead of omitting the field (observed: "N/A" on
    transactions with no real merchant — rent, mortgage, tuition, bank fees, etc.)."""
    if not name:
        return None
    if name.strip().lower() in _PLACEHOLDER_MERCHANT_NAMES:
        return None
    return name
