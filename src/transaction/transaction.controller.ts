import { Controller, Get, Query } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('Transactions')
@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  @ApiOperation({ summary: 'Get all transactions or filter by accountId' })
  @ApiResponse({
    status: 200,
    description:
      'Returns all transaction logs or those filtered by accountId if provided.',
  })
  @ApiQuery({
    name: 'accountId',
    required: false,
    type: String,
    description: 'Filter transactions by account ID',
  })
  getTransactions(@Query('accountId') accountId?: string) {
    if (accountId) {
      return this.transactionService.getTransactionsByAccount(accountId);
    }
    return this.transactionService.getAllTransactions();
  }
}
