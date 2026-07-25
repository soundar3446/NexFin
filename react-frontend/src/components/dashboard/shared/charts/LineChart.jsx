import { useRef, useState } from 'react'
import { formatAmount, monthLabel } from '../../../../utils/format'

const WIDTH = 640
const HEIGHT = 240
const PAD_LEFT = 8
const PAD_RIGHT = 8
const PAD_TOP = 16
const PAD_BOTTOM = 28
const GRID_STEPS = 4

function scalePoints(values, max, count) {
  const usableWidth = WIDTH - PAD_LEFT - PAD_RIGHT
  const usableHeight = HEIGHT - PAD_TOP - PAD_BOTTOM
  return values.map((v, i) => {
    const x = count === 1 ? WIDTH / 2 : PAD_LEFT + (i / (count - 1)) * usableWidth
    const y = PAD_TOP + usableHeight - (max > 0 ? (v / max) * usableHeight : 0)
    return [x, y]
  })
}

// Trend-over-time gets a line, not grouped bars, specifically so it scales to
// any number of months without needing horizontal scroll -- the SVG viewBox
// resizes to the container, points just get closer together.
function LineChart({ months, currency }) {
  const [hoverIndex, setHoverIndex] = useState(null)
  const svgRef = useRef(null)
  const count = months.length

  const max = Math.max(...months.flatMap((m) => [m.income, m.expense]), 1) * 1.15
  const incomePoints = scalePoints(
    months.map((m) => m.income),
    max,
    count,
  )
  const expensePoints = scalePoints(
    months.map((m) => m.expense),
    max,
    count,
  )

  function handleMove(e) {
    if (!svgRef.current || count === 0) return
    const rect = svgRef.current.getBoundingClientRect()
    const fraction = (e.clientX - rect.left) / rect.width
    const index = Math.round(fraction * (count - 1))
    setHoverIndex(Math.min(Math.max(index, 0), count - 1))
  }

  const hovered = hoverIndex !== null ? months[hoverIndex] : null
  const hoverX = hoverIndex !== null ? incomePoints[hoverIndex][0] : null
  const hoverPct = hoverIndex !== null && count > 1 ? (hoverIndex / (count - 1)) * 100 : 50

  const gridLines = Array.from({ length: GRID_STEPS + 1 }, (_, i) => {
    const usableHeight = HEIGHT - PAD_TOP - PAD_BOTTOM
    return PAD_TOP + (usableHeight / GRID_STEPS) * i
  })

  return (
    <div className="line-chart">
      <div className="trend-chart-legend">
        <span className="legend-item">
          <span className="legend-line-swatch series-1" /> Income
        </span>
        <span className="legend-item">
          <span className="legend-line-swatch series-2" /> Spend
        </span>
      </div>

      <div className="line-chart-wrap">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="none"
          className="line-chart-svg"
          role="img"
          aria-label="Income versus spend by month"
          onMouseMove={handleMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          {gridLines.map((y) => (
            <line key={y} x1={PAD_LEFT} x2={WIDTH - PAD_RIGHT} y1={y} y2={y} className="line-chart-grid" />
          ))}

          {hoverX !== null && (
            <line x1={hoverX} x2={hoverX} y1={PAD_TOP} y2={HEIGHT - PAD_BOTTOM} className="line-chart-crosshair" />
          )}

          <polyline
            points={incomePoints.map((p) => p.join(',')).join(' ')}
            fill="none"
            stroke="var(--viz-series-1)"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <polyline
            points={expensePoints.map((p) => p.join(',')).join(' ')}
            fill="none"
            stroke="var(--viz-series-2)"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {incomePoints.map(([x, y], i) => (
            <circle
              key={`i-${i}`}
              cx={x}
              cy={y}
              r={hoverIndex === i ? 5 : 3}
              fill="var(--viz-series-1)"
              stroke="var(--surface-1)"
              strokeWidth="2"
            />
          ))}
          {expensePoints.map(([x, y], i) => (
            <circle
              key={`e-${i}`}
              cx={x}
              cy={y}
              r={hoverIndex === i ? 5 : 3}
              fill="var(--viz-series-2)"
              stroke="var(--surface-1)"
              strokeWidth="2"
            />
          ))}
        </svg>

        {hovered && (
          <div className="line-chart-tooltip" style={{ left: `${hoverPct}%` }}>
            <strong>{monthLabel(hovered.month)}</strong>
            <span>
              <i className="legend-line-swatch series-1" />
              {formatAmount(hovered.income, currency)}
            </span>
            <span>
              <i className="legend-line-swatch series-2" />
              {formatAmount(hovered.expense, currency)}
            </span>
          </div>
        )}
      </div>

      <div className="line-chart-x-labels">
        {months.map((m, i) => (
          <span key={m.month} className={i === 0 || i === count - 1 || i === hoverIndex ? 'visible' : ''}>
            {monthLabel(m.month)}
          </span>
        ))}
      </div>
    </div>
  )
}

export default LineChart
