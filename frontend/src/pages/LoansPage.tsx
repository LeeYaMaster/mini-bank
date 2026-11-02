import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { api } from '../api/client'
import type { Account, Customer, Loan } from '../api/types'
import { LOAN_STATUS_LABEL } from '../api/types'

export default function LoansPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loans, setLoans] = useState<Loan[]>([])
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  const [customerId, setCustomerId] = useState('')
  const [accountId, setAccountId] = useState('')
  const [principal, setPrincipal] = useState(20000)
  const [termMonths, setTermMonths] = useState(12)

  const [repayLoanId, setRepayLoanId] = useState('')
  const [repayAcc, setRepayAcc] = useState('')
  const [repayAmt, setRepayAmt] = useState(1000)

  const checkingOfCustomer = accounts.filter(
    (a) => a.customerId === customerId && a.type === 'CHECKING' && a.status === 'ACTIVE',
  )

  async function load() {
    const [c, a, l] = await Promise.all([
      api.listCustomers(),
      api.listAccounts(),
      api.listLoans(),
    ])
    setCustomers(c)
    setAccounts(a)
    setLoans(l)
    if (!customerId && c[0]) setCustomerId(c[0].id)
    if (l[0] && !repayLoanId) {
      const active = l.find((x) => x.status === 'REPAYING' || x.status === 'DISBURSED')
      if (active) setRepayLoanId(active.id)
    }
  }

  useEffect(() => {
    load().catch((e) => setError(e.message))
  }, [])

  useEffect(() => {
    const first = accounts.find(
      (a) => a.customerId === customerId && a.type === 'CHECKING',
    )
    if (first) {
      setAccountId(first.id)
      setRepayAcc(first.id)
    }
  }, [customerId, accounts])

  async function onApply(e: FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await api.applyLoan({
        customerId,
        accountId,
        principal: Number(principal),
        termMonths: Number(termMonths),
      })
      setOk('贷款申请已提交（状态 APPLIED）')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '失败')
      setOk('')
    }
  }

  async function approve(id: string) {
    try {
      const loan = await api.approveLoan(id)
      setOk(`审批结果：${LOAN_STATUS_LABEL[loan.status]} — ${loan.approveRemark || ''}`)
      setError('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '失败')
    }
  }

  async function disburse(id: string) {
    try {
      await api.disburseLoan(id)
      setOk('放款成功：本金已入账客户活期，可开始还款')
      setError('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '失败')
    }
  }

  async function onRepay(e: FormEvent) {
    e.preventDefault()
    try {
      await api.repayLoan({
        loanId: repayLoanId,
        accountId: repayAcc,
        amount: Number(repayAmt),
      })
      setOk('还款成功')
      setError('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '失败')
      setOk('')
    }
  }

  return (
    <div className="page">
      <h1>贷款</h1>
      <p className="muted">
        流程：申请 → 审批（简单规则）→ 放款到活期 → 还款。贷款对银行是<strong>资产</strong>；
        放款会使客户存款余额增加（银行负债增加）。超过自动审批额度会被拒绝示意。
      </p>
      {error && <p className="err">{error}</p>}
      {ok && <p className="ok">{ok}</p>}

      <div className="two-col">
        <form className="panel" onSubmit={onApply}>
          <h3>申请贷款</h3>
          <label>
            客户
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            放款到账户
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              {checkingOfCustomer.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.accountNo}（余 {a.balance}）
                </option>
              ))}
            </select>
          </label>
          <label>
            本金（元）
            <input
              type="number"
              min={1000}
              step={100}
              value={principal}
              onChange={(e) => setPrincipal(Number(e.target.value))}
            />
          </label>
          <label>
            期限（月）
            <input
              type="number"
              min={1}
              max={60}
              value={termMonths}
              onChange={(e) => setTermMonths(Number(e.target.value))}
            />
          </label>
          <button className="btn" type="submit">
            提交申请
          </button>
        </form>

        <form className="panel" onSubmit={onRepay}>
          <h3>还款</h3>
          <label>
            贷款
            <select value={repayLoanId} onChange={(e) => setRepayLoanId(e.target.value)}>
              {loans
                .filter((l) => l.status === 'REPAYING' || l.status === 'DISBURSED')
                .map((l) => (
                  <option key={l.id} value={l.id}>
                    剩余 {l.remainingPrincipal} / 本金 {l.principal}
                  </option>
                ))}
            </select>
          </label>
          <label>
            扣款账户
            <select value={repayAcc} onChange={(e) => setRepayAcc(e.target.value)}>
              {accounts
                .filter((a) => a.type === 'CHECKING')
                .map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.accountNo}（余 {a.balance}）
                  </option>
                ))}
            </select>
          </label>
          <label>
            还款金额
            <input
              type="number"
              min={0.01}
              step={0.01}
              value={repayAmt}
              onChange={(e) => setRepayAmt(Number(e.target.value))}
            />
          </label>
          <button className="btn" type="submit">
            还款
          </button>
        </form>
      </div>

      <div className="panel">
        <h3>贷款列表</h3>
        <table>
          <thead>
            <tr>
              <th>客户</th>
              <th>本金</th>
              <th>剩余</th>
              <th>利率</th>
              <th>期限</th>
              <th>状态</th>
              <th>审批意见</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {loans.map((l) => {
              const c = customers.find((x) => x.id === l.customerId)
              return (
                <tr key={l.id}>
                  <td>{c?.name || '—'}</td>
                  <td className="num">{l.principal.toLocaleString()}</td>
                  <td className="num">{l.remainingPrincipal.toLocaleString()}</td>
                  <td>{(l.annualRate * 100).toFixed(2)}%</td>
                  <td>{l.termMonths} 月</td>
                  <td>{LOAN_STATUS_LABEL[l.status]}</td>
                  <td className="small">{l.approveRemark || '—'}</td>
                  <td className="actions">
                    {l.status === 'APPLIED' && (
                      <button type="button" className="btn small" onClick={() => approve(l.id)}>
                        审批
                      </button>
                    )}
                    {l.status === 'APPROVED' && (
                      <button type="button" className="btn small" onClick={() => disburse(l.id)}>
                        放款
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
            {loans.length === 0 && (
              <tr>
                <td colSpan={8}>暂无贷款，先提交一笔申请</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
