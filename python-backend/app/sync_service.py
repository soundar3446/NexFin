from datetime import datetime

from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from app import models
from app.obie_client import obie_get

PAGE_SIZE = 100


def _upsert_accounts(db: Session, rows: list[dict]) -> None:
    if not rows:
        return
    stmt = pg_insert(models.Account).values(rows)
    stmt = stmt.on_conflict_do_update(
        index_elements=[models.Account.account_id],
        set_={
            "user_sub": stmt.excluded.user_sub,
            "nickname": stmt.excluded.nickname,
            "currency": stmt.excluded.currency,
            "account_type": stmt.excluded.account_type,
            "account_category": stmt.excluded.account_category,
            "status": stmt.excluded.status,
            "synced_at": func.now(),
        },
    )
    db.execute(stmt)


def _upsert_transactions(db: Session, rows: list[dict]) -> None:
    if not rows:
        return
    stmt = pg_insert(models.Transaction).values(rows)
    stmt = stmt.on_conflict_do_update(
        index_elements=[models.Transaction.transaction_id],
        set_={
            "account_id": stmt.excluded.account_id,
            "amount": stmt.excluded.amount,
            "currency": stmt.excluded.currency,
            "credit_debit_indicator": stmt.excluded.credit_debit_indicator,
            "status": stmt.excluded.status,
            "booking_datetime": stmt.excluded.booking_datetime,
            "transaction_information": stmt.excluded.transaction_information,
            "merchant_name": stmt.excluded.merchant_name,
            "merchant_category_code": stmt.excluded.merchant_category_code,
            "bank_transaction_code": stmt.excluded.bank_transaction_code,
            "bank_transaction_sub_code": stmt.excluded.bank_transaction_sub_code,
        },
    )
    db.execute(stmt)


async def sync_accounts_and_transactions(db: Session, user_sub: str, authorization: str) -> dict:
    accounts_res = await obie_get("", authorization, {"type": "domestic"})
    account_list = accounts_res["Data"]["Account"]

    account_rows = [
        {
            "account_id": account_data["AccountId"],
            "user_sub": user_sub,
            "nickname": account_data.get("Nickname"),
            "currency": account_data.get("Currency"),
            "account_type": account_data.get("AccountTypeCode"),
            "account_category": account_data.get("AccountCategory"),
            "status": account_data.get("Status"),
        }
        for account_data in account_list
    ]
    _upsert_accounts(db, account_rows)

    transactions_synced = 0
    for account_data in account_list:
        account_id = account_data["AccountId"]
        page_index = 0
        while True:
            txn_res = await obie_get(
                f"/{account_id}/transactions",
                authorization,
                {"pageIndex": page_index, "pageSize": PAGE_SIZE},
            )
            txn_list = txn_res["Data"]["Transaction"]

            txn_rows = []
            for txn_data in txn_list:
                amount = txn_data["Amount"]
                merchant = txn_data.get("MerchantDetails") or {}
                bank_code = txn_data.get("BankTransactionCode") or {}
                txn_rows.append(
                    {
                        "transaction_id": txn_data["TransactionId"],
                        "account_id": account_id,
                        "amount": amount["Amount"],
                        "currency": amount["Currency"],
                        "credit_debit_indicator": txn_data["CreditDebitIndicator"],
                        "status": txn_data.get("Status"),
                        "booking_datetime": datetime.fromisoformat(
                            txn_data["BookingDateTime"].replace("Z", "+00:00")
                        ),
                        "transaction_information": txn_data.get("TransactionInformation"),
                        "merchant_name": merchant.get("MerchantName"),
                        "merchant_category_code": merchant.get("MerchantCategoryCode"),
                        "bank_transaction_code": bank_code.get("Code"),
                        "bank_transaction_sub_code": bank_code.get("SubCode"),
                    }
                )
            _upsert_transactions(db, txn_rows)
            transactions_synced += len(txn_rows)

            pagination = txn_res["Data"].get("Pagination") or {}
            total = pagination.get("total", len(txn_list))
            page_index += 1
            if not txn_list or page_index * PAGE_SIZE >= total:
                break

    db.commit()
    return {"accounts_synced": len(account_rows), "transactions_synced": transactions_synced}
