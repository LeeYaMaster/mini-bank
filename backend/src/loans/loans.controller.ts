import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { LoansService } from './loans.service';
import { ApplyLoanDto } from './dto/apply-loan.dto';
import { RepayLoanDto } from './dto/repay-loan.dto';

@Controller('loans')
export class LoansController {
  constructor(private readonly service: LoansService) {}

  @Get()
  findAll(@Query('customerId') customerId?: string) {
    return this.service.findAll(customerId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post('apply')
  apply(@Body() dto: ApplyLoanDto) {
    return this.service.apply(dto);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string) {
    return this.service.approve(id);
  }

  @Post(':id/disburse')
  disburse(@Param('id') id: string) {
    return this.service.disburse(id);
  }

  @Post('repay')
  repay(@Body() dto: RepayLoanDto) {
    return this.service.repay(dto);
  }
}
