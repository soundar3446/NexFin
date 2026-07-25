from datetime import datetime

from sqlalchemy.orm import Session

from app import models
from app.obie_client import obie_get

PAGE_SIZE = 100


async def sync_accounts_and_transactions(db: Session, user_sub: str, authorization: str) -> dict:
    accounts_res = await obie_get("", authorization, {"type": "domestic"})
    account_list = accounts_res["Data"]["Account"]

    accounts_synced = 0
    transactions_synced = 0

    for account_data in account_list:
        account_id = account_data["AccountId"]
        account = db.get(models.Account, account_id)
        if account is None:
            account = models.Account(account_id=account_id)
            db.add(account)

        account.user_sub = user_sub
        account.nickname = account_data.get("Nickname")
        account.currency = account_data.get("Currency")
        account.account_type = account_data.get("AccountTypeCode")
        account.account_category = account_data.get("AccountCategory")
        account.status = account_data.get("Status")
        accounts_synced += 1

        page_index = 0
        while True:
            txn_res = await obie_get(
                f"/{account_id}/transactions",
                authorization,
                {"pageIndex": page_index, "pageSize": PAGE_SIZE},
            )
            txn_list = txn_res["Data"]["Transaction"]

            for txn_data in txn_list:
                transaction_id = txn_data["TransactionId"]
                txn = db.get(models.Transaction, transaction_id)
                if txn is None:
                    txn = models.Transaction(transaction_id=transaction_id)
                    db.add(txn)

                amount = txn_data["Amount"]
                merchant = txn_data.get("MerchantDetails") or {}
                bank_code = txn_data.get("BankTransactionCode") or {}

                txn.account_id = account_id
                txn.amount = amount["Amount"]
                txn.currency = amount["Currency"]
                txn.credit_debit_indicator = txn_data["CreditDebitIndicator"]
                txn.status = txn_data.get("Status")
                txn.booking_datetime = datetime.fromisoformat(
                    txn_data["BookingDateTime"].replace("Z", "+00:00")
                )
                txn.transaction_information = txn_data.get("TransactionInformation")
                txn.merchant_name = merchant.get("MerchantName")
                txn.merchant_category_code = merchant.get("MerchantCategoryCode")
                txn.bank_transaction_code = bank_code.get("Code")
                txn.bank_transaction_sub_code = bank_code.get("SubCode")
                transactions_synced += 1

            pagination = txn_res["Data"].get("Pagination") or {}
            total = pagination.get("total", len(txn_list))
            page_index += 1
            if not txn_list or page_index * PAGE_SIZE >= total:
                break

    db.commit()
    return {"accounts_synced": accounts_synced, "transactions_synced": transactions_synced}
