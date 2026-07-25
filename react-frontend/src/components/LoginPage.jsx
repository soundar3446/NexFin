import { useState } from 'react'
import { login } from '../api'
import TermsModal from './TermsModal'

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1.4-3.6 4.4-5.5 7.5-5.5s6.1 1.9 7.5 5.5" strokeLinecap="round" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="5" y="10.5" width="14" height="9" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" strokeLinecap="round" />
    </svg>
  )
}

function EyeIcon({ off }) {
  return off ? (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 3l18 18" strokeLinecap="round" />
      <path
        d="M10.6 5.2A10.6 10.6 0 0 1 12 5c5 0 9 4 10 7-.4 1.2-1.2 2.5-2.3 3.7M6.5 6.6C4.4 8 2.9 10 2 12c1 3 5 7 10 7 1.4 0 2.7-.3 3.9-.8"
        strokeLinecap="round"
      />
      <path d="M9.9 10a2.5 2.5 0 0 0 3.6 3.5" strokeLinecap="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M2 12c1-3 5-7 10-7s9 4 10 7c-1 3-5 7-10 7s-9-4-10-7Z" />
      <circle cx="12" cy="12" r="2.75" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3Z" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

const BRAND_POINTS = [
  { title: 'Unified financial visibility', body: 'All your accounts, balances, and transactions in one view.' },
  { title: 'Intelligent spending insights', body: 'Category trends, anomalies, and monthly summaries.' },
  { title: 'Conversational assistance', body: 'Ask questions about your money in plain language.' },
]

function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!agreed) {
      setError('Please accept the Terms & Conditions and Privacy Notice to continue.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const tokenResponse = await login(username, password)
      onLogin(tokenResponse.access_token)
    } catch {
      setError('Invalid username or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-shell">
        <aside className="login-brand">
          <div className="login-brand-mark">
            <span className="login-logo">N</span>
            <span className="login-logo-name">NexFin</span>
          </div>
          <h1>Your finances, understood.</h1>
          <p className="login-brand-subtitle">
            One secure dashboard for every account, powered by AI-driven insight.
          </p>
          <ul className="login-brand-points">
            {BRAND_POINTS.map((point) => (
              <li key={point.title}>
                <span className="login-brand-check">&#10003;</span>
                <div>
                  <strong>{point.title}</strong>
                  <span>{point.body}</span>
                </div>
              </li>
            ))}
          </ul>
          <div className="login-brand-footer">
            <ShieldIcon />
            <span>Encrypted in transit and at rest. Your data is never sold or shared.</span>
          </div>
        </aside>

        <div className="login-panel">
          <form className="login-card" onSubmit={handleSubmit} noValidate>
            <div className="login-card-header">
              <h2>Welcome back</h2>
              <p>Sign in to view your accounts and insights.</p>
            </div>

            <label className="input-field">
              <span>Username</span>
              <div className="input-wrapper">
                <span className="input-icon">
                  <UserIcon />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="username"
                  required
                  autoFocus
                />
              </div>
            </label>

            <label className="input-field">
              <span>Password</span>
              <div className="input-wrapper">
                <span className="input-icon">
                  <LockIcon />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="input-adornment-btn"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  <EyeIcon off={showPassword} />
                </button>
              </div>
            </label>

            <label className="consent-row">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => {
                  setAgreed(e.target.checked)
                  if (e.target.checked) setError(null)
                }}
              />
              <span>
                I agree to the{' '}
                <button type="button" className="link-btn" onClick={() => setShowTerms(true)}>
                  Terms &amp; Conditions and Privacy Notice
                </button>
                , and consent to NexFin retrieving and storing my account data for financial
                analysis.
              </span>
            </label>

            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="submit-btn" disabled={loading || !agreed}>
              {loading ? <span className="spinner" aria-hidden="true" /> : null}
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            <p className="login-security-note">
              <ShieldIcon />
              <span>Bank-grade encryption &middot; Your credentials are never stored by NexFin</span>
            </p>
          </form>
        </div>
      </div>

      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
    </div>
  )
}

export default LoginPage
