import { Link, useParams } from 'react-router-dom'
import { useDashboardData } from '../../../context/DashboardDataContext'
import { EmptyState, LoadingState } from '../shared/States'
import TransactionRow from '../shared/TransactionRow'
import { formatAmount, formatDate } from '../../../utils/format'

// Placeholder for the per-account dashboard (overview/transactions/insights/details
// sub-pages) planned as the next phase. Shows enough real data now so the link
// from AccountCard isn't a dead end in the meantime.
function AccountDetailPlaceholder() {
  const { accountId } = useParams()
  const { loading, getAccount, getAccountTransactions } = useDashboardData()

  if (loading) return <LoadingState label="Loading account..." />

  const account = getAccount(accountId)
  if (!account) {
    return (
      <div className="page">
        <EmptyState title="Account not found" body="This account isn't available." />
      </div>
    )
  }

  const txns = getAccountTransactions(accountId).slice(0, 10)
  const holderName = account.Account?.[0]?.Name

  return (
    <div className="page">
      <header className="page-header">
        <Link to="/accounts" className="link-btn">
          &larr; All accounts
        </Link>
        <p>
          {account.AccountTypeCode} &middot; {account.Currency} &middot;{' '}
          {account.InternationalAccount ? 'International' : 'Domestic'}
        </p>
      </header>

      <section className="stat-row">
        <div className="stat-card stat-card-neutral">
          <span className="stat-card-label">Current balance</span>
          <span className="stat-card-value">
            {account.balance ? formatAmount(account.balance.Amount.Amount, account.balance.Amount.Currency) : '—'}
          </span>
        </div>
      </section>

      <section className="page-section">
        <div className="section-header">
          <h2>Account details</h2>
        </div>
        <dl className="detail-list">
          {holderName && (
            <div className="detail-row">
              <dt>Held by</dt>
              <dd>{holderName}</dd>
            </div>
          )}
          {account.Description && (
            <div className="detail-row">
              <dt>Description</dt>
              <dd>{account.Description}</dd>
            </div>
          )}
          {account.OpeningDate && (
            <div className="detail-row">
              <dt>Opened</dt>
              <dd>{formatDate(account.OpeningDate)}</dd>
            </div>
          )}
          {account.Status && (
            <div className="detail-row">
              <dt>Status</dt>
              <dd>{account.Status}</dd>
            </div>
          )}
        </dl>
      </section>

      <section className="page-section">
        <div className="section-header">
          <h2>Recent transactions</h2>
        </div>
        {txns.length === 0 ? (
          <EmptyState icon="🧾" title="No transactions yet" />
        ) : (
          <ul className="transactions-feed-list">
            {txns.map((txn) => (
              <TransactionRow key={txn.TransactionId} txn={txn} showAccount={false} />
            ))}
          </ul>
        )}
      </section>

      <p className="status-text-inline">Full account dashboard (transactions, insights, details tabs) is next.</p>
    </div>
  )
}

export default AccountDetailPlaceholder
