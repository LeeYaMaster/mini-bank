import { Controller, Get, Post } from '@nestjs/common';
import { StoreService } from './store/store.service';
import { RISK } from './common/risk.constants';

/** 系统辅助：健康检查、风控规则查询、重置演示数据 */
@Controller()
export class SystemController {
  constructor(private readonly store: StoreService) {}

  @Get('health')
  health() {
    return { status: 'ok', name: 'mini-bank', time: new Date().toISOString() };
  }

  @Get('risk-rules')
  riskRules() {
    return {
      description: '演示用简单风控规则（真实银行按客户/渠道/产品配置限额）',
      rules: RISK,
    };
  }

  @Post('demo/reset')
  reset() {
    const data = this.store.reset();
    return {
      message: '已重置为种子数据',
      customers: data.customers.length,
      accounts: data.accounts.length,
      transactions: data.transactions.length,
      loans: data.loans.length,
    };
  }
}
