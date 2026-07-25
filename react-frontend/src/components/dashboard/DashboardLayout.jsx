import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { decodeJwt } from '../../utils/jwt'
import ScrollToTop from './ScrollToTop'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

const COLLAPSE_KEY = 'nexfin_sidebar_collapsed'

function DashboardLayout({ token, onLogout }) {
  const { preferred_username: username } = decodeJwt(token)
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) !== 'false')
  const location = useLocation()

  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, String(collapsed))
  }, [collapsed])

  return (
    <div className="app-shell">
      <ScrollToTop />
      <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed((c) => !c)} />
      <div className="app-main">
        <TopBar username={username} onLogout={onLogout} />
        <main className="app-content">
          <div className="page-transition" key={location.pathname}>
            <Outlet context={{ token }} />
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
