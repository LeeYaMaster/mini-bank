import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'

/** 首页：业务导航 + 概念速览（对照面试话术） */
export default function HomePage() {
  const [health, setHealth] = useState('检测中…')
  const [rules, setRules] = useState<Record<string, number> | null>(null)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    api
      .health()
      .then(() => setHealth('后端已连接'))
      .catch(() => setHealth('后端未连接，请先启动 backend（端口 3000）'))
    api.riskRules().then((r) => setRules(r.rules)).catch(() => {})
  }, [])

  async function reset() {
    if (!confirm('确定重置为种子演示数据？当前数据会被覆盖。')) return
    try {
      const r = await api.resetDemo()
      setMsg(r.message)
    } catch (e) {
      setMsg(e instanceof Error ? e.message : '重置失败')
    }
  }

  return (
    <div className="page">
      <h1>迷你银行 · 核心业务练习</h1>
      <p className="muted">
        面向银行科技/开发应聘：用可运行代码对照「客户 → 账户 → 存取转 → 贷款 → 流水 → 风控」。
      </p>
      <p>
        <strong>后端状态：</strong>
        <span className={health.includes('已连接') ? 'ok' : 'err'}>{health}</span>
      </p>

      <div className="card-grid">
        <Link className="card" to="/customers">
          <h3>1. 客户与账户</h3>
          <p>建档（CIF）、开立活期/定期、余额查询</p>
        </Link>
        <Link className="card" to="/banking">
          <h3>2. 存取与转账</h3>
          <p>存款、取款、同行转账（借贷双边记账）</p>
        </Link>
        <Link className="card" to="/loans">
          <h3>3. 贷款</h3>
          <p>申请 → 审批 → 放款 → 还款</p>
        </Link>
        <Link className="card" to="/transactions">
          <h3>4. 交易流水</h3>
          <p>每笔业务可追溯，转账共用 bizId</p>
        </Link>
      </div>

      {rules && (
        <div className="panel">
          <h3>当前风控规则（示意）</h3>
          <ul>
            <li>单笔转账限额：{rules.TRANSFER_SINGLE_LIMIT?.toLocaleString()} 元</li>
            <li>单笔取款限额：{rules.WITHDRAW_SINGLE_LIMIT?.toLocaleString()} 元</li>
            <li>贷款自动审批上限：{rules.LOAN_AUTO_APPROVE_LIMIT?.toLocaleString()} 元</li>
            <li>默认年利率：{((rules.LOAN_DEFAULT_ANNUAL_RATE || 0) * 100).toFixed(2)}%</li>
          </ul>
        </div>
      )}

      <div className="panel tip">
        <h3>建议演示路径</h3>
        <ol>
          <li>查看种子客户「张三 / 李四」及其账户余额</li>
          <li>张三活期 → 李四活期 转一笔小额，再到流水页看借贷成对记录</li>
          <li>为张三申请 ≤10 万贷款 → 审批 → 放款 → 部分还款</li>
          <li>故意试：超额转账、余额不足、自己转自己，观察风控报错</li>
        </ol>
        <button type="button" className="btn secondary" onClick={reset}>
          重置演示数据
        </button>
        {msg && <p className="ok">{msg}</p>}
      </div>
    </div>
  )
}
