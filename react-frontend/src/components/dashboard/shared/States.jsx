export function ErrorState({ message }) {
  return (
    <div className="page-state">
      <p className="form-error">{message}</p>
    </div>
  )
}

export function EmptyState({ icon = '📭', title, body }) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon">{icon}</span>
      <h3>{title}</h3>
      {body && <p>{body}</p>}
    </div>
  )
}
