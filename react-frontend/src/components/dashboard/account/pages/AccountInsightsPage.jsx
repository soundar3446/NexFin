import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { categorizeTransaction } from '../../../../utils/categories'
import { formatAmount, monthLabel } from '../../../../utils/format'
import CategoryBarChart from '../../shared/charts/CategoryBarChart'
import IncomeExpenseChart from '../../shared/charts/IncomeExpenseChart'
import MonthNavigator from '../../shared/MonthNavigator'
import { EmptyState } from '../../shared/States'
import StatCard from '../../shared/StatCard'

function buildMonthlySummaries(transactions) {
  const months = new Map()

  for (const txn of transactions) {
    const key = txn.BookingDateTime.slice(0, 7)
    if (!months.has(key)) {
      months.set(key, {
        month: key,
        total_spend: 0,
        total_income: 0,
        transaction_count: 0,
        byCategory: new Map(),
        byMerchant: new Map(),
      })
    }
    const bucket = months.get(key)
    bucket.transaction_count += 1
    const amount = Number(txn.Amount.Amount)

    if (txn.CreditDebitIndicator === 'Debit') {
      bucket.total_spend += amount
      const category = categorizeTransaction(txn).label
      bucket.byCategory.set(category, (bucket.byCategory.get(category) || 0) + amount)
      const merchant = txn.MerchantDetails?.MerchantName || 'Unknown'
      bucket.byMerchant.set(merchant, (bucket.byMerchant.get(merchant) || 0) + amount)
    } else {
      bucket.total_income += amount
    }
  }

  return [...months.values()]
    .sort((a, b) => (a.month < b.month ? 1 : -1))
    .map((bucket) => ({
      month: bucket.month,
      total_spend: Math.round(bucket.total_spend * 100) / 100,
      total_income: Math.round(bucket.total_income * 100) / 100,
      transaction_count: bucket.transaction_count,
      by_category: [...bucket.byCategory.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([label, total]) => ({ label, total: Math.round(total * 100) / 100 })),
      by_merchant: [...bucket.byMerchant.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([merchant_name, total]) => ({ merchant_name, total: Math.round(total * 100) / 100 })),
    }))
}

function AccountInsightsPage() {
  const { account, transactions } = useOutletContext()
  const currency = account.Currency
  const months = useMemo(() => buildMonthlySummaries(transactions), [transactions])
  const [selectedMonth, setSelectedMonth] = useState(null)

  if (months.length === 0) {
    return (
      <div className="page">
        <EmptyState
          icon="📊"
          title="Not enough activity yet"
          body="Insights build up once transactions come through on this account."
        />
      </div>
    )
  }

  const current = months.find((m) => m.month === selectedMonth) || months[0]
  const chronological = [...months].reverse().map((m) => ({ ...m, label: monthLabel(m.month) }))

  return (
    <div className="page">
      <MonthNavigator
        months={months.map((m) => m.month)}
        selected={current.month}
        onChange={setSelectedMonth}
      />

      <section className="stat-row">
        <StatCard label="Spent" value={formatAmount(current.total_spend, currency)} tone="negative" />
        <StatCard label="Income" value={formatAmount(current.total_income, currency)} tone="positive" />
        <StatCard
          label="Net"
          value={formatAmount(current.total_income - current.total_spend, currency)}
          tone={current.total_income - current.total_spend >= 0 ? 'positive' : 'negative'}
        />
        <StatCard label="Transactions" value={current.transaction_count} tone="neutral" />
      </section>

      <section className="page-section">
        <div className="section-header">
          <h2>Spend by category — {monthLabel(current.month)}</h2>
        </div>
        {current.by_category.length === 0 ? (
          <EmptyState title="No spending this month" />
        ) : (
          <CategoryBarChart data={current.by_category} currency={currency} />
        )}
      </section>

      <section className="page-section">
        <div className="section-header">
          <h2>Top merchants — {monthLabel(current.month)}</h2>
        </div>
        {current.by_merchant.length === 0 ? (
          <EmptyState title="No merchant spending this month" />
        ) : (
          <ol className="merchant-list">
            {current.by_merchant.map((m, i) => (
              <li key={m.merchant_name}>
                <span className="merchant-rank">{i + 1}</span>
                <span className="merchant-name">{m.merchant_name}</span>
                <span className="merchant-total">{formatAmount(m.total, currency)}</span>
              </li>
            ))}
          </ol>
        )}
      </section>

      {chronological.length > 1 && (
        <section className="page-section">
          <div className="section-header">
            <h2>Income vs. spend by month</h2>
          </div>
          <IncomeExpenseChart months={chronological} currency={currency} />
        </section>
      )}
    </div>
  )
}

export default AccountInsightsPage
