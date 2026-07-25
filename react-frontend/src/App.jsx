import { useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import './App.css'
import AccountLayout from './components/dashboard/account/AccountLayout'
import AccountDetailsPage from './components/dashboard/account/pages/AccountDetailsPage'
import AccountInsightsPage from './components/dashboard/account/pages/AccountInsightsPage'
import AccountOverviewPage from './components/dashboard/account/pages/AccountOverviewPage'
import AccountTransactionsPage from './components/dashboard/account/pages/AccountTransactionsPage'
import DashboardLayout from './components/dashboard/DashboardLayout'
import AccountsPage from './components/dashboard/pages/AccountsPage'
import InsightsPage from './components/dashboard/pages/InsightsPage'
import OverviewPage from './components/dashboard/pages/OverviewPage'
import TransactionsPage from './components/dashboard/pages/TransactionsPage'
import LoginPage from './components/LoginPage'
import { DashboardDataProvider } from './context/DashboardDataContext'

const TOKEN_KEY = 'nexfin_access_token'

function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))

  function handleLogin(accessToken) {
    localStorage.setItem(TOKEN_KEY, accessToken)
    setToken(accessToken)
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
  }

  if (!token) {
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <DashboardDataProvider token={token}>
      <Routes>
        <Route path="/" element={<DashboardLayout token={token} onLogout={handleLogout} />}>
          <Route index element={<OverviewPage />} />
          <Route path="accounts" element={<AccountsPage />} />
          <Route path="accounts/:accountId" element={<AccountLayout />}>
            <Route index element={<AccountOverviewPage />} />
            <Route path="transactions" element={<AccountTransactionsPage />} />
            <Route path="insights" element={<AccountInsightsPage />} />
            <Route path="details" element={<AccountDetailsPage />} />
          </Route>
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="insights" element={<InsightsPage />} />
        </Route>
      </Routes>
    </DashboardDataProvider>
  )
}

export default App
