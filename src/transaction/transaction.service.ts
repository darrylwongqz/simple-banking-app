import { Injectable, Logger } from '@nestjs/common';
import { Transaction } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionType } from '../bank/entities/bank-account.entity';

@Injectable()
export class TransactionService {
  private transactions: Transaction[] = [];
  private readonly logger = new Logger(TransactionService.name);

  addTransaction(transactionData: CreateTransactionDto) {
    const transaction = new Transaction(
      transactionData.transactionId,
      transactionData.accountId,
      transactionData.transactionType as TransactionType,
      transactionData.amount,
      transactionData.timestamp,
      transactionData.relatedAccount,
    );

    this.transactions.push(transaction);
    this.logger.log(`Transaction added: ${transaction.transactionId}`);
  }

  getAllTransactions(): Transaction[] {
    return [...this.transactions];
  }

  getTransactionsByAccount(accountId: string): Transaction[] {
    return this.transactions.filter((tx) => tx.accountId === accountId);
  }
}
