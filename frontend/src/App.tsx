import { NavLink, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import CustomersPage from './pages/CustomersPage'
import BankingPage from './pages/BankingPage'
import LoansPage from './pages/LoansPage'
import TransactionsPage from './pages/TransactionsPage'
import './App.css'

export default function App() {
  return (
    <div className="layout">
      <header className="topbar">
        <div className="brand">迷你银行 Mini-Bank</div>
        <nav>
          <NavLink to="/" end>
            首页
          </NavLink>
          <NavLink to="/customers">客户账户</NavLink>
          <NavLink to="/banking">存取转账</NavLink>
          <NavLink to="/loans">贷款</NavLink>
          <NavLink to="/transactions">流水</NavLink>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/banking" element={<BankingPage />} />
          <Route path="/loans" element={<LoansPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
        </Routes>
      </main>
      <footer className="footer">
        练习项目 · 非真实银行系统 · 数据存于 backend/data/bank.json
      </footer>
    </div>
  )
}
