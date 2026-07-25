import httpx
from fastapi import APIRouter, Header, HTTPException, Query

from app.config import settings

router = APIRouter(prefix="/accounts", tags=["accounts"])

OBIE_AISP_PATH = "/api/obie-aisp/v4.0/accounts"


async def _forward(path: str, authorization: str, params: dict | None = None):
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


@router.get("")
async def list_accounts(
    authorization: str = Header(...),
    type: str | None = Query(default=None),
):
    params = {"type": type} if type else None
    return await _forward("", authorization, params)


@router.get("/{account_id}")
async def get_account(account_id: str, authorization: str = Header(...)):
    return await _forward(f"/{account_id}", authorization)


@router.get("/{account_id}/balances")
async def get_balances(account_id: str, authorization: str = Header(...)):
    return await _forward(f"/{account_id}/balances", authorization)


@router.get("/{account_id}/transactions")
async def get_transactions(
    account_id: str,
    authorization: str = Header(...),
    pageIndex: int | None = Query(default=None, ge=0),
    pageSize: int | None = Query(default=None, ge=1),
):
    params = {}
    if pageIndex is not None:
        params["pageIndex"] = pageIndex
    if pageSize is not None:
        params["pageSize"] = pageSize
    return await _forward(f"/{account_id}/transactions", authorization, params or None)
