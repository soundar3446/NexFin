import { useEffect, useState } from 'react'
import { getBalances, getTransactions, listAccounts } from '../api'

function formatAmount(amount, currency) {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(Number(amount))
}

function Dashboard({ token, onLogout }) {
  const [accounts, setAccounts] = useState([])
  const [balancesByAccount, setBalancesByAccount] = useState({})
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const accountsRes = await listAccounts(token, { type: 'domestic' })
        const accountList = accountsRes.Data.Account
        if (cancelled) return
        setAccounts(accountList)

        const balanceEntries = await Promise.all(
          accountList.map(async (account) => {
            const balanceRes = await getBalances(token, account.AccountId)
            return [account.AccountId, balanceRes.Data.Balance[0]]
          }),
        )
        if (cancelled) return
        setBalancesByAccount(Object.fromEntries(balanceEntries))

        const transactionLists = await Promise.all(
          accountList.map((account) =>
            getTransactions(token, account.AccountId, { pageIndex: 0, pageSize: 10 }).then((res) =>
              res.Data.Transaction.map((txn) => ({ ...txn, _accountNickname: account.Nickname })),
            ),
          ),
        )
        if (cancelled) return
        const merged = transactionLists
          .flat()
          .sort((a, b) => new Date(b.BookingDateTime) - new Date(a.BookingDateTime))
          .slice(0, 20)
        setTransactions(merged)
      } catch {
        if (!cancelled) setError('Could not load account data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [token])

  if (loading) return <p className="status-text">Loading your accounts...</p>
  if (error) return <p className="status-text form-error">{error}</p>

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>NexFin</h1>
        <button onClick={onLogout}>Log out</button>
      </header>

      <section className="accounts-grid">
        {accounts.map((account) => {
          const balance = balancesByAccount[account.AccountId]
          return (
            <div className="account-card" key={account.AccountId}>
              <h3>{account.Nickname || account.Description}</h3>
              <p className="account-type">
                {account.AccountTypeCode} · {account.Currency}
              </p>
              {balance && (
                <p className="account-balance">
                  {formatAmount(balance.Amount.Amount, balance.Amount.Currency)}
                </p>
              )}
            </div>
          )
        })}
      </section>

      <section className="transactions-feed">
        <h2>Recent transactions</h2>
        <ul>
          {transactions.map((txn) => (
            <li key={txn.TransactionId} className="transaction-row">
              <span className="transaction-info">{txn.TransactionInformation}</span>
              <span className="transaction-account">{txn._accountNickname}</span>
              <span
                className={`transaction-amount ${
                  txn.CreditDebitIndicator === 'Debit' ? 'debit' : 'credit'
                }`}
              >
                {txn.CreditDebitIndicator === 'Debit' ? '-' : '+'}
                {formatAmount(txn.Amount.Amount, txn.Amount.Currency)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

export default Dashboard
