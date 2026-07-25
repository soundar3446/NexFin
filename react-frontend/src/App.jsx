import { useEffect, useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import './App.css'
import { acknowledgeNotice, getNoticeStatus } from './api'
import DashboardLayout from './components/dashboard/DashboardLayout'
import AccountDetailPlaceholder from './components/dashboard/pages/AccountDetailPlaceholder'
import AccountsPage from './components/dashboard/pages/AccountsPage'
import InsightsPage from './components/dashboard/pages/InsightsPage'
import OverviewPage from './components/dashboard/pages/OverviewPage'
import TransactionsPage from './components/dashboard/pages/TransactionsPage'
import LoginPage from './components/LoginPage'
import NoticeModal from './components/NoticeModal'
import { DashboardDataProvider } from './context/DashboardDataContext'

const TOKEN_KEY = 'nexfin_access_token'

function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [acknowledged, setAcknowledged] = useState(null)
  const [ackLoading, setAckLoading] = useState(false)

  useEffect(() => {
    if (!token) {
      setAcknowledged(null)
      return
    }

    let cancelled = false
    getNoticeStatus(token)
      .then((status) => {
        if (!cancelled) setAcknowledged(status.acknowledged)
      })
      .catch(() => {
        if (!cancelled) {
          localStorage.removeItem(TOKEN_KEY)
          setToken(null)
        }
      })
    return () => {
      cancelled = true
    }
  }, [token])

  function handleLogin(accessToken) {
    localStorage.setItem(TOKEN_KEY, accessToken)
    setToken(accessToken)
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
  }

  async function handleAgree() {
    setAckLoading(true)
    try {
      await acknowledgeNotice(token)
      setAcknowledged(true)
    } finally {
      setAckLoading(false)
    }
  }

  if (!token) {
    return <LoginPage onLogin={handleLogin} />
  }

  if (acknowledged === null) {
    return <p className="status-text">Loading...</p>
  }

  if (!acknowledged) {
    return <NoticeModal onAgree={handleAgree} loading={ackLoading} />
  }

  return (
    <DashboardDataProvider token={token}>
      <Routes>
        <Route path="/" element={<DashboardLayout token={token} onLogout={handleLogout} />}>
          <Route index element={<OverviewPage />} />
          <Route path="accounts" element={<AccountsPage />} />
          <Route path="accounts/:accountId" element={<AccountDetailPlaceholder />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="insights" element={<InsightsPage />} />
        </Route>
      </Routes>
    </DashboardDataProvider>
  )
}

export default App
