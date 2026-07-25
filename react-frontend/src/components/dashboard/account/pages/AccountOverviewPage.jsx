import { Link, useOutletContext } from 'react-router-dom'
import { formatAmount } from '../../../../utils/format'
import { EmptyState } from '../../shared/States'
import StatCard from '../../shared/StatCard'
import TransactionRow from '../../shared/TransactionRow'

function isThisMonth(isoString) {
  const d = new Date(isoString)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

function AccountOverviewPage() {
  const { account, accountId, transactions } = useOutletContext()
  const currency = account.Currency

  const monthTxns = transactions.filter((t) => isThisMonth(t.BookingDateTime))
  const monthSpend = monthTxns
    .filter((t) => t.CreditDebitIndicator === 'Debit')
    .reduce((sum, t) => sum + Number(t.Amount.Amount), 0)
  const monthIncome = monthTxns
    .filter((t) => t.CreditDebitIndicator === 'Credit')
    .reduce((sum, t) => sum + Number(t.Amount.Amount), 0)

  const creditLine = account.balance?.CreditLine?.[0]
  const recentTxns = transactions.slice(0, 8)

  return (
    <div className="page">
      <section className="stat-row">
        {creditLine && (
          <StatCard label="Available credit line" value={formatAmount(creditLine.Amount.Amount, creditLine.Amount.Currency)} />
        )}
        <StatCard label="Money in this month" value={formatAmount(monthIncome, currency)} tone="positive" />
        <StatCard label="Money out this month" value={formatAmount(monthSpend, currency)} tone="negative" />
        <StatCard
          label="Net this month"
          value={formatAmount(monthIncome - monthSpend, currency)}
          tone={monthIncome - monthSpend >= 0 ? 'positive' : 'negative'}
        />
      </section>

      <section className="page-section">
        <div className="section-header">
          <h2>Recent transactions</h2>
          <Link to={`/accounts/${accountId}/transactions`} className="link-btn">
            View all
          </Link>
        </div>
        {recentTxns.length === 0 ? (
          <EmptyState icon="🧾" title="No transactions yet" />
        ) : (
          <ul className="transactions-feed-list">
            {recentTxns.map((txn) => (
              <TransactionRow key={txn.TransactionId} txn={txn} showAccount={false} />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default AccountOverviewPage
