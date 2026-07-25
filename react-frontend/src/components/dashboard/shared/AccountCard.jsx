import { Link } from 'react-router-dom'
import { formatAmount, formatDate } from '../../../utils/format'

const NICKNAME_ICON = {
  Bills: '🧾',
  Household: '🏠',
  Savings: '🐷',
  Everyday: '💳',
  Emergency: '🚨',
}

function AccountCard({ account }) {
  const balance = account.balance
  const icon = NICKNAME_ICON[account.Nickname] || '💰'
  const holderName = account.Account?.[0]?.Name

  return (
    <Link to={`/accounts/${account.AccountId}`} className="account-card-link">
      <div className="account-card">
        <div className="account-card-top">
          <span className="account-card-icon">{icon}</span>
          <span className={`account-badge ${account.InternationalAccount ? 'intl' : 'domestic'}`}>
            {account.InternationalAccount ? 'International' : 'Domestic'}
          </span>
        </div>
        <h3>{account.Nickname || account.Description || 'Account'}</h3>
        {account.Description && account.Description !== account.Nickname && (
          <p className="account-description">{account.Description}</p>
        )}
        <p className="account-type">
          {account.AccountTypeCode} &middot; {account.Currency}
        </p>
        <p className="account-balance">
          {balance ? formatAmount(balance.Amount.Amount, balance.Amount.Currency) : '—'}
        </p>
        {balance?.CreditLine?.length > 0 && (
          <p className="account-available">
            {formatAmount(balance.CreditLine[0].Amount.Amount, balance.CreditLine[0].Amount.Currency)} available
          </p>
        )}
        <div className="account-card-footer">
          {holderName && <span className="account-holder">{holderName}</span>}
          {account.Status && <span className={`status-dot status-${account.Status.toLowerCase()}`}>{account.Status}</span>}
        </div>
        {account.OpeningDate && (
          <p className="account-opened">Opened {formatDate(account.OpeningDate)}</p>
        )}
      </div>
    </Link>
  )
}

export default AccountCard
