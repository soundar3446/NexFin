import { useCallback, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { getCategoryBreakdown } from '../../../../api'
import PieChart from '../../shared/charts/PieChart'
import InsightNote from '../../shared/InsightNote'
import PeriodSelect from '../../shared/PeriodSelect'
import { SkeletonList } from '../../shared/Skeletons'
import { EmptyState, ErrorState } from '../../shared/States'

function InsightsCategoriesPage() {
  const { token } = useOutletContext()
  const [period, setPeriod] = useState(3)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await getCategoryBreakdown(token, period))
    } catch {
      setError('Could not load category breakdown')
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
        <p>Accont Holder spending, broken down by category.</p>
        <PeriodSelect value={period} onChange={setPeriod} />
      </div>

      {loading ? (
        <SkeletonList rows={5} />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <section className="page-section">
          <InsightNote insight={data?.insight} source={data?.insight_source} />
          {!data || data.categories.length === 0 ? (
            <EmptyState title="No spending in this period" />
          ) : (
            <PieChart categories={data.categories} currency="GBP" total={data.total_expense} />
          )}
        </section>
      )}
    </div>
  )
}

export default InsightsCategoriesPage
