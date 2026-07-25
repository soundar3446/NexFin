import { Outlet } from 'react-router-dom'
import { decodeJwt } from '../../utils/jwt'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

function DashboardLayout({ token, onLogout }) {
  const { preferred_username: username } = decodeJwt(token)

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <TopBar username={username} onLogout={onLogout} />
        <main className="app-content">
          <Outlet context={{ token }} />
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
