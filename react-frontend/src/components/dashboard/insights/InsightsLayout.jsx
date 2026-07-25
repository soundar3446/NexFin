import { useCallback, useEffect, useState } from 'react'
import { NavLink, Outlet, useOutletContext } from 'react-router-dom'
import { syncAccounts } from '../../../api'
import { SkeletonList, SkeletonStatRow } from '../shared/Skeletons'
import { ErrorState } from '../shared/States'

const TABS = [
  { to: '', label: 'Overview', end: true },
  { to: 'categories', label: 'Categories' },
  { to: 'trends', label: 'Trends' },
  { to: 'unusual', label: 'Unusual spending' },
]

// Every /insights/* sub-page reads from the local DB, which only has what the
// last sync pulled in -- so the sync happens once here, at the shared layout
// level, rather than once per tab (which would re-sync on every tab switch).
function InsightsLayout() {
  const { token } = useOutletContext()
  const [syncing, setSyncing] = useState(true)
  const [syncError, setSyncError] = useState(null)

  const runSync = useCallback(async () => {
    setSyncing(true)
    setSyncError(null)
    try {
      await syncAccounts(token)
    } catch {
      setSyncError('Could not sync your latest transactions')
    } finally {
      setSyncing(false)
    }
  }, [token])

  useEffect(() => {
    runSync()
  }, [runSync])

  return (
    <div className="page">
      <header className="page-header page-header-row">
        <p>Spending analysis from your synced transaction history.</p>
        <button type="button" className="link-btn refresh-btn" onClick={runSync}>
          ⟳ Refresh
        </button>
      </header>

      <nav className="tab-bar">
        {TABS.map((tab) => (
          <NavLink
            key={tab.label}
            to={`/insights${tab.to ? `/${tab.to}` : ''}`}
            end={tab.end}
            className={({ isActive }) => `tab-link${isActive ? ' active' : ''}`}
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      {syncing ? (
        <>
          <SkeletonStatRow />
          <SkeletonList rows={4} />
        </>
      ) : syncError ? (
        <ErrorState message={syncError} />
      ) : (
        <Outlet context={{ token, resync: runSync }} />
      )}
    </div>
  )
}

export default InsightsLayout
