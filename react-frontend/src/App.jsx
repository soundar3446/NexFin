import { useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import './App.css'
import AccountLayout from './components/dashboard/account/AccountLayout'
import AccountDetailsPage from './components/dashboard/account/pages/AccountDetailsPage'
import AccountInsightsPage from './components/dashboard/account/pages/AccountInsightsPage'
import AccountOverviewPage from './components/dashboard/account/pages/AccountOverviewPage'
import AccountTransactionsPage from './components/dashboard/account/pages/AccountTransactionsPage'
import DashboardLayout from './components/dashboard/DashboardLayout'
import InsightsLayout from './components/dashboard/insights/InsightsLayout'
import InsightsCategoriesPage from './components/dashboard/insights/pages/InsightsCategoriesPage'
import InsightsOverviewPage from './components/dashboard/insights/pages/InsightsOverviewPage'
import InsightsTrendsPage from './components/dashboard/insights/pages/InsightsTrendsPage'
import InsightsUnusualPage from './components/dashboard/insights/pages/InsightsUnusualPage'
import AccountsPage from './components/dashboard/pages/AccountsPage'
import NotFoundPage from './components/dashboard/pages/NotFoundPage'
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
          <Route path="insights" element={<InsightsLayout />}>
            <Route index element={<InsightsOverviewPage />} />
            <Route path="categories" element={<InsightsCategoriesPage />} />
            <Route path="trends" element={<InsightsTrendsPage />} />
            <Route path="unusual" element={<InsightsUnusualPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </DashboardDataProvider>
  )
}

export default App
