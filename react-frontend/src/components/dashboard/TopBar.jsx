import { useEffect, useRef, useState } from 'react'
import { useLocation, useParams } from 'react-router-dom'
import { useDashboardData } from '../../context/DashboardDataContext'
import { useTheme } from '../../context/ThemeContext'

const ROUTE_TITLES = {
  '/': 'Overview',
  '/accounts': 'Accounts',
  '/transactions': 'Transactions',
  '/insights': 'Insights',
  '/insights/categories': 'Insights · Categories',
  '/insights/trends': 'Insights · Trends',
  '/insights/unusual': 'Insights · Unusual spending',
}

const ACCOUNT_SUB_TITLES = {
  '': 'Overview',
  transactions: 'Transactions',
  insights: 'Insights',
  details: 'Details',
}

function usePageTitle() {
  const location = useLocation()
  const { accountId } = useParams()
  const { getAccount } = useDashboardData()

  if (ROUTE_TITLES[location.pathname]) return ROUTE_TITLES[location.pathname]
  if (accountId) {
    const account = getAccount(accountId)
    const name = account?.Nickname || 'Account'
    const subPath = location.pathname.split(`/accounts/${accountId}`)[1]?.replace(/^\//, '') || ''
    const subTitle = ACCOUNT_SUB_TITLES[subPath]
    return subTitle ? `${name} · ${subTitle}` : name
  }
  return 'NexFin'
}

function initialsFor(username) {
  if (!username) return '?'
  const local = username.split('@')[0]
  const parts = local.split(/[.\s_+-]/).filter(Boolean)
  if (parts.length === 0) return local[0]?.toUpperCase() || '?'
  return parts
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}

function ProfileMenu({ username, onLogout }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="profile-menu" ref={ref}>
      <button
        type="button"
        className="profile-avatar-btn"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {initialsFor(username)}
      </button>
      {open && (
        <div className="profile-dropdown">
          <p className="profile-dropdown-email" title={username}>
            {username}
          </p>
          <button
            type="button"
            className="profile-dropdown-logout"
            onClick={() => {
              setOpen(false)
              onLogout()
            }}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  )
}

function TopBar({ username, onLogout }) {
  const title = usePageTitle()

  useEffect(() => {
    document.title = title === 'NexFin' ? 'NexFin' : `${title} · NexFin`
  }, [title])

  return (
    <header className="top-bar">
      <h1 className="top-bar-title">{title}</h1>
      <div className="top-bar-actions">
        <ThemeToggle />
        <ProfileMenu username={username} onLogout={onLogout} />
      </div>
    </header>
  )
}

export default TopBar
