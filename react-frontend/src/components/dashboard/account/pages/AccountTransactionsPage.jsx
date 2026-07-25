import { useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { categorizeTransaction } from '../../../../utils/categories'
import { EmptyState } from '../../shared/States'
import TransactionFilters from '../../shared/TransactionFilters'
import TransactionRow from '../../shared/TransactionRow'

const DEFAULT_FILTERS = {
  search: '',
  category: 'all',
  direction: 'all',
  from: '',
  to: '',
}

const PAGE_SIZE = 20

function AccountTransactionsPage() {
  const { transactions } = useOutletContext()
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const categoryOptions = useMemo(() => {
    const labels = new Set(transactions.map((t) => categorizeTransaction(t).label))
    return [...labels].sort()
  }, [transactions])

  const filtered = useMemo(() => {
    return transactions.filter((txn) => {
      if (filters.direction !== 'all' && txn.CreditDebitIndicator !== filters.direction) return false
      if (filters.category !== 'all' && categorizeTransaction(txn).label !== filters.category) return false
      if (filters.from && new Date(txn.BookingDateTime) < new Date(filters.from)) return false
      if (filters.to && new Date(txn.BookingDateTime) > new Date(`${filters.to}T23:59:59`)) return false
      if (filters.search) {
        const haystack = `${txn.TransactionInformation || ''} ${txn.MerchantDetails?.MerchantName || ''}`.toLowerCase()
        if (!haystack.includes(filters.search.toLowerCase())) return false
      }
      return true
    })
  }, [transactions, filters])

  const visible = filtered.slice(0, visibleCount)

  return (
    <div className="page">
      <p className="page-header">
        {filtered.length} of {transactions.length} transactions for this account.
      </p>

      <TransactionFilters
        filters={filters}
        onChange={(next) => {
          setFilters(next)
          setVisibleCount(PAGE_SIZE)
        }}
        categoryOptions={categoryOptions}
      />

      <section className="page-section">
        {filtered.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="No matching transactions"
            body="Try widening your filters or clearing the search."
          />
        ) : (
          <>
            <ul className="transactions-feed-list">
              {visible.map((txn) => (
                <TransactionRow key={txn.TransactionId} txn={txn} showAccount={false} />
              ))}
            </ul>
            {visibleCount < filtered.length && (
              <button
                type="button"
                className="load-more-btn"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              >
                Show more ({filtered.length - visibleCount} remaining)
              </button>
            )}
          </>
        )}
      </section>
    </div>
  )
}

export default AccountTransactionsPage
