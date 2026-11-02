import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { OpenAccountDto } from './dto/open-account.dto';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly service: AccountsService) {}

  @Get()
  findAll(@Query('customerId') customerId?: string) {
    return this.service.findAll(customerId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/balance')
  balance(@Param('id') id: string) {
    return this.service.getBalance(id);
  }

  @Post()
  open(@Body() dto: OpenAccountDto) {
    return this.service.open(dto);
  }
}
