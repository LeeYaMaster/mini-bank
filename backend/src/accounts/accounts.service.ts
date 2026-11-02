import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { StoreService } from '../store/store.service';
import { Account, Transaction } from '../store/entities';
import { OpenAccountDto } from './dto/open-account.dto';
import { CustomersService } from '../customers/customers.service';

@Injectable()
export class AccountsService {
  constructor(
    private readonly store: StoreService,
    private readonly customers: CustomersService,
  ) {}

  findAll(customerId?: string): Account[] {
    const list = this.store.getSnapshot().accounts;
    return customerId ? list.filter((a) => a.customerId === customerId) : list;
  }

  findOne(id: string): Account {
    const a = this.store.getSnapshot().accounts.find((x) => x.id === id);
    if (!a) throw new NotFoundException(`账户不存在: ${id}`);
    return a;
  }

  findByAccountNo(accountNo: string): Account {
    const a = this.store.getSnapshot().accounts.find((x) => x.accountNo === accountNo);
    if (!a) throw new NotFoundException(`账号不存在: ${accountNo}`);
    return a;
  }

  /**
   * 开户流程示意：
   * 1. 校验客户已建档
   * 2. 生成账号、建立账户
   * 3. 若有初始存款，记一笔 DEPOSIT 流水（贷记客户账户）
   */
  open(dto: OpenAccountDto): Account {
    this.customers.findOne(dto.customerId);

    if (dto.type === 'FIXED' && !dto.termMonths) {
      throw new BadRequestException('定期账户必须指定存期（月）');
    }
    if (dto.type === 'CHECKING' && dto.termMonths) {
      throw new BadRequestException('活期账户不应设置存期');
    }

    const data = this.store.getSnapshot();
    const now = new Date().toISOString();
    const account: Account = {
      id: uuid(),
      accountNo: this.store.nextAccountNo(),
      customerId: dto.customerId,
      type: dto.type,
      balance: 0,
      status: 'ACTIVE',
      termMonths: dto.type === 'FIXED' ? dto.termMonths! : null,
      createdAt: now,
    };

    // 初始存款：余额增加 + 写流水（失败则不应留下半开账户——本函数内同步完成）
    const amount = Number(dto.initialDeposit) || 0;
    if (amount > 0) {
      account.balance = round2(amount);
      const tx: Transaction = {
        id: uuid(),
        bizId: this.store.nextBizId('DEP'),
        accountId: account.id,
        accountNo: account.accountNo,
        type: 'DEPOSIT',
        amount: account.balance,
        balanceAfter: account.balance,
        remark: '开户初始存入',
        createdAt: now,
      };
      data.transactions.push(tx);
    }

    data.accounts.push(account);
    this.store.persist();
    return account;
  }

  /** 余额查询 */
  getBalance(id: string) {
    const a = this.findOne(id);
    return {
      accountId: a.id,
      accountNo: a.accountNo,
      type: a.type,
      status: a.status,
      balance: a.balance,
      termMonths: a.termMonths,
    };
  }
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
