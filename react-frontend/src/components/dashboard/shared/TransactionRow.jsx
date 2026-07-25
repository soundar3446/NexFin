import { categorizeTransaction } from '../../../utils/categories'
import { formatAmount, formatDate } from '../../../utils/format'

function TransactionRow({ txn, showAccount = true }) {
  const category = categorizeTransaction(txn)
  const isDebit = txn.CreditDebitIndicator === 'Debit'

  return (
    <li className="transaction-row">
      <span className="transaction-category-icon">{category.icon}</span>
      <div className="transaction-main">
        <span className="transaction-info">
          {txn.TransactionInformation || txn.MerchantDetails?.MerchantName || 'Transaction'}
        </span>
        <span className="transaction-meta">
          {formatDate(txn.BookingDateTime)} &middot; {category.label}
          {showAccount && txn._account && <> &middot; {txn._account.Nickname}</>}
          {txn.Status === 'PDNG' && <span className="pending-tag">Pending</span>}
        </span>
      </div>
      <span className={`transaction-amount ${isDebit ? 'debit' : 'credit'}`}>
        {isDebit ? '-' : '+'}
        {formatAmount(txn.Amount.Amount, txn.Amount.Currency)}
      </span>
    </li>
  )
}

export default TransactionRow
