import { Module } from '@nestjs/common';
import { StoreModule } from './store/store.module';
import { CustomersModule } from './customers/customers.module';
import { AccountsModule } from './accounts/accounts.module';
import { TransactionsModule } from './transactions/transactions.module';
import { LoansModule } from './loans/loans.module';
import { SystemController } from './system.controller';

@Module({
  imports: [
    StoreModule,
    CustomersModule,
    AccountsModule,
    TransactionsModule,
    LoansModule,
  ],
  controllers: [SystemController],
})
export class AppModule {}
