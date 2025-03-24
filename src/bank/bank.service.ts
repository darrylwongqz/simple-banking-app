import { Injectable, Logger } from '@nestjs/common';
import { BankAccount } from './entities/bank-account.entity';
import { TransactionService } from '../transaction/transaction.service';

@Injectable()
export class BankService {
  private accounts: Map<string, BankAccount> = new Map();
  private readonly logger = new Logger(BankService.name);

  constructor(private readonly transactionService: TransactionService) {}
}
