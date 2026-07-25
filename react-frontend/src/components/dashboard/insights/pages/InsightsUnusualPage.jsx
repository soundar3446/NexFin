import { useCallback, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { getUnusualSpending } from '../../../../api'
import { formatAmount, formatDate } from '../../../../utils/format'
import { AlertIcon } from '../../shared/icons'
import InsightNote from '../../shared/InsightNote'
import PeriodSelect from '../../shared/PeriodSelect'
import { SkeletonList } from '../../shared/Skeletons'
import { EmptyState, ErrorState } from '../../shared/States'

function InsightsUnusualPage() {
  const { token } = useOutletContext()
  const [period, setPeriod] = useState(3)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await getUnusualSpending(token, period))
    } catch {
      setError('Could not load unusual spending')
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
        <p>Outlier amounts and duplicate charges detected in your spending.</p>
        <PeriodSelect value={period} onChange={setPeriod} />
      </div>

      {loading ? (
        <SkeletonList rows={5} />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <section className="page-section">
          <InsightNote insight={data?.insight} source={data?.insight_source} />
          {!data || data.anomalies.length === 0 ? (
            <EmptyState icon="✅" title="Nothing unusual detected" body="No anomalies found in this period." />
          ) : (
            <ul className="anomaly-list">
              {data.anomalies.map((a) => (
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
                  <span className="anomaly-amount">{formatAmount(a.amount, 'GBP')}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}

export default InsightsUnusualPage
