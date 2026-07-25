import httpx
from fastapi import HTTPException

from app.config import settings

OBIE_AISP_PATH = "/api/obie-aisp/v4.0/accounts"


async def obie_get(path: str, authorization: str, params: dict | None = None):
    if not settings.core_api_base_url:
        raise HTTPException(status_code=500, detail="Core API is not configured")

    url = f"{settings.core_api_base_url}{OBIE_AISP_PATH}{path}"

    async with httpx.AsyncClient() as client:
        response = await client.get(
            url,
            params=params,
            headers={"Authorization": authorization, "Accept": "application/json"},
        )

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    return response.json()
