import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BankModule } from './bank/bank.module';
import { UserModule } from './user/user.module';
import { TransactionModule } from './transaction/transaction.module';

@Module({
  imports: [BankModule, UserModule, TransactionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
