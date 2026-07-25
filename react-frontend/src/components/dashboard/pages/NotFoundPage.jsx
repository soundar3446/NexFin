import { Link } from 'react-router-dom'
import { EmptyState } from '../shared/States'

function NotFoundPage() {
  return (
    <div className="page">
      <EmptyState icon="🧭" title="Page not found" body="That page doesn't exist or may have moved." />
      <Link to="/" className="link-btn" style={{ alignSelf: 'center' }}>
        &larr; Back to Overview
      </Link>
    </div>
  )
}

export default NotFoundPage
