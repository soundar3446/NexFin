export function formatAmount(amount, currency = 'GBP') {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(Number(amount))
}

/**
 * Exact money display for chat cards: keeps the decimal places from the backend
 * string (no float round-trip). Always shows at least 2 fraction digits.
 */
export function formatMoneyExact(amount, currency = 'GBP') {
  const raw = String(amount ?? '0').trim()
  const negative = raw.startsWith('-')
  const unsigned = negative ? raw.slice(1) : raw
  const [intPart = '0', fracPart = ''] = unsigned.split('.')
  const decimals = fracPart.length > 0 ? fracPart : '00'
  const padded = decimals.length >= 2 ? decimals : decimals.padEnd(2, '0')
  const symbol =
    currency === 'GBP' ? '£' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : `${currency} `
  return `${negative ? '-' : ''}${symbol}${intPart}.${padded}`
}

export function formatDate(isoString) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(isoString))
}

export function formatDateTime(isoString) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoString))
}

export function monthLabel(monthKey) {
  const [year, month] = monthKey.split('-')
  return new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(
    new Date(Number(year), Number(month) - 1, 1),
  )
}
