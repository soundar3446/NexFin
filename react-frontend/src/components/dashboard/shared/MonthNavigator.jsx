import { monthLabel } from '../../../utils/format'
import { ChevronLeftIcon, ChevronRightIcon } from './icons'

// Compact prev/next navigator instead of a growing, horizontally-scrolling tab
// list -- stays usable no matter how many months of history accumulate. The
// label doubles as a native <select> so a user can also jump straight to a
// specific month instead of stepping through one at a time.
function MonthNavigator({ months, selected, onChange }) {
  const index = months.indexOf(selected)
  const canGoOlder = index < months.length - 1
  const canGoNewer = index > 0

  return (
    <div className="month-navigator">
      <button
        type="button"
        className="month-navigator-btn"
        onClick={() => onChange(months[index + 1])}
        disabled={!canGoOlder}
        aria-label="Previous month"
      >
        <ChevronLeftIcon />
      </button>

      <select
        className="month-navigator-select"
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Select month"
      >
        {months.map((m) => (
          <option key={m} value={m}>
            {monthLabel(m)}
          </option>
        ))}
      </select>

      <button
        type="button"
        className="month-navigator-btn"
        onClick={() => onChange(months[index - 1])}
        disabled={!canGoNewer}
        aria-label="Next month"
      >
        <ChevronRightIcon />
      </button>
    </div>
  )
}

export default MonthNavigator
