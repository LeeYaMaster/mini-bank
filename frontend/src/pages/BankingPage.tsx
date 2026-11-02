import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { api } from '../api/client'
import type { Account } from '../api/types'
import { ACCOUNT_TYPE_LABEL } from '../api/types'

/** 存 / 取 / 转：核心账务操作页 */
export default function BankingPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [error, setError] = useState('')
  const [ok, setOk] = useState('')

  const [depAcc, setDepAcc] = useState('')
  const [depAmt, setDepAmt] = useState(100)
  const [wdrAcc, setWdrAcc] = useState('')
  const [wdrAmt, setWdrAmt] = useState(100)
  const [fromAcc, setFromAcc] = useState('')
  const [toNo, setToNo] = useState('')
  const [trfAmt, setTrfAmt] = useState(100)

  const checking = accounts.filter((a) => a.type === 'CHECKING' && a.status === 'ACTIVE')

  async function load() {
    const a = await api.listAccounts()
    setAccounts(a)
    const first = a.find((x) => x.type === 'CHECKING')
    if (first) {
      if (!depAcc) setDepAcc(first.id)
      if (!wdrAcc) setWdrAcc(first.id)
      if (!fromAcc) setFromAcc(first.id)
    }
  }

  useEffect(() => {
    load().catch((e) => setError(e.message))
  }, [])

  function flash(success: string) {
    setOk(success)
    setError('')
  }

  async function onDeposit(e: FormEvent) {
    e.preventDefault()
    try {
      await api.deposit({ accountId: depAcc, amount: Number(depAmt) })
      flash('存款成功')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '失败')
      setOk('')
    }
  }

  async function onWithdraw(e: FormEvent) {
    e.preventDefault()
    try {
      await api.withdraw({ accountId: wdrAcc, amount: Number(wdrAmt) })
      flash('取款成功')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '失败')
      setOk('')
    }
  }

  async function onTransfer(e: FormEvent) {
    e.preventDefault()
    try {
      const r = (await api.transfer({
        fromAccountId: fromAcc,
        toAccountNo: toNo.trim(),
        amount: Number(trfAmt),
      })) as {
        bizId: string
        message: string
        fromBalance: number
        toBalance: number
      }
      flash(
        `${r.message}；业务单号 ${r.bizId}；付款方余额 ${r.fromBalance}，收款方余额 ${r.toBalance}`,
      )
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : '失败')
      setOk('')
    }
  }

  return (
    <div className="page">
      <h1>存取与转账</h1>
      <p className="muted">
        转账要点（面试常问）：一笔业务同时<strong>减少付款方、增加收款方</strong>；失败要整体回滚；
        本项目用同一 bizId 的 TRANSFER_OUT / TRANSFER_IN 成对流水示意借贷分录。
      </p>
      {error && <p className="err">{error}</p>}
      {ok && <p className="ok">{ok}</p>}

      <div className="panel">
        <h3>可用账户速览</h3>
        <table>
          <thead>
            <tr>
              <th>账号</th>
              <th>类型</th>
              <th>余额</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id}>
                <td className="mono">{a.accountNo}</td>
                <td>{ACCOUNT_TYPE_LABEL[a.type]}</td>
                <td className="num">
                  {a.balance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="three-col">
        <form className="panel" onSubmit={onDeposit}>
          <h3>存款 Deposit</h3>
          <label>
            账户
            <select value={depAcc} onChange={(e) => setDepAcc(e.target.value)}>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.accountNo}（{ACCOUNT_TYPE_LABEL[a.type]}）
                </option>
              ))}
            </select>
          </label>
          <label>
            金额
            <input
              type="number"
              min={0.01}
              step={0.01}
              value={depAmt}
              onChange={(e) => setDepAmt(Number(e.target.value))}
            />
          </label>
          <button className="btn" type="submit">
            存入
          </button>
        </form>

        <form className="panel" onSubmit={onWithdraw}>
          <h3>取款 Withdraw</h3>
          <p className="hint">定期账户禁止直接取款；有单笔限额与余额校验。</p>
          <label>
            账户
            <select value={wdrAcc} onChange={(e) => setWdrAcc(e.target.value)}>
              {checking.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.accountNo}
                </option>
              ))}
            </select>
          </label>
          <label>
            金额
            <input
              type="number"
              min={0.01}
              step={0.01}
              value={wdrAmt}
              onChange={(e) => setWdrAmt(Number(e.target.value))}
            />
          </label>
          <button className="btn" type="submit">
            取出
          </button>
        </form>

        <form className="panel" onSubmit={onTransfer}>
          <h3>同行转账 Transfer</h3>
          <p className="hint">禁止自己转自己；超额 / 余额不足会拒绝。</p>
          <label>
            付款账户
            <select value={fromAcc} onChange={(e) => setFromAcc(e.target.value)}>
              {checking.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.accountNo}（余 {a.balance}）
                </option>
              ))}
            </select>
          </label>
          <label>
            收款账号
            <input
              className="mono"
              value={toNo}
              onChange={(e) => setToNo(e.target.value)}
              placeholder="例如 6222000000000003"
              required
            />
          </label>
          <label>
            金额
            <input
              type="number"
              min={0.01}
              step={0.01}
              value={trfAmt}
              onChange={(e) => setTrfAmt(Number(e.target.value))}
            />
          </label>
          <button className="btn" type="submit">
            转账
          </button>
        </form>
      </div>
    </div>
  )
}
