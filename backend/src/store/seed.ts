import { v4 as uuid } from 'uuid';
import { BankData } from './entities';

/**
 * 种子数据：方便立刻演示开户、转账、贷款等流程
 */
export function seedData(): BankData {
  const now = new Date().toISOString();
  const c1 = uuid();
  const c2 = uuid();
  const a1 = uuid();
  const a2 = uuid();
  const a3 = uuid();

  return {
    customers: [
      {
        id: c1,
        name: '张三',
        idNumber: '110101199001011234',
        phone: '13800000001',
        createdAt: now,
      },
      {
        id: c2,
        name: '李四',
        idNumber: '110101199002021234',
        phone: '13800000002',
        createdAt: now,
      },
    ],
    accounts: [
      {
        id: a1,
        accountNo: '6222000000000001',
        customerId: c1,
        type: 'CHECKING',
        balance: 10000,
        status: 'ACTIVE',
        termMonths: null,
        createdAt: now,
      },
      {
        id: a2,
        accountNo: '6222000000000002',
        customerId: c1,
        type: 'FIXED',
        balance: 50000,
        status: 'ACTIVE',
        termMonths: 12,
        createdAt: now,
      },
      {
        id: a3,
        accountNo: '6222000000000003',
        customerId: c2,
        type: 'CHECKING',
        balance: 8000,
        status: 'ACTIVE',
        termMonths: null,
        createdAt: now,
      },
    ],
    transactions: [
      {
        id: uuid(),
        bizId: 'DEP20260101000001',
        accountId: a1,
        accountNo: '6222000000000001',
        type: 'DEPOSIT',
        amount: 10000,
        balanceAfter: 10000,
        remark: '开户初始存款（种子）',
        createdAt: now,
      },
      {
        id: uuid(),
        bizId: 'DEP20260101000002',
        accountId: a2,
        accountNo: '6222000000000002',
        type: 'DEPOSIT',
        amount: 50000,
        balanceAfter: 50000,
        remark: '定期账户初始存入（种子）',
        createdAt: now,
      },
      {
        id: uuid(),
        bizId: 'DEP20260101000003',
        accountId: a3,
        accountNo: '6222000000000003',
        type: 'DEPOSIT',
        amount: 8000,
        balanceAfter: 8000,
        remark: '开户初始存款（种子）',
        createdAt: now,
      },
    ],
    loans: [],
    seq: { account: 3, biz: 3 },
  };
}
