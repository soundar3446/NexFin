import { NavLink } from 'react-router-dom'
import { CardIcon, ChartIcon, HomeIcon, MenuIcon, ReceiptIcon } from './shared/icons'

const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: HomeIcon, end: true },
  { to: '/accounts', label: 'Accounts', icon: CardIcon },
  { to: '/transactions', label: 'Transactions', icon: ReceiptIcon },
  { to: '/insights', label: 'Insights', icon: ChartIcon },
]

function Sidebar({ collapsed, onToggleCollapse }) {
  return (
    <aside className={`app-sidebar${collapsed ? ' collapsed' : ''}`}>
      <button
        type="button"
        className="sidebar-toggle-btn"
        onClick={onToggleCollapse}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <MenuIcon />
      </button>

      <nav className="app-nav">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `app-nav-link${isActive ? ' active' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <span className="app-nav-icon">
                <Icon />
              </span>
              <span className="app-nav-label">{item.label}</span>
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}

export default Sidebar
