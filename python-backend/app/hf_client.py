import httpx

from app.config import settings


class HfUnavailable(Exception):
    pass


async def chat_complete(messages: list[dict], *, max_tokens: int = 600, temperature: float = 0.2) -> str:
    if not settings.hf_api_token:
        raise HfUnavailable("HF_API_TOKEN is not configured")

    try:
        async with httpx.AsyncClient(timeout=45) as client:
            response = await client.post(
                settings.hf_router_url,
                headers={"Authorization": f"Bearer {settings.hf_api_token}"},
                json={
                    "model": settings.hf_model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                },
            )
    except httpx.HTTPError as exc:
        raise HfUnavailable(str(exc)) from exc

    if response.status_code != 200:
        raise HfUnavailable(f"HF router returned {response.status_code}: {response.text}")

    data = response.json()
    try:
        return data["choices"][0]["message"]["content"]
    except (KeyError, IndexError) as exc:
        raise HfUnavailable(f"Unexpected HF response shape: {data}") from exc
