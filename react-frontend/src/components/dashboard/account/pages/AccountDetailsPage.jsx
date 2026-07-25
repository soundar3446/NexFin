import { useOutletContext } from 'react-router-dom'
import { formatDate } from '../../../../utils/format'

function maskIdentification(id) {
  if (!id || id.length <= 4) return id
  return `${'•'.repeat(id.length - 4)}${id.slice(-4)}`
}

function AccountDetailsPage() {
  const { account } = useOutletContext()
  const holder = account.Account?.[0]

  const rows = [
    ['Nickname', account.Nickname],
    ['Description', account.Description],
    ['Held by', holder?.Name],
    ['Account type', account.AccountTypeCode],
    ['Category', account.AccountCategory],
    ['Currency', account.Currency],
    ['Domestic / International', account.InternationalAccount ? 'International' : 'Domestic'],
    ['Status', account.Status],
    ['Opened', account.OpeningDate ? formatDate(account.OpeningDate) : undefined],
    ['Sort code / account number', holder?.Identification ? maskIdentification(holder.Identification) : undefined],
    ['Servicer', account.Servicer?.Name],
  ].filter(([, value]) => value)

  return (
    <div className="page">
      <section className="page-section">
        <div className="section-header">
          <h2>Account details</h2>
        </div>
        <dl className="detail-list">
          {rows.map(([label, value]) => (
            <div className="detail-row" key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}

export default AccountDetailsPage
