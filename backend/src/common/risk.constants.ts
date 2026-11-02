/**
 * 简单风控规则常量
 * 真实银行会有更复杂的限额体系（日累计、渠道限额、客户等级限额等）
 */
export const RISK = {
  /** 单笔转账上限（元）——演示用，真实银行按客户等级/渠道配置 */
  TRANSFER_SINGLE_LIMIT: 50_000,
  /** 单笔取款上限（元） */
  WITHDRAW_SINGLE_LIMIT: 20_000,
  /** 贷款自动审批额度上限（元）：超过需「人工」拒绝示意 */
  LOAN_AUTO_APPROVE_LIMIT: 100_000,
  /** 贷款最低金额 */
  LOAN_MIN_AMOUNT: 1_000,
  /** 默认年利率（示意，实际按产品定价） */
  LOAN_DEFAULT_ANNUAL_RATE: 0.045,
};
