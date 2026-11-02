import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { api } from '../api/client'
import type { Account, Customer } from '../api/types'
import { ACCOUNT_TYPE_LABEL } from '../api/types'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  const [name, setName] = useState('')
  const [idNumber, setIdNumber] = useState('')
  const [phone, setPhone] = useState('')

  const [customerId, setCustomerId] = useState('')
  const [accType, setAccType] = useState<'CHECKING' | 'FIXED'>('CHECKING')
  const [initialDeposit, setInitialDeposit] = useState(1000)
  const [termMonths, setTermMonths] = useState(12)

  async function load() {
    const [c, a] = await Promise.all([api.listCustomers(), api.listAccounts()])
    setCustomers(c)
    setAccounts(a)
    if (!customerId && c[0]) setCustomerId(c[0].id)
  }

  useEffect(() => {
    load().catch((e) => setError(e.message))
  }, [])

  async function onCreateCustomer(e: FormEvent) {
    e.preventDefault()
    setError('')
    setOk('')
    try {
      await api.createCustomer({ name, idNumber, phone })
      setOk('客户建档成功')
      setName('')
      setIdNumber('')
      setPhone('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '失败')
    }
  }

  async function onOpenAccount(e: FormEvent) {
    e.preventDefault()
    setError('')
    setOk('')
    try {
      await api.openAccount({
        customerId,
        type: accType,
        initialDeposit: Number(initialDeposit),
        ...(accType === 'FIXED' ? { termMonths: Number(termMonths) } : {}),
      })
      setOk('开户成功')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '失败')
    }
  }

  return (
    <div className="page">
      <h1>客户与账户</h1>
      <p className="muted">
        银行术语对照：客户建档 ≈ CIF；开户 ≈ 签约存款产品；活期/定期 ≈ 不同负债产品。
      </p>
      {error && <p className="err">{error}</p>}
      {ok && <p className="ok">{ok}</p>}

      <div className="two-col">
        <form className="panel" onSubmit={onCreateCustomer}>
          <h3>新建客户（建档）</h3>
          <label>
            姓名
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label>
            证件号
            <input
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              placeholder="15 或 18 位示意"
              required
            />
          </label>
          <label>
            手机
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="1 开头 11 位"
              required
            />
          </label>
          <button className="btn" type="submit">
            提交建档
          </button>
        </form>

        <form className="panel" onSubmit={onOpenAccount}>
          <h3>开立账户</h3>
          <label>
            所属客户
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}（{c.phone}）
                </option>
              ))}
            </select>
          </label>
          <label>
            账户类型
            <select
              value={accType}
              onChange={(e) => setAccType(e.target.value as 'CHECKING' | 'FIXED')}
            >
              <option value="CHECKING">活期 CHECKING</option>
              <option value="FIXED">定期 FIXED</option>
            </select>
          </label>
          <label>
            初始存入（元）
            <input
              type="number"
              min={0}
              step={0.01}
              value={initialDeposit}
              onChange={(e) => setInitialDeposit(Number(e.target.value))}
            />
          </label>
          {accType === 'FIXED' && (
            <label>
              存期（月）
              <input
                type="number"
                min={1}
                value={termMonths}
                onChange={(e) => setTermMonths(Number(e.target.value))}
              />
            </label>
          )}
          <button className="btn" type="submit">
            开户
          </button>
        </form>
      </div>

      <div className="panel">
        <h3>客户列表</h3>
        <table>
          <thead>
            <tr>
              <th>姓名</th>
              <th>证件号</th>
              <th>手机</th>
              <th>建档时间</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td className="mono">{c.idNumber}</td>
                <td>{c.phone}</td>
                <td>{new Date(c.createdAt).toLocaleString('zh-CN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel">
        <h3>账户列表与余额</h3>
        <table>
          <thead>
            <tr>
              <th>账号</th>
              <th>客户</th>
              <th>类型</th>
              <th>余额</th>
              <th>状态</th>
              <th>存期</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => {
              const owner = customers.find((c) => c.id === a.customerId)
              return (
                <tr key={a.id}>
                  <td className="mono">{a.accountNo}</td>
                  <td>{owner?.name || a.customerId.slice(0, 8)}</td>
                  <td>{ACCOUNT_TYPE_LABEL[a.type]}</td>
                  <td className="num">{a.balance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}</td>
                  <td>{a.status}</td>
                  <td>{a.termMonths ? `${a.termMonths} 月` : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
