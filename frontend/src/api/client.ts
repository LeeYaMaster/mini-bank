const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    ...options,
  })
  const text = await res.text()
  let body: unknown = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = text
  }
  if (!res.ok) {
    const msg =
      typeof body === 'object' && body && 'message' in body
        ? Array.isArray((body as { message: unknown }).message)
          ? ((body as { message: string[] }).message).join('；')
          : String((body as { message: string }).message)
        : res.statusText
    throw new Error(msg || `请求失败 ${res.status}`)
  }
  return body as T
}

export const api = {
  health: () => request<{ status: string }>('/health'),
  riskRules: () => request<{ rules: Record<string, number> }>('/risk-rules'),
  resetDemo: () => request<{ message: string }>('/demo/reset', { method: 'POST' }),

  listCustomers: () => request<import('./types').Customer[]>('/customers'),
  createCustomer: (data: { name: string; idNumber: string; phone: string }) =>
    request<import('./types').Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listAccounts: (customerId?: string) =>
    request<import('./types').Account[]>(
      customerId ? `/accounts?customerId=${customerId}` : '/accounts',
    ),
  openAccount: (data: {
    customerId: string
    type: 'CHECKING' | 'FIXED'
    initialDeposit: number
    termMonths?: number
  }) =>
    request<import('./types').Account>('/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listTransactions: (accountId?: string) =>
    request<import('./types').Transaction[]>(
      accountId ? `/transactions?accountId=${accountId}` : '/transactions',
    ),
  deposit: (data: { accountId: string; amount: number; remark?: string }) =>
    request('/transactions/deposit', { method: 'POST', body: JSON.stringify(data) }),
  withdraw: (data: { accountId: string; amount: number; remark?: string }) =>
    request('/transactions/withdraw', { method: 'POST', body: JSON.stringify(data) }),
  transfer: (data: {
    fromAccountId: string
    toAccountNo: string
    amount: number
    remark?: string
  }) =>
    request('/transactions/transfer', { method: 'POST', body: JSON.stringify(data) }),

  listLoans: (customerId?: string) =>
    request<import('./types').Loan[]>(
      customerId ? `/loans?customerId=${customerId}` : '/loans',
    ),
  applyLoan: (data: {
    customerId: string
    accountId: string
    principal: number
    termMonths: number
  }) =>
    request<import('./types').Loan>('/loans/apply', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  approveLoan: (id: string) =>
    request<import('./types').Loan>(`/loans/${id}/approve`, { method: 'POST' }),
  disburseLoan: (id: string) =>
    request<{ loan: import('./types').Loan }>(`/loans/${id}/disburse`, {
      method: 'POST',
    }),
  repayLoan: (data: { loanId: string; accountId: string; amount: number }) =>
    request('/loans/repay', { method: 'POST', body: JSON.stringify(data) }),
}
