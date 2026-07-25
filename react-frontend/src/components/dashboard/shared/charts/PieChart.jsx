import { useState } from 'react'
import { formatAmount } from '../../../../utils/format'

const SLOT_VARS = ['--cat-1', '--cat-2', '--cat-3', '--cat-4', '--cat-5', '--cat-6', '--cat-7', '--cat-8']
const MAX_SLICES = 7
const SIZE = 180
const STROKE = 34
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function foldToSlices(categories) {
  if (categories.length <= MAX_SLICES) return categories
  const head = categories.slice(0, MAX_SLICES)
  const tail = categories.slice(MAX_SLICES)
  const otherTotal = tail.reduce((sum, c) => sum + c.total, 0)
  const otherCount = tail.reduce((sum, c) => sum + (c.transaction_count || 0), 0)
  const otherPct = tail.reduce((sum, c) => sum + (c.percentage || 0), 0)
  return [...head, { category: 'Other', total: otherTotal, percentage: otherPct, transaction_count: otherCount }]
}

// Part-to-whole "spend by category" as a donut: the empty hole doubles as the
// hover readout instead of a floating tooltip, and the legend fills the
// remaining width so the section never leaves dead space beside the chart.
function PieChart({ categories, currency, total }) {
  const [hovered, setHovered] = useState(null)
  const slices = foldToSlices(categories)

  let cumulative = 0
  const segments = slices.map((slice, i) => {
    const fraction = total > 0 ? slice.total / total : 0
    const length = fraction * CIRCUMFERENCE
    const offset = cumulative
    cumulative += length
    return { ...slice, length, offset, colorVar: SLOT_VARS[i % SLOT_VARS.length] }
  })

  const active = hovered !== null ? segments[hovered] : null

  return (
    <div className="pie-chart-row">
      <div className="pie-chart-wrap">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          width={SIZE}
          height={SIZE}
          role="img"
          aria-label="Spending by category"
        >
          <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="var(--border-hairline)"
              strokeWidth={STROKE}
            />
            {segments.map((seg, i) => (
              <circle
                key={seg.category}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={`var(${seg.colorVar})`}
                strokeWidth={hovered === i ? STROKE + 6 : STROKE}
                strokeDasharray={`${seg.length} ${CIRCUMFERENCE - seg.length}`}
                strokeDashoffset={-seg.offset}
                tabIndex={0}
                className="pie-chart-segment"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(i)}
                onBlur={() => setHovered(null)}
              >
                <title>
                  {seg.category}: {formatAmount(seg.total, currency)} ({seg.percentage}%)
                </title>
              </circle>
            ))}
          </g>
        </svg>
        <div className="pie-chart-center">
          <span className="pie-chart-center-value">
            {formatAmount(active ? active.total : total, currency)}
          </span>
          <span className="pie-chart-center-label">{active ? active.category : 'Total spend'}</span>
        </div>
      </div>

      <ul className="pie-chart-legend">
        {segments.map((seg, i) => (
          <li
            key={seg.category}
            className={`pie-chart-legend-item${hovered === i ? ' active' : ''}`}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <span className="legend-swatch" style={{ background: `var(${seg.colorVar})` }} />
            <span className="pie-chart-legend-name">{seg.category}</span>
            <span className="pie-chart-legend-pct">{seg.percentage}%</span>
            <span className="pie-chart-legend-total">{formatAmount(seg.total, currency)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default PieChart
