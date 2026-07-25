import { useEffect, useId, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { sendChat } from '../../api'
import { formatMoneyExact, formatDate } from '../../utils/format'

const SUGGESTIONS = [
  'Show my recent transactions',
  'How much did I spend this month?',
  'Any subscriptions?',
  'What accounts do I have?',
]

function accountIdFromPath(pathname) {
  const match = pathname.match(/^\/accounts\/([^/]+)/)
  return match ? match[1] : null
}

function ChatTransactionCard({ txn }) {
  const isDebit = txn.credit_debit_indicator === 'Debit'
  const title = txn.transaction_information || txn.merchant_name || 'Transaction'

  return (
    <li className="chat-txn-card">
      <div className="chat-txn-main">
        <span className="chat-txn-title">{title}</span>
        <span className="chat-txn-meta">
          {formatDate(txn.booking_datetime)}
          {txn.nickname ? <> · {txn.nickname}</> : null}
          {txn.category ? <> · {txn.category}</> : null}
          {txn.status === 'PDNG' ? <span className="pending-tag">Pending</span> : null}
        </span>
      </div>
      <span className={`chat-txn-amount ${isDebit ? 'debit' : 'credit'}`}>
        {isDebit ? '−' : '+'}
        {formatMoneyExact(txn.amount, txn.currency)}
      </span>
    </li>
  )
}

function ChatAccountCard({ account }) {
  return (
    <li className="chat-txn-card">
      <div className="chat-txn-main">
        <span className="chat-txn-title">{account.nickname || 'Account'}</span>
        <span className="chat-txn-meta">
          {[account.account_type, account.account_category, account.status].filter(Boolean).join(' · ')}
        </span>
      </div>
      <span className="chat-txn-amount">{account.currency}</span>
    </li>
  )
}

function ChatSpendSummaryCard({ summary }) {
  if (!summary) return null
  const currency = summary.currency || 'GBP'

  return (
    <div className="chat-summary-card">
      <div className="chat-summary-totals">
        <div>
          <span className="chat-summary-label">Spent</span>
          <strong className="chat-txn-amount debit">{formatMoneyExact(summary.total_spend, currency)}</strong>
        </div>
        <div>
          <span className="chat-summary-label">Income</span>
          <strong className="chat-txn-amount credit">{formatMoneyExact(summary.total_income, currency)}</strong>
        </div>
        <div>
          <span className="chat-summary-label">Period</span>
          <strong>{summary.period}</strong>
        </div>
      </div>
      {summary.by_category?.length > 0 ? (
        <ul className="chat-summary-rows" aria-label="Top categories">
          {summary.by_category.slice(0, 5).map((row) => (
            <li key={row.category}>
              <span>{row.category}</span>
              <span>{formatMoneyExact(row.total, currency)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function ChatSubscriptionCard({ item }) {
  return (
    <li className="chat-txn-card">
      <div className="chat-txn-main">
        <span className="chat-txn-title">{item.label}</span>
        <span className="chat-txn-meta">
          {item.occurrences}× · last {formatDate(item.last_seen)}
          {item.nicknames?.length ? <> · {item.nicknames.join(', ')}</> : null}
        </span>
      </div>
      <span className="chat-txn-amount debit">
        ~{formatMoneyExact(item.avg_amount, item.currency)}
      </span>
    </li>
  )
}

function AssistantMessage({ message }) {
  const { dataType, data } = message

  return (
    <div className="chat-bubble chat-bubble-assistant">
      <p className="chat-bubble-text">{message.text}</p>

      {dataType === 'transactions' && Array.isArray(data) && data.length > 0 ? (
        <ul className="chat-txn-list" aria-label="Transactions">
          {data.map((txn) => (
            <ChatTransactionCard key={txn.transaction_id} txn={txn} />
          ))}
        </ul>
      ) : null}

      {dataType === 'accounts' && Array.isArray(data) && data.length > 0 ? (
        <ul className="chat-txn-list" aria-label="Accounts">
          {data.map((account) => (
            <ChatAccountCard key={account.account_id} account={account} />
          ))}
        </ul>
      ) : null}

      {dataType === 'spend_summary' && data ? <ChatSpendSummaryCard summary={data} /> : null}

      {dataType === 'subscriptions' && Array.isArray(data) && data.length > 0 ? (
        <ul className="chat-txn-list" aria-label="Subscriptions">
          {data.map((item) => (
            <ChatSubscriptionCard key={`${item.label}-${item.avg_amount}`} item={item} />
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="chat-bubble chat-bubble-assistant chat-typing" aria-label="Assistant is typing">
      <span />
      <span />
      <span />
    </div>
  )
}

function ChatWidget({ token }) {
  const { pathname } = useLocation()
  const accountId = accountIdFromPath(pathname)

  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [messages, setMessages] = useState([])
  const [error, setError] = useState(null)

  const listRef = useRef(null)
  const inputRef = useRef(null)
  const titleId = useId()

  useEffect(() => {
    if (!open) return undefined
    const frame = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    if (!listRef.current) return
    listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages, sending, open])

  useEffect(() => {
    if (!open) return undefined
    function onKeyDown(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  async function ask(question) {
    const trimmed = question.trim()
    if (!trimmed || sending) return

    setError(null)
    setInput('')
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', text: trimmed }])
    setSending(true)

    try {
      const res = await sendChat(token, trimmed, accountId)
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          text: res.reply || 'I could not generate a reply.',
          dataType: res.data_type || null,
          data: res.data ?? null,
        },
      ])
    } catch {
      setError('Something went wrong. Check that you are synced, then try again.')
    } finally {
      setSending(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    ask(input)
  }

  return (
    <div className={`chat-widget ${open ? 'is-open' : ''}`}>
      {open ? (
        <section className="chat-panel" role="dialog" aria-modal="false" aria-labelledby={titleId}>
          <header className="chat-panel-header">
            <div className="chat-panel-brand">
              <span className="chat-panel-avatar" aria-hidden="true">
                N
              </span>
              <div>
                <h2 id={titleId} className="chat-panel-title">
                  NexFin Assistant
                </h2>
                <p className="chat-panel-subtitle">
                  {accountId
                    ? 'Scoped to this account'
                    : 'Accounts · transactions · spending · subscriptions'}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="chat-panel-close"
              onClick={() => setOpen(false)}
              aria-label="Close chat"
            >
              ×
            </button>
          </header>

          <div className="chat-messages" ref={listRef}>
            {messages.length === 0 ? (
              <div className="chat-empty">
                <p className="chat-empty-lead">Hi — ask about your synced money activity.</p>
                <p className="chat-empty-hint">Try one of these:</p>
                <div className="chat-suggestions">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      className="chat-suggestion"
                      onClick={() => ask(suggestion)}
                      disabled={sending}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) =>
                message.role === 'user' ? (
                  <div key={message.id} className="chat-bubble chat-bubble-user">
                    <p className="chat-bubble-text">{message.text}</p>
                  </div>
                ) : (
                  <AssistantMessage key={message.id} message={message} />
                ),
              )
            )}
            {sending ? <TypingIndicator /> : null}
            {error ? <p className="chat-error">{error}</p> : null}
          </div>

          <form className="chat-composer" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              className="chat-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about spending, accounts, subscriptions…"
              disabled={sending}
              autoComplete="off"
              aria-label="Chat message"
            />
            <button
              type="submit"
              className="chat-send"
              disabled={sending || !input.trim()}
              aria-label="Send message"
            >
              ↑
            </button>
          </form>
        </section>
      ) : null}

      <button
        type="button"
        className="chat-fab"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? 'Close chat' : 'Open chat assistant'}
        aria-expanded={open}
      >
        {open ? '×' : '💬'}
      </button>
    </div>
  )
}

export default ChatWidget
