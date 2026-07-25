import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: '🏠', end: true },
  { to: '/accounts', label: 'Accounts', icon: '💳' },
  { to: '/transactions', label: 'Transactions', icon: '🧾' },
  { to: '/insights', label: 'Insights', icon: '📊' },
]

function Sidebar({ username, onLogout }) {
  return (
    <aside className="app-sidebar">
      <div className="app-sidebar-brand">
        <span className="login-logo">N</span>
        <span className="login-logo-name">NexFin</span>
      </div>

      <nav className="app-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `app-nav-link${isActive ? ' active' : ''}`}
          >
            <span className="app-nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="app-sidebar-footer">
        {username && <p className="app-sidebar-user" title={username}>{username}</p>}
        <button type="button" className="app-logout-btn" onClick={onLogout}>
          Log out
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
