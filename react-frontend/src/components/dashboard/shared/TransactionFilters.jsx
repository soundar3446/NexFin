function TransactionFilters({
  filters,
  onChange,
  accounts,
  showAccountFilter = false,
  categoryOptions = [],
}) {
  function update(patch) {
    onChange({ ...filters, ...patch })
  }

  return (
    <div className="filters-bar">
      <input
        type="search"
        placeholder="Search transactions..."
        value={filters.search}
        onChange={(e) => update({ search: e.target.value })}
        className="filters-search"
      />

      {showAccountFilter && (
        <select value={filters.accountId} onChange={(e) => update({ accountId: e.target.value })}>
          <option value="all">All accounts</option>
          {accounts.map((account) => (
            <option key={account.AccountId} value={account.AccountId}>
              {account.Nickname} ({account.InternationalAccount ? 'Intl' : 'Domestic'})
            </option>
          ))}
        </select>
      )}

      <select value={filters.category} onChange={(e) => update({ category: e.target.value })}>
        <option value="all">All categories</option>
        {categoryOptions.map((label) => (
          <option key={label} value={label}>
            {label}
          </option>
        ))}
      </select>

      <select value={filters.direction} onChange={(e) => update({ direction: e.target.value })}>
        <option value="all">Credit &amp; Debit</option>
        <option value="Debit">Money out</option>
        <option value="Credit">Money in</option>
      </select>

      <label className="filters-date">
        From
        <input type="date" value={filters.from} onChange={(e) => update({ from: e.target.value })} />
      </label>
      <label className="filters-date">
        To
        <input type="date" value={filters.to} onChange={(e) => update({ to: e.target.value })} />
      </label>
    </div>
  )
}

export default TransactionFilters
