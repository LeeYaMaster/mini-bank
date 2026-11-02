import { Module } from '@nestjs/common';
import { LoansController } from './loans.controller';
import { LoansService } from './loans.service';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [CustomersModule],
  controllers: [LoansController],
  providers: [LoansService],
})
export class LoansModule {}
