function StatCard({ label, value, sub, tone = 'neutral' }) {
  return (
    <div className={`stat-card stat-card-${tone}`}>
      <span className="stat-card-label">{label}</span>
      <span className="stat-card-value">{value}</span>
      {sub && <span className="stat-card-sub">{sub}</span>}
    </div>
  )
}

export default StatCard
