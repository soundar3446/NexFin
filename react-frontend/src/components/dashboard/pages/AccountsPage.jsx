import { useDashboardData } from '../../../context/DashboardDataContext'
import AccountCard from '../shared/AccountCard'
import { EmptyState, ErrorState, LoadingState } from '../shared/States'
import { formatAmount } from '../../../utils/format'

function groupByNickname(accounts) {
  const groups = new Map()
  for (const account of accounts) {
    const key = account.Nickname || 'Other'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(account)
  }
  return [...groups.entries()]
}

function AccountsPage() {
  const { accounts, loading, error } = useDashboardData()

  if (loading) return <LoadingState label="Loading your accounts..." />
  if (error) return <ErrorState message={error} />

  if (accounts.length === 0) {
    return (
      <div className="page">
        <header className="page-header">
          <h1>Accounts</h1>
        </header>
        <EmptyState title="No accounts found" body="No accounts are linked yet." />
      </div>
    )
  }

  const groups = groupByNickname(accounts)

  return (
    <div className="page">
      <header className="page-header">
        <h1>Accounts</h1>
        <p>
          {accounts.length} accounts across {groups.length} categories.
        </p>
      </header>

      {groups.map(([nickname, group]) => {
        const currency = group[0]?.Currency || 'GBP'
        const subtotal = group.reduce(
          (sum, a) => sum + (a.balance ? Number(a.balance.Amount.Amount) : 0),
          0,
        )
        return (
          <section className="page-section" key={nickname}>
            <div className="section-header">
              <h2>{nickname}</h2>
              <span className="section-subtotal">{formatAmount(subtotal, currency)}</span>
            </div>
            <div className="accounts-grid">
              {group.map((account) => (
                <AccountCard key={account.AccountId} account={account} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

export default AccountsPage
