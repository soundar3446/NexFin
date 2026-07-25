import { Link, NavLink, Outlet, useParams } from 'react-router-dom'
import { useDashboardData } from '../../../context/DashboardDataContext'
import { formatAmount } from '../../../utils/format'
import { SkeletonList } from '../shared/Skeletons'
import { EmptyState } from '../shared/States'

const NICKNAME_ICON = {
  Bills: '🧾',
  Household: '🏠',
  Savings: '🐷',
  Everyday: '💳',
  Emergency: '🚨',
}

const TABS = [
  { to: '', label: 'Overview', end: true },
  { to: 'transactions', label: 'Transactions' },
  { to: 'insights', label: 'Insights' },
  { to: 'details', label: 'Details' },
]

function AccountLayout() {
  const { accountId } = useParams()
  const { loading, getAccount, getAccountTransactions } = useDashboardData()

  if (loading) {
    return (
      <div className="page">
        <div className="account-header">
          <div className="skeleton" style={{ width: 32, height: 32, borderRadius: '50%' }} />
          <div className="account-header-info">
            <div className="skeleton" style={{ width: '30%', height: 18 }} />
            <div className="skeleton" style={{ width: '45%', height: 12, marginTop: 8 }} />
          </div>
        </div>
        <SkeletonList rows={4} />
      </div>
    )
  }

  const account = getAccount(accountId)
  if (!account) {
    return (
      <div className="page">
        <EmptyState title="Account not found" body="This account isn't available." />
      </div>
    )
  }

  const icon = NICKNAME_ICON[account.Nickname] || '💰'

  return (
    <div className="page">
      <Link to="/accounts" className="link-btn">
        &larr; All accounts
      </Link>

      <header className="account-header">
        <span className="account-header-icon">{icon}</span>
        <div className="account-header-info">
          <h2>{account.Nickname || account.Description || 'Account'}</h2>
          <p>
            {account.AccountTypeCode} &middot; {account.Currency} &middot;{' '}
            {account.InternationalAccount ? 'International' : 'Domestic'}
          </p>
        </div>
        <div className="account-header-balance">
          <span className="stat-card-label">Current balance</span>
          <span className="stat-card-value">
            {account.balance ? formatAmount(account.balance.Amount.Amount, account.balance.Amount.Currency) : '—'}
          </span>
        </div>
      </header>

      <nav className="account-tabs">
        {TABS.map((tab) => (
          <NavLink
            key={tab.label}
            to={`/accounts/${accountId}${tab.to ? `/${tab.to}` : ''}`}
            end={tab.end}
            className={({ isActive }) => `account-tab${isActive ? ' active' : ''}`}
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <Outlet context={{ account, accountId, transactions: getAccountTransactions(accountId) }} />
    </div>
  )
}

export default AccountLayout
