import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { StoreService } from '../store/store.service';
import { Loan, Transaction } from '../store/entities';
import { RISK } from '../common/risk.constants';
import { ApplyLoanDto } from './dto/apply-loan.dto';
import { RepayLoanDto } from './dto/repay-loan.dto';
import { round2 } from '../accounts/accounts.service';
import { CustomersService } from '../customers/customers.service';

/**
 * 贷款生命周期示意：
 * 申请(APPLIED) → 审批(APPROVED/REJECTED) → 放款(DISBURSED) → 还款(REPAYING) → 结清(SETTLED)
 *
 * 面试点：
 * - 贷款是银行资产；放款时客户存款账户余额增加（银行负债同时增加）
 * - 审批规则：额度、征信、担保等；本项目用简单金额阈值模拟自动审批
 */
@Injectable()
export class LoansService {
  constructor(
    private readonly store: StoreService,
    private readonly customers: CustomersService,
  ) {}

  findAll(customerId?: string): Loan[] {
    const list = this.store.getSnapshot().loans;
    const filtered = customerId
      ? list.filter((l) => l.customerId === customerId)
      : list;
    return [...filtered].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  findOne(id: string): Loan {
    const loan = this.store.getSnapshot().loans.find((l) => l.id === id);
    if (!loan) throw new NotFoundException(`贷款不存在: ${id}`);
    return loan;
  }

  /** 1. 申请贷款 */
  apply(dto: ApplyLoanDto): Loan {
    this.customers.findOne(dto.customerId);
    const data = this.store.getSnapshot();
    const account = data.accounts.find((a) => a.id === dto.accountId);
    if (!account) throw new NotFoundException('放款账户不存在');
    if (account.customerId !== dto.customerId) {
      throw new BadRequestException('放款账户必须属于该客户');
    }
    if (account.type !== 'CHECKING') {
      throw new BadRequestException('贷款只能放款到活期账户');
    }
    if (account.status !== 'ACTIVE') {
      throw new BadRequestException('放款账户状态不可用');
    }

    const principal = round2(dto.principal);
    if (principal < RISK.LOAN_MIN_AMOUNT) {
      throw new BadRequestException(`贷款金额不能低于 ${RISK.LOAN_MIN_AMOUNT}`);
    }

    const now = new Date().toISOString();
    const loan: Loan = {
      id: uuid(),
      customerId: dto.customerId,
      accountId: dto.accountId,
      principal,
      remainingPrincipal: principal,
      annualRate: RISK.LOAN_DEFAULT_ANNUAL_RATE,
      termMonths: dto.termMonths,
      status: 'APPLIED',
      createdAt: now,
      updatedAt: now,
    };
    data.loans.push(loan);
    this.store.persist();
    return loan;
  }

  /**
   * 2. 审批（简单规则）
   * - 本金 ≤ 自动审批额度 → 通过
   * - 超过 → 拒绝（示意「需人工复核」）
   */
  approve(id: string): Loan {
    const loan = this.findOne(id);
    if (loan.status !== 'APPLIED') {
      throw new BadRequestException(`当前状态 ${loan.status} 不可审批`);
    }
    const now = new Date().toISOString();
    if (loan.principal <= RISK.LOAN_AUTO_APPROVE_LIMIT) {
      loan.status = 'APPROVED';
      loan.approveRemark = `自动审批通过（≤${RISK.LOAN_AUTO_APPROVE_LIMIT} 元）`;
    } else {
      loan.status = 'REJECTED';
      loan.approveRemark = `超过自动审批额度 ${RISK.LOAN_AUTO_APPROVE_LIMIT} 元，示意拒绝（真实场景转人工）`;
    }
    loan.updatedAt = now;
    this.store.persist();
    return loan;
  }

  /**
   * 3. 放款：将本金记入客户活期账户 + 写 LOAN_DISBURSE 流水
   * 会计直觉：借：贷款资产；贷：客户存款负债
   */
  disburse(id: string): { loan: Loan; transaction: Transaction } {
    const loan = this.findOne(id);
    if (loan.status !== 'APPROVED') {
      throw new BadRequestException(`仅 APPROVED 状态可放款，当前: ${loan.status}`);
    }

    const data = this.store.getSnapshot();
    const account = data.accounts.find((a) => a.id === loan.accountId);
    if (!account || account.status !== 'ACTIVE') {
      throw new BadRequestException('放款账户不可用，放款失败（未改动贷款状态）');
    }

    const now = new Date().toISOString();
    const amount = loan.principal;
    account.balance = round2(account.balance + amount);

    const tx: Transaction = {
      id: uuid(),
      bizId: this.store.nextBizId('LND'),
      accountId: account.id,
      accountNo: account.accountNo,
      type: 'LOAN_DISBURSE',
      amount,
      balanceAfter: account.balance,
      remark: `贷款放款 loanId=${loan.id}`,
      createdAt: now,
    };
    data.transactions.push(tx);

    loan.status = 'DISBURSED';
    loan.updatedAt = now;
    this.store.persist();

    // 放款后进入可还款状态（简化：DISBURSED 与 REPAYING 均可还）
    loan.status = 'REPAYING';
    loan.updatedAt = new Date().toISOString();
    this.store.persist();

    return { loan, transaction: tx };
  }

  /**
   * 4. 还款：从活期账户扣款，冲减剩余本金
   * 本项目简化：不拆利息，全额冲本金；真实银行有本息拆分、还款计划
   */
  repay(dto: RepayLoanDto): { loan: Loan; transaction: Transaction } {
    const loan = this.findOne(dto.loanId);
    if (loan.status !== 'REPAYING' && loan.status !== 'DISBURSED') {
      throw new BadRequestException(`当前状态 ${loan.status} 不可还款`);
    }

    const amount = round2(dto.amount);
    if (amount > loan.remainingPrincipal) {
      throw new BadRequestException(
        `还款金额 ${amount} 超过剩余本金 ${loan.remainingPrincipal}`,
      );
    }

    const data = this.store.getSnapshot();
    const account = data.accounts.find((a) => a.id === dto.accountId);
    if (!account) throw new NotFoundException('扣款账户不存在');
    if (account.customerId !== loan.customerId) {
      throw new BadRequestException('只能用借款人本人账户还款');
    }
    if (account.type !== 'CHECKING' || account.status !== 'ACTIVE') {
      throw new BadRequestException('请使用本人可用活期账户还款');
    }
    if (account.balance < amount) {
      throw new BadRequestException(
        `账户余额不足：当前 ${account.balance}，还款 ${amount}`,
      );
    }

    // 先扣账户再改贷款，任一失败抛错即不 persist——简易回滚
    const now = new Date().toISOString();
    account.balance = round2(account.balance - amount);
    loan.remainingPrincipal = round2(loan.remainingPrincipal - amount);
    if (loan.remainingPrincipal === 0) {
      loan.status = 'SETTLED';
    } else {
      loan.status = 'REPAYING';
    }
    loan.updatedAt = now;

    const tx: Transaction = {
      id: uuid(),
      bizId: this.store.nextBizId('LNR'),
      accountId: account.id,
      accountNo: account.accountNo,
      type: 'LOAN_REPAY',
      amount,
      balanceAfter: account.balance,
      remark: `贷款还款 loanId=${loan.id}，剩余本金 ${loan.remainingPrincipal}`,
      createdAt: now,
    };
    data.transactions.push(tx);
    this.store.persist();
    return { loan, transaction: tx };
  }
}
