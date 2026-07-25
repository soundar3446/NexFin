// Mirrors python-backend/app/mcc_categories.py (canonical MCC -> category mapping)
// and the category names in python-backend/app/categorizer.py, so a transaction
// shows the same category label whether it came from the backend's AI/DB-driven
// analysis or was categorized client-side from a live core-api response.
const MCC_CATEGORY_MAP = {
  '5411': 'Groceries',
  '5412': 'Groceries',
  '5422': 'Groceries',
  '5300': 'Groceries',
  '5812': 'Dining & Restaurants',
  '5813': 'Dining & Restaurants',
  '5814': 'Dining & Restaurants',
  '4111': 'Transport',
  '4112': 'Transport',
  '4121': 'Transport',
  '5541': 'Transport',
  '5542': 'Transport',
  '1711': 'Utilities & Bills',
  '4899': 'Utilities & Bills',
  '4900': 'Utilities & Bills',
  '5874': 'Utilities & Bills',
  '5311': 'Shopping',
  '5651': 'Shopping',
  '5732': 'Shopping',
  '5945': 'Entertainment & Leisure',
  '7832': 'Entertainment & Leisure',
  '5815': 'Subscriptions',
  '7997': 'Health & Fitness',
  '8011': 'Health & Fitness',
  '8021': 'Health & Fitness',
  '8099': 'Health & Fitness',
  '4511': 'Travel',
  '7011': 'Travel',
  '6300': 'Insurance',
  '6010': 'Cash Withdrawal',
  '6011': 'Cash Withdrawal',
}

const TRANSFER_CODES = new Set(['IssuedCreditTransfer', 'ReceivedCreditTransfer', 'Transfer'])

// Icon lookup for a category name lives in shared/icons.jsx (CategoryIcon) --
// single source of truth for how a category renders, not duplicated here.
export function categorizeTransaction(txn) {
  const bankCode = txn.BankTransactionCode?.Code
  if (bankCode && TRANSFER_CODES.has(bankCode) && !txn.MerchantDetails?.MerchantName) {
    return { label: 'Transfers' }
  }

  const isDebit = txn.CreditDebitIndicator === 'Debit'
  const mcc = txn.MerchantDetails?.MerchantCategoryCode
  const category = mcc && MCC_CATEGORY_MAP[mcc]
  if (category) return { label: category }

  return { label: isDebit ? 'Other Expense' : 'Other Income' }
}
