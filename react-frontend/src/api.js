const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function request(path, { method = 'GET', token, body, params } = {}) {
  const url = new URL(`${API_URL}${path}`)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) url.searchParams.set(key, value)
    })
  }

  const headers = {}
  if (token) headers.Authorization = `Bearer ${token}`
  if (body) headers['Content-Type'] = 'application/json'

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const error = new Error(`Request failed: ${res.status}`)
    error.status = res.status
    throw error
  }

  return res.json()
}

export function login(username, password) {
  return request('/auth/login', { method: 'POST', body: { username, password } })
}

export function getNoticeStatus(token) {
  return request('/me/notice', { token })
}

export function acknowledgeNotice(token) {
  return request('/me/notice/ack', { method: 'POST', token })
}

export function listAccounts(token, { type } = {}) {
  return request('/accounts', { token, params: { type } })
}

export function getAccount(token, accountId) {
  return request(`/accounts/${accountId}`, { token })
}

export function getBalances(token, accountId) {
  return request(`/accounts/${accountId}/balances`, { token })
}

export function getTransactions(token, accountId, { pageIndex, pageSize } = {}) {
  return request(`/accounts/${accountId}/transactions`, { token, params: { pageIndex, pageSize } })
}

// The core API silently caps pageSize (observed max: 50), so full history needs paging.
export async function getAllTransactions(token, accountId) {
  const pageSize = 50
  let pageIndex = 0
  let all = []

  while (true) {
    const res = await getTransactions(token, accountId, { pageIndex, pageSize })
    const page = res.Data.Transaction || []
    all = all.concat(page)
    const total = res.Data.Pagination?.total ?? all.length
    pageIndex += 1
    if (page.length === 0 || all.length >= total) break
  }

  return all
}

export function syncAccounts(token) {
  return request('/sync/accounts', { method: 'POST', token })
}

export function getMonthlySpending(token) {
  return request('/analysis/monthly-spending', { token })
}
