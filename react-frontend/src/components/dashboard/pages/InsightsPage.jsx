import { useCallback, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { getFinancialHealth, getMonthlySpending, syncAccounts } from '../../../api'
import { formatAmount, monthLabel } from '../../../utils/format'
import CategoryBarChart from '../shared/charts/CategoryBarChart'
import IncomeExpenseChart from '../shared/charts/IncomeExpenseChart'
import { SkeletonList, SkeletonStatRow } from '../shared/Skeletons'
import { EmptyState, ErrorState } from '../shared/States'
import StatCard from '../shared/StatCard'

function InsightsPage() {
  const { token } = useOutletContext()
  const [months, setMonths] = useState(null)
  const [health, setHealth] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await syncAccounts(token)
      const [spending, healthData] = await Promise.all([
        getMonthlySpending(token),
        getFinancialHealth(token),
      ])
      setMonths(spending)
      setHealth(healthData)
      setSelectedMonth((current) => current ?? spending[0]?.month ?? null)
    } catch {
      setError('Could not load spending insights')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <div className="page">
        <SkeletonStatRow />
        <SkeletonList rows={5} />
      </div>
    )
  }
  if (error) return <ErrorState message={error} />
  if (!months || months.length === 0) {
    return (
      <div className="page">
        <EmptyState
          icon="📊"
          title="Not enough activity yet"
          body="Insights build up once transactions come through on your accounts."
        />
      </div>
    )
  }

  const currency = 'GBP'
  const current = months.find((m) => m.month === selectedMonth) || months[0]
  const chronological = [...months].reverse().map((m) => ({ ...m, label: monthLabel(m.month) }))
  const currentHealth = health.find((h) => h.month === current.month)

  return (
    <div className="page">
      <header className="page-header page-header-row">
        <p>Spending analysis from your synced transaction history.</p>
        <button type="button" className="link-btn refresh-btn" onClick={load}>
          ⟳ Refresh
        </button>
      </header>

      <div className="month-tabs">
        {months.map((m) => (
          <button
            key={m.month}
            type="button"
            className={`month-tab${m.month === current.month ? ' active' : ''}`}
            onClick={() => setSelectedMonth(m.month)}
          >
            {monthLabel(m.month)}
          </button>
        ))}
      </div>

      <section className="stat-row">
        <StatCard
          label="Spent"
          value={formatAmount(current.total_spend, currency)}
          sub={current.pending_spend > 0 ? `${formatAmount(current.pending_spend, currency)} pending` : undefined}
          tone="negative"
        />
        <StatCard
          label="Income"
          value={formatAmount(current.total_income, currency)}
          sub={current.pending_income > 0 ? `${formatAmount(current.pending_income, currency)} pending` : undefined}
          tone="positive"
        />
        <StatCard
          label="Net"
          value={formatAmount(current.total_income - current.total_spend, currency)}
          tone={current.total_income - current.total_spend >= 0 ? 'positive' : 'negative'}
        />
        <StatCard label="Transactions" value={current.transaction_count} tone="neutral" />
      </section>

      {currentHealth && currentHealth.observations.length > 0 && (
        <section className="page-section">
          <div className="section-header">
            <h2>Financial health — {monthLabel(current.month)}</h2>
          </div>
          <ul className="health-list">
            {currentHealth.observations.map((obs, i) => (
              <li key={i} className={`health-item health-${obs.severity}`}>
                <span className="health-icon">
                  {obs.severity === 'good' ? '✓' : obs.severity === 'warning' ? '!' : 'i'}
                </span>
                <span>{obs.message}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="page-section">
        <div className="section-header">
          <h2>Spend by category — {monthLabel(current.month)}</h2>
        </div>
        {current.by_category.length === 0 ? (
          <EmptyState title="No spending this month" />
        ) : (
          <CategoryBarChart
            data={current.by_category.map((c) => ({
              label: c.category,
              total: c.total,
            }))}
            currency={currency}
          />
        )}
      </section>

      <section className="page-section">
        <div className="section-header">
          <h2>Top merchants — {monthLabel(current.month)}</h2>
        </div>
        {current.by_merchant.length === 0 ? (
          <EmptyState title="No merchant spending this month" />
        ) : (
          <ol className="merchant-list">
            {current.by_merchant.map((m, i) => (
              <li key={m.merchant_name}>
                <span className="merchant-rank">{i + 1}</span>
                <span className="merchant-name">{m.merchant_name || 'Unknown'}</span>
                <span className="merchant-total">{formatAmount(m.total, currency)}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {chronological.length > 1 && (
        <section className="page-section">
          <div className="section-header">
            <h2>Income vs. spend by month</h2>
          </div>
          <IncomeExpenseChart months={chronological} currency={currency} />
        </section>
      )}
    </div>
  )
}

export default InsightsPage
