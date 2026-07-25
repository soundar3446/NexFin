function SkeletonBlock({ className = '', style }) {
  return <div className={`skeleton ${className}`} style={style} />
}

export function SkeletonStatRow({ count = 4 }) {
  return (
    <div className="stat-row">
      {Array.from({ length: count }).map((_, i) => (
        <div className="stat-card" key={i}>
          <SkeletonBlock style={{ width: '60%', height: 12 }} />
          <SkeletonBlock style={{ width: '80%', height: 22, marginTop: 8 }} />
        </div>
      ))}
    </div>
  )
}

export function SkeletonCardGrid({ count = 4 }) {
  return (
    <div className="accounts-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div className="account-card" key={i}>
          <SkeletonBlock style={{ width: 32, height: 32, borderRadius: '50%' }} />
          <SkeletonBlock style={{ width: '70%', height: 16, marginTop: 12 }} />
          <SkeletonBlock style={{ width: '40%', height: 12, marginTop: 8 }} />
          <SkeletonBlock style={{ width: '55%', height: 24, marginTop: 12 }} />
        </div>
      ))}
    </div>
  )
}

export function SkeletonList({ rows = 6 }) {
  return (
    <ul className="transactions-feed-list">
      {Array.from({ length: rows }).map((_, i) => (
        <li className="transaction-row" key={i}>
          <SkeletonBlock style={{ width: 20, height: 20, borderRadius: '50%' }} />
          <div className="transaction-main">
            <SkeletonBlock style={{ width: '55%', height: 13 }} />
            <SkeletonBlock style={{ width: '35%', height: 10, marginTop: 6 }} />
          </div>
          <SkeletonBlock style={{ width: 60, height: 14 }} />
        </li>
      ))}
    </ul>
  )
}

export default SkeletonBlock
