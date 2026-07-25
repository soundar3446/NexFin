import { formatAmount } from '../../../../utils/format'

// Two named series (Income / Spend) -> categorical color, fixed slot order
// (blue = slot 1, orange = slot 2), with a legend since there's more than one series.
function IncomeExpenseChart({ months, currency }) {
  if (months.length === 0) return null
  const max = Math.max(...months.flatMap((m) => [m.total_income, m.total_spend]), 1)

  return (
    <div className="trend-chart">
      <div className="trend-chart-legend">
        <span className="legend-item">
          <span className="legend-swatch series-1" /> Income
        </span>
        <span className="legend-item">
          <span className="legend-swatch series-2" /> Spend
        </span>
      </div>
      <div className="trend-chart-plot" role="img" aria-label="Income versus spend by month">
        {months.map((m) => (
          <div className="trend-chart-group" key={m.month}>
            <div className="trend-chart-bars">
              <div className="trend-bar-col">
                <span className="trend-bar-value">{formatAmount(m.total_income, currency)}</span>
                <div
                  className="trend-bar series-1"
                  style={{ height: `${Math.max((m.total_income / max) * 100, 2)}%` }}
                />
              </div>
              <div className="trend-bar-col">
                <span className="trend-bar-value">{formatAmount(m.total_spend, currency)}</span>
                <div
                  className="trend-bar series-2"
                  style={{ height: `${Math.max((m.total_spend / max) * 100, 2)}%` }}
                />
              </div>
            </div>
            <span className="trend-chart-month">{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default IncomeExpenseChart
