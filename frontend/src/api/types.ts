/** 与后端实体对齐的前端类型 */

export interface Customer {
  id: string
  name: string
  idNumber: string
  phone: string
  createdAt: string
}

export type AccountType = 'CHECKING' | 'FIXED'
export type AccountStatus = 'ACTIVE' | 'FROZEN' | 'CLOSED'

export interface Account {
  id: string
  accountNo: string
  customerId: string
  type: AccountType
  balance: number
  status: AccountStatus
  termMonths: number | null
  createdAt: string
}

export type TxType =
  | 'DEPOSIT'
  | 'WITHDRAW'
  | 'TRANSFER_OUT'
  | 'TRANSFER_IN'
  | 'LOAN_DISBURSE'
  | 'LOAN_REPAY'

export interface Transaction {
  id: string
  bizId: string
  accountId: string
  accountNo: string
  type: TxType
  amount: number
  balanceAfter: number
  counterpartyAccountNo?: string
  remark: string
  createdAt: string
}

export type LoanStatus =
  | 'APPLIED'
  | 'APPROVED'
  | 'REJECTED'
  | 'DISBURSED'
  | 'REPAYING'
  | 'SETTLED'

export interface Loan {
  id: string
  customerId: string
  accountId: string
  principal: number
  remainingPrincipal: number
  annualRate: number
  termMonths: number
  status: LoanStatus
  approveRemark?: string
  createdAt: string
  updatedAt: string
}

export const TX_TYPE_LABEL: Record<TxType, string> = {
  DEPOSIT: '存款',
  WITHDRAW: '取款',
  TRANSFER_OUT: '转出',
  TRANSFER_IN: '转入',
  LOAN_DISBURSE: '贷款放款',
  LOAN_REPAY: '贷款还款',
}

export const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  CHECKING: '活期',
  FIXED: '定期',
}

export const LOAN_STATUS_LABEL: Record<LoanStatus, string> = {
  APPLIED: '已申请',
  APPROVED: '已审批通过',
  REJECTED: '已拒绝',
  DISBURSED: '已放款',
  REPAYING: '还款中',
  SETTLED: '已结清',
}
