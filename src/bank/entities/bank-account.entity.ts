import BigNumber from 'bignumber.js';

export enum TransactionType {
  INITIAL_DEPOSIT = 'INITIAL_DEPOSIT',
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  TRANSFER_IN = 'TRANSFER_IN',
  TRANSFER_OUT = 'TRANSFER_OUT',
}

export class BankAccount {
  accountId: string;
  ownerUserId: string;
  name: string;
  balance: BigNumber;
  createdAt: Date;

  constructor(
    accountId: string,
    ownerUserId: string,
    name: string,
    startingBalance: number | string,
  ) {
    if (new BigNumber(startingBalance).lt(0)) {
      throw new Error('Starting balance cannot be negative');
    }
    this.accountId = accountId;
    this.ownerUserId = ownerUserId;
    this.name = name;
    this.balance = new BigNumber(startingBalance);
    this.createdAt = new Date();
  }

  deposit(amount: BigNumber): void {
    if (amount.lte(0)) {
      throw new Error('Deposit amount must be positive');
    }
    this.balance = this.balance.plus(amount);
  }

  withdraw(amount: BigNumber): void {
    if (amount.lte(0)) {
      throw new Error('Withdrawal amount must be positive');
    }
    if (this.balance.lt(amount)) {
      throw new Error('Insufficient funds for withdrawal');
    }
    this.balance = this.balance.minus(amount);
  }
}
