import { useCallback, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { getIncomeExpenseTrend } from '../../../../api'
import { formatAmount } from '../../../../utils/format'
import LineChart from '../../shared/charts/LineChart'
import InsightNote from '../../shared/InsightNote'
import PeriodSelect from '../../shared/PeriodSelect'
import { SkeletonList, SkeletonStatRow } from '../../shared/Skeletons'
import { EmptyState, ErrorState } from '../../shared/States'
import StatCard from '../../shared/StatCard'

function InsightsTrendsPage() {
  const { token } = useOutletContext()
  const [period, setPeriod] = useState(6)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await getIncomeExpenseTrend(token, period))
    } catch {
      setError('Could not load income/spend trend')
    } finally {
      setLoading(false)
    }
  }, [token, period])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="page">
      <div className="page-header page-header-row">
        <p>Income versus spend over time, with your average savings rate.</p>
        <PeriodSelect value={period} onChange={setPeriod} />
      </div>

      {loading ? (
        <>
          <SkeletonStatRow />
          <SkeletonList rows={4} />
        </>
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <>
          <InsightNote insight={data?.insight} source={data?.insight_source} />
          {data && (
            <section className="stat-row">
              <StatCard label="Avg. income / month" value={formatAmount(data.average_income, 'GBP')} />
              <StatCard label="Avg. spend / month" value={formatAmount(data.average_expense, 'GBP')} />
              <StatCard
                label="Avg. savings rate"
                value={`${data.average_savings_rate}%`}
                tone={data.average_savings_rate >= 0 ? 'positive' : 'negative'}
              />
            </section>
          )}
          <section className="page-section">
            {!data || data.months.length === 0 ? (
              <EmptyState title="Not enough history for a trend yet" />
            ) : (
              <LineChart months={data.months} currency="GBP" />
            )}
          </section>
        </>
      )}
    </div>
  )
}

export default InsightsTrendsPage
