/**
 * 领域实体定义
 * 对照银行核心：客户主数据、账户、会计分录思路的流水、贷款合约
 */

/** 客户（CIF / Customer Information File 示意） */
export interface Customer {
  id: string;
  /** 客户姓名 */
  name: string;
  /** 证件号示意（面试可谈 KYC / 实名认证） */
  idNumber: string;
  phone: string;
  createdAt: string;
}

/** 账户类型：活期 / 定期示意 */
export type AccountType = 'CHECKING' | 'FIXED';

/** 账户状态 */
export type AccountStatus = 'ACTIVE' | 'FROZEN' | 'CLOSED';

/**
 * 存款账户
 * 银行术语：Account / 负债科目（客户存款对银行是负债）
 */
export interface Account {
  id: string;
  /** 账号（对外展示） */
  accountNo: string;
  customerId: string;
  type: AccountType;
  /** 余额，单位：元，保留 2 位小数思路 */
  balance: number;
  status: AccountStatus;
  /** 定期示意：存期月数，活期为 null */
  termMonths: number | null;
  createdAt: string;
}

/** 交易类型 */
export type TxType =
  | 'DEPOSIT'      // 存款 / 贷记客户账户
  | 'WITHDRAW'     // 取款 / 借记客户账户
  | 'TRANSFER_OUT' // 转出
  | 'TRANSFER_IN'  // 转入
  | 'LOAN_DISBURSE'// 贷款放款
  | 'LOAN_REPAY';   // 贷款还款

/**
 * 交易流水
 * 真实核心常按「会计分录」记账：一借一贷、借贷平衡
 * 本项目用成对流水示意转账的双边记账
 */
export interface Transaction {
  id: string;
  /** 关联业务单号：同一笔转账的借贷双方共用 */
  bizId: string;
  accountId: string;
  accountNo: string;
  type: TxType;
  /** 金额（正数） */
  amount: number;
  /** 交易后余额 */
  balanceAfter: number;
  /** 对方账号（转账时有） */
  counterpartyAccountNo?: string;
  remark: string;
  createdAt: string;
}

/** 贷款状态机：申请 → 审批 → 放款 → 还款中 → 结清 / 拒绝 */
export type LoanStatus =
  | 'APPLIED'
  | 'APPROVED'
  | 'REJECTED'
  | 'DISBURSED'
  | 'REPAYING'
  | 'SETTLED';

/**
 * 贷款合约示意
 * 银行术语：Loan Contract / 资产科目（贷款对银行是资产）
 */
export interface Loan {
  id: string;
  customerId: string;
  /** 放款到的账户 */
  accountId: string;
  /** 申请本金 */
  principal: number;
  /** 剩余本金 */
  remainingPrincipal: number;
  /** 年利率 */
  annualRate: number;
  termMonths: number;
  status: LoanStatus;
  /** 审批意见 */
  approveRemark?: string;
  createdAt: string;
  updatedAt: string;
}

/** 持久化根结构 */
export interface BankData {
  customers: Customer[];
  accounts: Account[];
  transactions: Transaction[];
  loans: Loan[];
  /** 账号序号生成 */
  seq: {
    account: number;
    biz: number;
  };
}
