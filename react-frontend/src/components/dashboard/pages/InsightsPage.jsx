import { useCallback, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  getCategoryBreakdown,
  getFinancialHealth,
  getIncomeExpenseTrend,
  getMonthlySpending,
  getUnusualSpending,
  syncAccounts,
} from '../../../api'
import { formatAmount, formatDate, monthLabel } from '../../../utils/format'
import { AlertIcon } from '../shared/icons'
import LineChart from '../shared/charts/LineChart'
import PieChart from '../shared/charts/PieChart'
import MonthNavigator from '../shared/MonthNavigator'
import { SkeletonList, SkeletonStatRow } from '../shared/Skeletons'
import { EmptyState, ErrorState } from '../shared/States'
import StatCard from '../shared/StatCard'

const CURRENCY = 'GBP'

function InsightsInsightNote({ insight, source }) {
  if (!insight) return null
  return (
    <p className="ai-insight-note">
      <span className={`ai-insight-badge ${source === 'ai' ? 'ai' : 'fallback'}`}>
        {source === 'ai' ? '✨ AI insight' : 'Summary'}
      </span>
      {insight}
    </p>
  )
}

function InsightsPage() {
  const { token } = useOutletContext()
  const [months, setMonths] = useState(null)
  const [health, setHealth] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(null)

  const [aiPeriod, setAiPeriod] = useState(6)
  const [categoryData, setCategoryData] = useState(null)
  const [trendData, setTrendData] = useState(null)
  const [unusualData, setUnusualData] = useState(null)
  const [aiLoading, setAiLoading] = useState(true)
  const [aiError, setAiError] = useState(null)

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

  const loadAiInsights = useCallback(
    async (period) => {
      setAiLoading(true)
      setAiError(null)
      try {
        const [category, trend, unusual] = await Promise.all([
          getCategoryBreakdown(token, period),
          getIncomeExpenseTrend(token, period),
          getUnusualSpending(token, period),
        ])
        setCategoryData(category)
        setTrendData(trend)
        setUnusualData(unusual)
      } catch {
        setAiError('Could not load AI-powered insights')
      } finally {
        setAiLoading(false)
      }
    },
    [token],
  )

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    loadAiInsights(aiPeriod)
  }, [loadAiInsights, aiPeriod])

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
      <header className="page-header page-header-row">
        <p>Spending analysis from your synced transaction history.</p>
        <button type="button" className="link-btn refresh-btn" onClick={load}>
          ⟳ Refresh
        </button>
      </header>

      <MonthNavigator
        months={months.map((m) => m.month)}
        selected={current.month}
        onChange={setSelectedMonth}
      />

      <section className="stat-row">
        <StatCard
          label="Spent"
          value={formatAmount(current.total_spend, CURRENCY)}
          sub={current.pending_spend > 0 ? `${formatAmount(current.pending_spend, CURRENCY)} pending` : undefined}
          tone="negative"
        />
        <StatCard
          label="Income"
          value={formatAmount(current.total_income, CURRENCY)}
          sub={current.pending_income > 0 ? `${formatAmount(current.pending_income, CURRENCY)} pending` : undefined}
          tone="positive"
        />
        <StatCard
          label="Net"
          value={formatAmount(current.total_income - current.total_spend, CURRENCY)}
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
                <span className="merchant-total">{formatAmount(m.total, CURRENCY)}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <header className="page-header page-header-row ai-section-header">
        <div>
          <h2 className="ai-section-title">AI-powered insights</h2>
          <p>Category breakdown, trend, and anomaly detection over a longer window.</p>
        </div>
        <select
          className="month-navigator-select"
          value={aiPeriod}
          onChange={(e) => setAiPeriod(Number(e.target.value))}
          aria-label="Insights period"
        >
          <option value={3}>Last 3 months</option>
          <option value={6}>Last 6 months</option>
          <option value={12}>Last 12 months</option>
        </select>
      </header>

      {aiLoading ? (
        <SkeletonStatRow />
      ) : aiError ? (
        <ErrorState message={aiError} />
      ) : (
        <>
          <section className="page-section">
            <div className="section-header">
              <h2>Spend by category</h2>
            </div>
            <InsightsInsightNote insight={categoryData?.insight} source={categoryData?.insight_source} />
            {!categoryData || categoryData.categories.length === 0 ? (
              <EmptyState title="No spending in this period" />
            ) : (
              <PieChart
                categories={categoryData.categories}
                currency={CURRENCY}
                total={categoryData.total_expense}
              />
            )}
          </section>

          <section className="page-section">
            <div className="section-header">
              <h2>Income vs. spend trend</h2>
            </div>
            <InsightsInsightNote insight={trendData?.insight} source={trendData?.insight_source} />
            {trendData && (
              <div className="stat-row">
                <StatCard label="Avg. income / month" value={formatAmount(trendData.average_income, CURRENCY)} />
                <StatCard label="Avg. spend / month" value={formatAmount(trendData.average_expense, CURRENCY)} />
                <StatCard
                  label="Avg. savings rate"
                  value={`${trendData.average_savings_rate}%`}
                  tone={trendData.average_savings_rate >= 0 ? 'positive' : 'negative'}
                />
              </div>
            )}
            {!trendData || trendData.months.length === 0 ? (
              <EmptyState title="Not enough history for a trend yet" />
            ) : (
              <LineChart months={trendData.months} currency={CURRENCY} />
            )}
          </section>

          <section className="page-section">
            <div className="section-header">
              <h2>Unusual spending</h2>
            </div>
            <InsightsInsightNote insight={unusualData?.insight} source={unusualData?.insight_source} />
            {!unusualData || unusualData.anomalies.length === 0 ? (
              <EmptyState icon="✅" title="Nothing unusual detected" body="No anomalies found in this period." />
            ) : (
              <ul className="anomaly-list">
                {unusualData.anomalies.map((a) => (
                  <li key={a.transaction_id} className={`anomaly-item severity-${a.severity}`}>
                    <span className="anomaly-icon">
                      <AlertIcon />
                    </span>
                    <div className="anomaly-main">
                      <span className="anomaly-merchant">{a.merchant || a.category}</span>
                      <span className="anomaly-reason">
                        {a.reason} &middot; {formatDate(a.booking_date)}
                      </span>
                    </div>
                    <span className="anomaly-amount">{formatAmount(a.amount, CURRENCY)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  )
}

export default InsightsPage
