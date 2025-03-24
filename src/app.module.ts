import { Module } from '@nestjs/common';
import { BankModule } from './bank/bank.module';
import { UserModule } from './user/user.module';
import { TransactionModule } from './transaction/transaction.module';

@Module({
  imports: [BankModule, UserModule, TransactionModule],
})
export class AppModule {}
