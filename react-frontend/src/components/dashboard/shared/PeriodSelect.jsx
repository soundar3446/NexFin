function PeriodSelect({ value, onChange }) {
  return (
    <select
      className="month-navigator-select"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      aria-label="Insights period"
    >
      <option value={3}>Last 3 months</option>
      <option value={6}>Last 6 months</option>
      <option value={12}>Last 12 months</option>
    </select>
  )
}

export default PeriodSelect
