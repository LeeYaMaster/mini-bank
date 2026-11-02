import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { Account, Transaction } from '../api/types'
import { TX_TYPE_LABEL } from '../api/types'

export default function TransactionsPage() {
  const [txs, setTxs] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [accountId, setAccountId] = useState('')
  const [error, setError] = useState('')

  async function load(filterId?: string) {
    const [t, a] = await Promise.all([
      api.listTransactions(filterId || undefined),
      api.listAccounts(),
    ])
    setTxs(t)
    setAccounts(a)
  }

  useEffect(() => {
    load().catch((e) => setError(e.message))
  }, [])

  return (
    <div className="page">
      <h1>交易流水</h1>
      <p className="muted">
        每笔业务落流水便于对账与审计。转账的借/贷两笔共享同一 <code>bizId</code>，可对照会计分录。
      </p>
      {error && <p className="err">{error}</p>}

      <div className="panel toolbar">
        <label>
          按账户筛选
          <select
            value={accountId}
            onChange={(e) => {
              const v = e.target.value
              setAccountId(v)
              load(v).catch((err) => setError(err.message))
            }}
          >
            <option value="">全部账户</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.accountNo}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="btn secondary"
          onClick={() => load(accountId).catch((e) => setError(e.message))}
        >
          刷新
        </button>
      </div>

      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>时间</th>
              <th>业务单号</th>
              <th>账号</th>
              <th>类型</th>
              <th>金额</th>
              <th>交易后余额</th>
              <th>对方账号</th>
              <th>摘要</th>
            </tr>
          </thead>
          <tbody>
            {txs.map((t) => (
              <tr key={t.id}>
                <td>{new Date(t.createdAt).toLocaleString('zh-CN')}</td>
                <td className="mono small">{t.bizId}</td>
                <td className="mono">{t.accountNo}</td>
                <td>{TX_TYPE_LABEL[t.type]}</td>
                <td className="num">
                  {t.amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                </td>
                <td className="num">
                  {t.balanceAfter.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                </td>
                <td className="mono">{t.counterpartyAccountNo || '—'}</td>
                <td className="small">{t.remark}</td>
              </tr>
            ))}
            {txs.length === 0 && (
              <tr>
                <td colSpan={8}>暂无流水</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
