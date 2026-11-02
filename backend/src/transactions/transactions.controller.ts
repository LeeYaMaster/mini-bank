import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { DepositDto } from './dto/deposit.dto';
import { WithdrawDto } from './dto/withdraw.dto';
import { TransferDto } from './dto/transfer.dto';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly service: TransactionsService) {}

  @Get()
  findAll(@Query('accountId') accountId?: string) {
    return this.service.findAll(accountId);
  }

  @Get('biz/:bizId')
  findByBiz(@Param('bizId') bizId: string) {
    return this.service.findByBizId(bizId);
  }

  @Post('deposit')
  deposit(@Body() dto: DepositDto) {
    return this.service.deposit(dto);
  }

  @Post('withdraw')
  withdraw(@Body() dto: WithdrawDto) {
    return this.service.withdraw(dto);
  }

  @Post('transfer')
  transfer(@Body() dto: TransferDto) {
    return this.service.transfer(dto);
  }
}
