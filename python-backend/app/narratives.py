import json

from app.hf_client import HfUnavailable, chat_complete

_SYSTEM_PROMPT = (
    "You are a concise personal finance assistant. Given aggregated JSON numbers for a bank "
    "customer, write a plain-English insight of 2-4 short sentences. Reference concrete figures "
    "and percentages from the data. Do not use markdown, bullet points, or headings. Do not invent "
    "numbers that are not present in the data."
)


async def _generate(user_prompt: str) -> tuple[str, str]:
    try:
        text = await chat_complete(
            [
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ]
        )
        return text.strip(), "ai"
    except HfUnavailable:
        return "", "fallback"


async def category_breakdown_insight(categories: list[dict], total_expense: float, period_months: int) -> tuple[str, str]:
    if not categories:
        return "No categorized spending in this period yet.", "fallback"

    text, source = await _generate(
        json.dumps(
            {
                "period_months": period_months,
                "total_expense": round(total_expense, 2),
                "categories": categories,
            }
        )
    )
    if text:
        return text, source

    top = categories[0]
    return (
        f"Over the last {period_months} month(s), your top spending category was "
        f"{top['category']} at {top['percentage']}% of total expenses ({top['total']:.2f})."
    ), "fallback"


async def income_expense_trend_insight(
    months: list[dict],
    average_income: float,
    average_expense: float,
    average_savings_rate: float,
) -> tuple[str, str]:
    if not months:
        return "No transaction history in this period yet.", "fallback"

    text, source = await _generate(
        json.dumps(
            {
                "months": months,
                "average_income": round(average_income, 2),
                "average_expense": round(average_expense, 2),
                "average_savings_rate_percent": round(average_savings_rate, 1),
            }
        )
    )
    if text:
        return text, source

    direction = "saving" if average_savings_rate >= 0 else "overspending"
    return (
        f"On average you brought in {average_income:.2f} and spent {average_expense:.2f} per month, "
        f"{direction} at a rate of {average_savings_rate:.1f}% of income."
    ), "fallback"
