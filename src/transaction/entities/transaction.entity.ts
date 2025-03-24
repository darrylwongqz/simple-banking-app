import { TransactionType } from '../../bank/entities/bank-account.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class Transaction {
  @ApiProperty({ description: 'Unique transaction ID' })
  transactionId: string;

  @ApiProperty({ description: 'Associated bank account ID' })
  accountId: string;

  @ApiProperty({ description: 'Type of transaction', enum: TransactionType })
  transactionType: TransactionType;

  @ApiProperty({ description: 'Amount of the transaction as a string' })
  amount: string;

  @ApiProperty({ description: 'Timestamp of the transaction' })
  timestamp: Date;

  @ApiPropertyOptional({ description: 'Related account ID for transfers' })
  relatedAccount?: string;

  constructor(
    transactionId: string,
    accountId: string,
    transactionType: TransactionType,
    amount: string,
    timestamp: Date,
    relatedAccount?: string,
  ) {
    this.transactionId = transactionId;
    this.accountId = accountId;
    this.transactionType = transactionType;
    this.amount = amount;
    this.timestamp = timestamp;
    this.relatedAccount = relatedAccount;
  }
}
