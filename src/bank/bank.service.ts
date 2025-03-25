import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { BankAccount, TransactionType } from './entities/bank-account.entity';
import { TransactionService } from '../transaction/transaction.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { v4 as uuidv4 } from 'uuid';
import BigNumber from 'bignumber.js';
import { DepositDto } from './dto/deposit.dto';
import { WithdrawDto } from './dto/withdraw.dto';
import { TransferDto } from './dto/transfer.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class BankService {
  private accounts: Map<string, BankAccount> = new Map();
  private readonly logger = new Logger(BankService.name);

  constructor(
    private readonly transactionService: TransactionService,
    private readonly userService: UserService,
  ) {}

  createAccount(createAccountDto: CreateAccountDto): BankAccount {
    const { ownerUserId, name, startingBalance } = createAccountDto;

    // Check if the user exists
    this.userService.getUser(ownerUserId);

    // Check if the user already has an account with the same name
    const duplicateAccount = Array.from(this.accounts.values()).find(
      (account) => account.ownerUserId === ownerUserId && account.name === name,
    );

    if (duplicateAccount) {
      throw new HttpException(
        `User already has an account with the name "${name}"`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate starting balance
    const startingBalanceBN = new BigNumber(startingBalance);
    if (startingBalanceBN.lt(0)) {
      throw new HttpException(
        'Starting balance cannot be negative',
        HttpStatus.BAD_REQUEST,
      );
    }

    const accountId = uuidv4();
    const account = new BankAccount(
      accountId,
      ownerUserId,
      name,
      startingBalance,
    );

    this.accounts.set(accountId, account);
    this.logger.log(`Account created: ${accountId} for user ${ownerUserId}`);

    // Only create initial deposit transaction if starting balance is greater than 0
    if (startingBalanceBN.gt(0)) {
      this.transactionService.addTransaction({
        transactionId: uuidv4(),
        accountId,
        transactionType: TransactionType.INITIAL_DEPOSIT,
        amount: startingBalanceBN.toFixed(2),
        timestamp: new Date(),
      });
    } else {
      this.logger.log(
        `Account created with zero starting balance: ${accountId}`,
      );
    }

    return account;
  }

  getAccount(accountId: string): BankAccount {
    const account = this.accounts.get(accountId);
    if (!account) {
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
    }
    return account;
  }

  deposit(accountId: string, depositDto: DepositDto) {
    const { userId, amount } = depositDto;
    const amountBN = new BigNumber(amount);
    if (amountBN.lte(0)) {
      throw new HttpException(
        'Deposit amount must be positive',
        HttpStatus.BAD_REQUEST,
      );
    }
    const account = this.getAccount(accountId);
    if (account.ownerUserId !== userId) {
      throw new HttpException(
        'Unauthorized access to deposit',
        HttpStatus.UNAUTHORIZED,
      );
    }
    account.deposit(amountBN);
    this.logger.log(`Deposit: ${amount} to account ${accountId}`);

    this.transactionService.addTransaction({
      transactionId: uuidv4(),
      accountId,
      transactionType: TransactionType.DEPOSIT,
      amount: amountBN.toFixed(2),
      timestamp: new Date(),
    });
    return account;
  }

  withdraw(accountId: string, withdrawDto: WithdrawDto): BankAccount {
    const { userId, amount } = withdrawDto;
    const amountBN = new BigNumber(amount);
    if (amountBN.lte(0)) {
      throw new HttpException(
        'Withdrawal amount must be positive',
        HttpStatus.BAD_REQUEST,
      );
    }
    const account = this.getAccount(accountId);
    if (account.ownerUserId !== userId) {
      throw new HttpException(
        'Unauthorized access to withdraw',
        HttpStatus.UNAUTHORIZED,
      );
    }
    try {
      account.withdraw(amountBN);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
    this.logger.log(`Withdrawal: ${amount} from account ${accountId}`);

    this.transactionService.addTransaction({
      transactionId: uuidv4(),
      accountId,
      transactionType: TransactionType.WITHDRAWAL,
      amount: amountBN.toFixed(2),
      timestamp: new Date(),
    });
    return account;
  }

  transfer(transferDto: TransferDto): {
    fromAccount: BankAccount;
    toAccount: BankAccount;
  } {
    const { userId, fromAccountId, toAccountId, amount } = transferDto;

    // Prevent transfers to the same account
    if (fromAccountId === toAccountId) {
      throw new HttpException(
        'Cannot transfer to the same account',
        HttpStatus.BAD_REQUEST,
      );
    }

    const amountBN = new BigNumber(amount);
    if (amountBN.lte(0)) {
      throw new HttpException(
        'Transfer amount must be positive',
        HttpStatus.BAD_REQUEST,
      );
    }
    const fromAccount = this.getAccount(fromAccountId);
    const toAccount = this.getAccount(toAccountId);

    if (fromAccount.ownerUserId !== userId) {
      throw new HttpException(
        'Unauthorized access to transfer from this account',
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      fromAccount.withdraw(amountBN);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
    toAccount.deposit(amountBN);
    this.logger.log(
      `Transfer: ${amount} from account ${fromAccountId} to ${toAccountId}`,
    );

    this.transactionService.addTransaction({
      transactionId: uuidv4(),
      accountId: fromAccountId,
      transactionType: TransactionType.TRANSFER_OUT,
      amount: amountBN.toFixed(2),
      timestamp: new Date(),
      relatedAccount: toAccountId,
    });
    this.transactionService.addTransaction({
      transactionId: uuidv4(),
      accountId: toAccountId,
      transactionType: TransactionType.TRANSFER_IN,
      amount: amountBN.toFixed(2),
      timestamp: new Date(),
      relatedAccount: fromAccountId,
    });

    return { fromAccount, toAccount };
  }

  getTransactionHistory(accountId: string) {
    return this.transactionService.getTransactionsByAccount(accountId);
  }

  getAccountsByUserId(userId: string) {
    return Array.from(this.accounts.values()).filter(
      (account) => account.ownerUserId === userId,
    );
  }
}
