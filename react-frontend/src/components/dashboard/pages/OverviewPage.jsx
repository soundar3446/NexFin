import { Link } from 'react-router-dom'
import { useDashboardData } from '../../../context/DashboardDataContext'
import AccountCard from '../shared/AccountCard'
import { EmptyState, ErrorState, LoadingState } from '../shared/States'
import StatCard from '../shared/StatCard'
import TransactionRow from '../shared/TransactionRow'
import { formatAmount } from '../../../utils/format'

function isThisMonth(isoString) {
  const d = new Date(isoString)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

function OverviewPage() {
  const { accounts, transactions, loading, error } = useDashboardData()

  if (loading) return <LoadingState label="Loading your accounts..." />
  if (error) return <ErrorState message={error} />

  const totalBalance = accounts.reduce(
    (sum, a) => sum + (a.balance ? Number(a.balance.Amount.Amount) : 0),
    0,
  )
  const currency = accounts[0]?.Currency || 'GBP'

  const monthTxns = transactions.filter((t) => isThisMonth(t.BookingDateTime))
  const monthSpend = monthTxns
    .filter((t) => t.CreditDebitIndicator === 'Debit')
    .reduce((sum, t) => sum + Number(t.Amount.Amount), 0)
  const monthIncome = monthTxns
    .filter((t) => t.CreditDebitIndicator === 'Credit')
    .reduce((sum, t) => sum + Number(t.Amount.Amount), 0)

  const recentTxns = transactions.slice(0, 6)

  return (
    <div className="page">
      <header className="page-header">
        <p>Everything across your {accounts.length} accounts, at a glance.</p>
      </header>

      <section className="stat-row">
        <StatCard label="Total balance" value={formatAmount(totalBalance, currency)} tone="neutral" />
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
          <h2>Your accounts</h2>
          <Link to="/accounts" className="link-btn">
            View all
          </Link>
        </div>
        {accounts.length === 0 ? (
          <EmptyState title="No accounts found" body="No accounts are linked yet." />
        ) : (
          <div className="accounts-grid">
            {accounts.slice(0, 4).map((account) => (
              <AccountCard key={account.AccountId} account={account} />
            ))}
          </div>
        )}
      </section>

      <section className="page-section">
        <div className="section-header">
          <h2>Recent transactions</h2>
          <Link to="/transactions" className="link-btn">
            View all
          </Link>
        </div>
        {recentTxns.length === 0 ? (
          <EmptyState
            icon="🧾"
            title="No transactions yet"
            body="Once activity comes through on your accounts, it'll show up here."
          />
        ) : (
          <ul className="transactions-feed-list">
            {recentTxns.map((txn) => (
              <TransactionRow key={txn.TransactionId} txn={txn} />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default OverviewPage
