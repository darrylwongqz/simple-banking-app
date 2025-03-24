import { Controller, Get } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Transactions')
@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  @ApiOperation({ summary: 'Get all transactions (for audit purposes)' })
  @ApiResponse({ status: 200, description: 'Returns all transaction logs.' })
  getTransactions() {
    return this.transactionService.getAllTransactions();
  }
}
