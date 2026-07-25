// Merchant Category Code (MCC) -> friendly label/icon, for grouping transactions into
// spending categories. Falls back gracefully for codes outside this sample set.
const MCC_MAP = {
  '4900': { label: 'Utilities', icon: '💡' },
  '4899': { label: 'Utilities', icon: '💡' },
  '1711': { label: 'Housing & Utilities', icon: '🏠' },
  '5411': { label: 'Groceries', icon: '🛒' },
  '5412': { label: 'Groceries', icon: '🛒' },
  '5812': { label: 'Dining', icon: '🍽️' },
  '5813': { label: 'Dining', icon: '🍽️' },
  '5814': { label: 'Dining', icon: '🍽️' },
  '5541': { label: 'Fuel & Transport', icon: '⛽' },
  '4121': { label: 'Fuel & Transport', icon: '🚕' },
  '4111': { label: 'Fuel & Transport', icon: '🚆' },
  '5732': { label: 'Electronics', icon: '🔌' },
  '5651': { label: 'Shopping', icon: '🛍️' },
  '5311': { label: 'Shopping', icon: '🛍️' },
  '5945': { label: 'Entertainment', icon: '🎮' },
  '7832': { label: 'Entertainment', icon: '🎬' },
  '5815': { label: 'Subscriptions', icon: '📺' },
  '4899_2': { label: 'Subscriptions', icon: '📺' },
  '8011': { label: 'Health', icon: '🏥' },
  '8021': { label: 'Health', icon: '🏥' },
  '8099': { label: 'Health', icon: '🏥' },
  '5874': { label: 'Bills & Services', icon: '🧾' },
  '6300': { label: 'Insurance', icon: '🛡️' },
}

const TRANSFER_CODES = new Set(['IssuedCreditTransfer', 'ReceivedCreditTransfer', 'Transfer'])

export function categorizeTransaction(txn) {
  const bankCode = txn.BankTransactionCode?.Code
  if (bankCode && TRANSFER_CODES.has(bankCode) && !txn.MerchantDetails?.MerchantName) {
    return { label: 'Transfers', icon: '🔁' }
  }

  const mcc = txn.MerchantDetails?.MerchantCategoryCode
  if (mcc && MCC_MAP[mcc]) return MCC_MAP[mcc]
  if (mcc) return { label: `Other (${mcc})`, icon: '🧾' }
  return { label: 'Other', icon: '🧾' }
}
