import { useEffect, useState } from 'react'
import './App.css'
import { acknowledgeNotice, getNoticeStatus } from './api'
import Dashboard from './components/Dashboard'
import LoginPage from './components/LoginPage'
import NoticeModal from './components/NoticeModal'

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

  return <Dashboard token={token} onLogout={handleLogout} />
}

export default App
