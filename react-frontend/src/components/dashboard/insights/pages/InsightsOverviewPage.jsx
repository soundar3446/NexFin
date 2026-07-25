import { useCallback, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { getFinancialHealth, getMonthlySpending } from '../../../../api'
import { formatAmount, monthLabel } from '../../../../utils/format'
import MonthNavigator from '../../shared/MonthNavigator'
import { SkeletonList, SkeletonStatRow } from '../../shared/Skeletons'
import { EmptyState, ErrorState } from '../../shared/States'
import StatCard from '../../shared/StatCard'

function InsightsOverviewPage() {
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

  const current = months.find((m) => m.month === selectedMonth) || months[0]
  const currentHealth = health.find((h) => h.month === current.month)

  return (
    <div className="page">
      <MonthNavigator
        months={months.map((m) => m.month)}
        selected={current.month}
        onChange={setSelectedMonth}
      />

      <section className="stat-row">
        <StatCard
          label="Spent"
          value={formatAmount(current.total_spend, 'GBP')}
          sub={current.pending_spend > 0 ? `${formatAmount(current.pending_spend, 'GBP')} pending` : undefined}
          tone="negative"
        />
        <StatCard
          label="Income"
          value={formatAmount(current.total_income, 'GBP')}
          sub={current.pending_income > 0 ? `${formatAmount(current.pending_income, 'GBP')} pending` : undefined}
          tone="positive"
        />
        <StatCard
          label="Net"
          value={formatAmount(current.total_income - current.total_spend, 'GBP')}
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
                <span className="merchant-total">{formatAmount(m.total, 'GBP')}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}

export default InsightsOverviewPage
