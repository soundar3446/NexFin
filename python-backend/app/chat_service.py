import json
import logging

import httpx
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app import chat_tools
from app.config import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are NexFin Assistant, an AI assistant embedded in the NexFin \
personal banking app. You help the signed-in user understand their own synced bank data.

## Tools (use the right one)
1. `list_accounts` — what accounts the user has (nickname, currency, type, status).
2. `get_recent_transactions` — latest transactions (newest first). Optional account_id, \
account_nickname, limit.
3. `find_transactions` — search by merchant/description text (e.g. Netflix, Tesco, rent, gas). \
Optional account_id / account_nickname.
4. `spend_summary` — monthly income vs spend, top categories and merchants. Optional month \
YYYY-MM (defaults to current month), account_id, or account_nickname.
5. `detect_subscriptions` — likely recurring debit payments / subscriptions. Optional \
account_id / account_nickname.

## Account naming
When the user refers to an account by name (e.g. "Bills", "my Savings account", \
"Emergency"), pass `account_nickname` with that name. Do NOT invent an account_id. \
Nickname matching is case-insensitive. If several accounts share the same nickname, \
the tool includes all of them — mention that in your summary when match_count > 1. \
If no account matches the name, say so and suggest `list_accounts`.

Pick exactly the tool that answers the question. Prefer `find_transactions` over \
`get_recent_transactions` when the user names a merchant or payment type. Prefer \
`spend_summary` for totals, "this month", income vs expenses, "where is money going", \
or "monthly summary for my <name> account". Prefer `detect_subscriptions` for \
subscriptions / recurring charges. Prefer `list_accounts` when they ask which accounts \
they have.

## Hard rules
1. NEVER invent, guess, or estimate financial figures. Every number or detail you state \
MUST come from a tool result in this conversation.
2. If the answer needs data, call a tool first. Do not answer from memory.
3. If a tool returns empty data, say so briefly and suggest syncing accounts (or checking \
the account name). Do not fabricate examples.
4. You only see the authenticated user's data. Never claim access to balances that are \
not in tool results, other users, card numbers, or unpaid live bank actions.
5. You cannot make payments, transfers, change settings, or give regulated \
financial/investment/tax/legal advice.

## Scope
Only answer questions about the user's accounts, transactions, spending summaries, and \
subscriptions from NexFin data. For anything else (weather, general knowledge, payments, \
etc.), refuse in one sentence and remind them what you can help with. Do not call tools \
for out-of-scope questions.

## Style
Be concise, friendly, and clear (1-3 sentences).

IMPORTANT — UI rendering: The app already shows structured cards for tool results below \
your message (transaction rows, account list, spend summary, or subscriptions). DO NOT \
repeat that data as a markdown list, bullets, or table. Summarise what matters: counts, \
totals, date range, top category, account name scope, or a short observation. Format \
currency with its code (e.g. 85.42 GBP)."""

MAX_TOKENS = 600


def _call_llm(messages: list[dict], tools: list[dict] | None, tool_choice="auto") -> dict:
    if not settings.llm_api_key:
        raise HTTPException(status_code=503, detail="LLM is not configured")

    payload = {
        "model": settings.llm_model,
        "messages": messages,
        "max_tokens": MAX_TOKENS,
        "temperature": 0.2,
    }
    if tools:
        payload["tools"] = tools
        payload["tool_choice"] = tool_choice

    url = f"{settings.llm_base_url.rstrip('/')}/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.llm_api_key}",
        "Content-Type": "application/json",
    }

    try:
        with httpx.Client(timeout=60) as client:
            response = client.post(url, json=payload, headers=headers)
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"LLM request failed: {exc}") from exc

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail=f"LLM error: {response.text}")

    return response.json()["choices"][0]["message"]


def ping_llm(question: str | None = None) -> dict:
    """Minimal LLM smoke test — no tools, no DB."""
    prompt = question or "Reply with exactly one word: OK"
    message = _call_llm(
        [{"role": "user", "content": prompt}],
        tools=None,
    )
    return {
        "ok": True,
        "model": settings.llm_model,
        "reply": message.get("content") or "",
    }


def _data_size(data) -> str:
    if data is None:
        return "none"
    if isinstance(data, list):
        return f"{len(data)} item(s)"
    if isinstance(data, dict):
        return f"keys={list(data.keys())}"
    return type(data).__name__


def handle_chat(
    db: Session,
    user_sub: str,
    message: str,
    preferred_account_id: str | None = None,
) -> dict:
    logger.info(
        "handle_chat user_sub=%s account_id=%s message=%r",
        user_sub,
        preferred_account_id,
        message[:200],
    )

    messages = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": message},
    ]

    first = _call_llm(messages, chat_tools.TOOL_DEFINITIONS)
    tool_calls = first.get("tool_calls") or []

    if not tool_calls:
        logger.info("handle_chat: LLM answered without a tool call")
        return {
            "reply": first.get("content") or "",
            "data": None,
            "data_type": None,
            "tool_called": None,
        }

    logger.info("handle_chat: LLM requested %s tool call(s)", len(tool_calls))
    messages.append(first)

    tool_called = None
    data_type = None
    collected_data = None

    for call in tool_calls:
        fn = call["function"]
        name = fn["name"]
        try:
            arguments = json.loads(fn.get("arguments") or "{}")
        except json.JSONDecodeError:
            arguments = {}

        logger.info("LLM called tool=%s arguments=%s", name, arguments)

        tool_called, data_type, collected_data = chat_tools.dispatch_tool(
            name, arguments, db, user_sub, preferred_account_id
        )
        logger.info(
            "handle_chat: tool=%s data_type=%s result=%s",
            tool_called,
            data_type,
            _data_size(collected_data),
        )

        messages.append(
            {
                "role": "tool",
                "tool_call_id": call["id"],
                "content": json.dumps(collected_data),
            }
        )

    second = _call_llm(messages, chat_tools.TOOL_DEFINITIONS, tool_choice="none")

    # Empty list/dict → null so the UI does not render empty cards
    data_out = collected_data
    if data_out == [] or data_out == {}:
        data_out = None

    return {
        "reply": second.get("content") or "",
        "data": data_out,
        "data_type": data_type if data_out is not None else None,
        "tool_called": tool_called,
    }
