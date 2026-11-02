import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { StoreService } from '../store/store.service';
import { Account, Transaction } from '../store/entities';
import { RISK } from '../common/risk.constants';
import { DepositDto } from './dto/deposit.dto';
import { WithdrawDto } from './dto/withdraw.dto';
import { TransferDto } from './dto/transfer.dto';
import { round2 } from '../accounts/accounts.service';

@Injectable()
export class TransactionsService {
  constructor(private readonly store: StoreService) {}

  findAll(accountId?: string): Transaction[] {
    const list = this.store.getSnapshot().transactions;
    const filtered = accountId
      ? list.filter((t) => t.accountId === accountId)
      : list;
    // 新流水在前
    return [...filtered].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  findByBizId(bizId: string): Transaction[] {
    return this.store
      .getSnapshot()
      .transactions.filter((t) => t.bizId === bizId);
  }

  private getActiveAccount(id: string): Account {
    const a = this.store.getSnapshot().accounts.find((x) => x.id === id);
    if (!a) throw new NotFoundException(`账户不存在: ${id}`);
    if (a.status !== 'ACTIVE') {
      throw new BadRequestException(`账户状态不可用: ${a.status}`);
    }
    return a;
  }

  /**
   * 存款：贷记客户账户（余额增加）
   * 会计直觉：客户把钱存进来 → 银行现金资产↑、对客户负债↑
   */
  deposit(dto: DepositDto): Transaction {
    const amount = round2(dto.amount);
    const data = this.store.getSnapshot();
    const account = this.getActiveAccount(dto.accountId);

    account.balance = round2(account.balance + amount);
    const tx: Transaction = {
      id: uuid(),
      bizId: this.store.nextBizId('DEP'),
      accountId: account.id,
      accountNo: account.accountNo,
      type: 'DEPOSIT',
      amount,
      balanceAfter: account.balance,
      remark: dto.remark || '现金/渠道存款',
      createdAt: new Date().toISOString(),
    };
    data.transactions.push(tx);
    this.store.persist();
    return tx;
  }

  /**
   * 取款：借记客户账户（余额减少）
   * 风控：余额不足、单笔限额
   */
  withdraw(dto: WithdrawDto): Transaction {
    const amount = round2(dto.amount);
    if (amount > RISK.WITHDRAW_SINGLE_LIMIT) {
      throw new BadRequestException(
        `单笔取款超过限额 ${RISK.WITHDRAW_SINGLE_LIMIT} 元`,
      );
    }

    const data = this.store.getSnapshot();
    const account = this.getActiveAccount(dto.accountId);

    // 定期账户示意：不允许提前支取（真实银行可部分提前支取并罚息）
    if (account.type === 'FIXED') {
      throw new BadRequestException('定期账户示意：不允许直接取款（需到期或提前支取流程）');
    }

    if (account.balance < amount) {
      throw new BadRequestException(
        `余额不足：当前 ${account.balance} 元，取款 ${amount} 元`,
      );
    }

    account.balance = round2(account.balance - amount);
    const tx: Transaction = {
      id: uuid(),
      bizId: this.store.nextBizId('WDR'),
      accountId: account.id,
      accountNo: account.accountNo,
      type: 'WITHDRAW',
      amount,
      balanceAfter: account.balance,
      remark: dto.remark || '现金/渠道取款',
      createdAt: new Date().toISOString(),
    };
    data.transactions.push(tx);
    this.store.persist();
    return tx;
  }

  /**
   * 同行转账（核心示意）
   *
   * 借贷分录思路：
   * - 付款方：借记（余额减少）→ TRANSFER_OUT
   * - 收款方：贷记（余额增加）→ TRANSFER_IN
   * - 同一 bizId 串起双边流水，便于对账
   *
   * 「事务/回滚」：本项目在内存中先校验全部条件，再一次性改余额+写流水；
   * 任一步失败在改数据前抛错，相当于回滚。真实系统用 DB 事务。
   */
  transfer(dto: TransferDto) {
    const amount = round2(dto.amount);

    // —— 风控校验（全部在变更前完成）——
    if (amount > RISK.TRANSFER_SINGLE_LIMIT) {
      throw new BadRequestException(
        `单笔转账超过限额 ${RISK.TRANSFER_SINGLE_LIMIT} 元`,
      );
    }

    const data = this.store.getSnapshot();
    const from = this.getActiveAccount(dto.fromAccountId);

    if (from.type === 'FIXED') {
      throw new BadRequestException('定期账户示意：不可直接转出');
    }

    const to = data.accounts.find((a) => a.accountNo === dto.toAccountNo);
    if (!to) {
      throw new NotFoundException(`收款账号不存在: ${dto.toAccountNo}`);
    }
    if (to.status !== 'ACTIVE') {
      throw new BadRequestException(`收款账户状态不可用: ${to.status}`);
    }

    // 禁止向自己转账
    if (from.id === to.id || from.accountNo === to.accountNo) {
      throw new BadRequestException('禁止向自己的同一账户转账');
    }

    if (from.balance < amount) {
      throw new BadRequestException(
        `余额不足：当前 ${from.balance} 元，转账 ${amount} 元`,
      );
    }

    // —— 原子变更：双边记账 ——
    const now = new Date().toISOString();
    const bizId = this.store.nextBizId('TRF');
    const remark = dto.remark || '同行转账';

    from.balance = round2(from.balance - amount);
    to.balance = round2(to.balance + amount);

    const outTx: Transaction = {
      id: uuid(),
      bizId,
      accountId: from.id,
      accountNo: from.accountNo,
      type: 'TRANSFER_OUT',
      amount,
      balanceAfter: from.balance,
      counterpartyAccountNo: to.accountNo,
      remark,
      createdAt: now,
    };
    const inTx: Transaction = {
      id: uuid(),
      bizId,
      accountId: to.id,
      accountNo: to.accountNo,
      type: 'TRANSFER_IN',
      amount,
      balanceAfter: to.balance,
      counterpartyAccountNo: from.accountNo,
      remark,
      createdAt: now,
    };

    data.transactions.push(outTx, inTx);
    this.store.persist();

    return {
      bizId,
      message: '转账成功（已完成借贷双边记账）',
      debit: outTx,  // 借：付款方
      credit: inTx,  // 贷：收款方
      fromBalance: from.balance,
      toBalance: to.balance,
    };
  }
}
