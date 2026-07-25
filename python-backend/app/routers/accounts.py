from fastapi import APIRouter, Header, Query

from app.obie_client import obie_get

router = APIRouter(prefix="/accounts", tags=["accounts"])


@router.get("")
async def list_accounts(
    authorization: str = Header(...),
    type: str | None = Query(default=None),
):
    params = {"type": type} if type else None
    return await obie_get("", authorization, params)


@router.get("/{account_id}")
async def get_account(account_id: str, authorization: str = Header(...)):
    return await obie_get(f"/{account_id}", authorization)


@router.get("/{account_id}/balances")
async def get_balances(account_id: str, authorization: str = Header(...)):
    return await obie_get(f"/{account_id}/balances", authorization)


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
    return await obie_get(f"/{account_id}/transactions", authorization, params or None)
