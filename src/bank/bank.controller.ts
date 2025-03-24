import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { BankService } from './bank.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { DepositDto } from './dto/deposit.dto';
import { WithdrawDto } from './dto/withdraw.dto';
import { TransferDto } from './dto/transfer.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

@ApiTags('Accounts')
@Controller('accounts')
export class BankController {
  constructor(private readonly bankService: BankService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new bank account' })
  @ApiResponse({ status: 201, description: 'Account created successfully.' })
  createAccount(@Body() createAccountDto: CreateAccountDto) {
    const account = this.bankService.createAccount(createAccountDto);
    return {
      message: 'Account created',
      account: { ...account, balance: account.balance.toFixed(2) },
    };
  }

  @Get(':accountId')
  @ApiOperation({ summary: 'Get bank account details by ID' })
  @ApiResponse({ status: 200, description: 'Returns account details.' })
  getAccount(@Param('accountId') accountId: string) {
    const account = this.bankService.getAccount(accountId);
    return { ...account, balance: account.balance.toFixed(2) };
  }

  @Get('by-user/:userId')
  @ApiOperation({ summary: 'Get bank accounts for a specific user' })
  @ApiResponse({
    status: 200,
    description: 'Returns a list of bank accounts for the user.',
  })
  getAccountsByUser(@Param('userId') userId: string) {
    const accounts = this.bankService.getAccountsByUserId(userId);
    return accounts.map((account) => ({
      ...account,
      balance: account.balance.toFixed(2),
    }));
  }

  @Get(':accountId/transactions')
  @ApiOperation({
    summary:
      'Get transactions for a specific account (only accessible by the account owner) - In production, userId would be part of JWT',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns transaction history for the account.',
  })
  @ApiQuery({
    name: 'userId',
    required: true,
    type: String,
    description: 'User UUID (must match the account owner)',
  })
  getAccountTransactions(
    @Param('accountId') accountId: string,
    @Query('userId') userId: string,
  ) {
    const account = this.bankService.getAccount(accountId);
    if (account.ownerUserId !== userId) {
      throw new UnauthorizedException(
        'You are not authorized to view these transactions',
      );
    }
    return this.bankService.getTransactionHistory(accountId);
  }

  @Post(':accountId/deposit')
  @ApiOperation({ summary: 'Deposit money into an account' })
  @ApiResponse({ status: 200, description: 'Deposit successful.' })
  deposit(
    @Param('accountId') accountId: string,
    @Body() depositDto: DepositDto,
  ) {
    const account = this.bankService.deposit(accountId, depositDto);
    return {
      message: 'Deposit successful',
      account: { ...account, balance: account.balance.toFixed(2) },
    };
  }

  @Post(':accountId/withdraw')
  @ApiOperation({ summary: 'Withdraw money from an account' })
  @ApiResponse({ status: 200, description: 'Withdrawal successful.' })
  withdraw(
    @Param('accountId') accountId: string,
    @Body() withdrawDto: WithdrawDto,
  ) {
    const account = this.bankService.withdraw(accountId, withdrawDto);
    return {
      message: 'Withdrawal successful',
      account: { ...account, balance: account.balance.toFixed(2) },
    };
  }

  @Post('transfer')
  @ApiOperation({ summary: 'Transfer money between accounts' })
  @ApiResponse({ status: 200, description: 'Transfer successful.' })
  transfer(@Body() transferDto: TransferDto) {
    const result = this.bankService.transfer(transferDto);
    return {
      message: 'Transfer successful',
      result: {
        fromAccount: {
          ...result.fromAccount,
          balance: result.fromAccount.balance.toFixed(2),
        },
        toAccount: {
          ...result.toAccount,
          balance: result.toAccount.balance.toFixed(2),
        },
      },
    };
  }
}
