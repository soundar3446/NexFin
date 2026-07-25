import httpx
from fastapi import HTTPException

from app.config import settings

OBIE_AISP_PATH = "/api/obie-aisp/v4.0/accounts"

TIMEOUT = httpx.Timeout(30.0, connect=10.0)


async def obie_get(path: str, authorization: str, params: dict | None = None):
    if not settings.core_api_base_url:
        raise HTTPException(status_code=500, detail="Core API is not configured")

    url = f"{settings.core_api_base_url}{OBIE_AISP_PATH}{path}"

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            response = await client.get(
                url,
                params=params,
                headers={"Authorization": authorization, "Accept": "application/json"},
            )
    except httpx.TimeoutException as exc:
        raise HTTPException(status_code=504, detail=f"core-api request timed out: {exc}") from exc
    except httpx.RequestError as exc:
        raise HTTPException(status_code=502, detail=f"core-api request failed: {exc}") from exc

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    return response.json()
