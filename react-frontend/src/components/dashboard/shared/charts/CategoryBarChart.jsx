import { formatAmount } from '../../../../utils/format'

// Sequential single-hue bars: the job here is "compare magnitude" across
// categories, not "tell series apart" - so one hue, more-is-longer.
function CategoryBarChart({ data, currency }) {
  if (data.length === 0) return null
  const max = Math.max(...data.map((d) => d.total))

  return (
    <div className="bar-chart" role="img" aria-label="Spending by category">
      {data.map((item) => (
        <div className="bar-chart-row" key={item.label}>
          <span className="bar-chart-row-label">{item.label}</span>
          <div className="bar-chart-track">
            <div
              className="bar-chart-fill"
              style={{ width: `${Math.max((item.total / max) * 100, 3)}%` }}
            />
          </div>
          <span className="bar-chart-row-value">{formatAmount(item.total, currency)}</span>
        </div>
      ))}
    </div>
  )
}

export default CategoryBarChart
