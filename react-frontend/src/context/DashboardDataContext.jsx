import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { getAllTransactions, getBalances, listAccounts } from '../api'

const DashboardDataContext = createContext(null)

export function DashboardDataProvider({ token, children }) {
  const [accounts, setAccounts] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const accountsRes = await listAccounts(token)
      const accountList = accountsRes.Data.Account

      const withBalances = await Promise.all(
        accountList.map(async (account) => {
          try {
            const balanceRes = await getBalances(token, account.AccountId)
            return { ...account, balance: balanceRes.Data.Balance[0] || null }
          } catch {
            return { ...account, balance: null }
          }
        }),
      )
      setAccounts(withBalances)

      const txnLists = await Promise.all(
        accountList.map(async (account) => {
          try {
            const txns = await getAllTransactions(token, account.AccountId)
            return txns.map((txn) => ({ ...txn, _account: account }))
          } catch {
            return []
          }
        }),
      )
      const merged = txnLists
        .flat()
        .sort((a, b) => new Date(b.BookingDateTime) - new Date(a.BookingDateTime))
      setTransactions(merged)
    } catch {
      setError('Could not load account data')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    load()
  }, [load])

  function getAccount(accountId) {
    return accounts.find((a) => a.AccountId === accountId)
  }

  function getAccountTransactions(accountId) {
    return transactions.filter((t) => t._account.AccountId === accountId)
  }

  return (
    <DashboardDataContext.Provider
      value={{ accounts, transactions, loading, error, refresh: load, getAccount, getAccountTransactions }}
    >
      {children}
    </DashboardDataContext.Provider>
  )
}

export function useDashboardData() {
  const ctx = useContext(DashboardDataContext)
  if (!ctx) throw new Error('useDashboardData must be used within DashboardDataProvider')
  return ctx
}
