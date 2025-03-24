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
  balance: number;
  createdAt: Date;

  constructor(
    accountId: string,
    ownerUserId: string,
    name: string,
    startingBalance: number,
  ) {
    if (startingBalance < 0) {
      throw new Error('Starting balance cannot be negative');
    }
    this.accountId = accountId;
    this.ownerUserId = ownerUserId;
    this.name = name;
    this.balance = startingBalance;
    this.createdAt = new Date();
  }

  deposit(amount: number): void {
    if (amount <= 0) {
      throw new Error('Deposit amount must be positive');
    }
    this.balance += amount;
  }

  withdraw(amount: number): void {
    if (amount <= 0) {
      throw new Error('Withdrawal amount must be positive');
    }
    if (amount > this.balance) {
      throw new Error('Insufficient funds for withdrawal');
    }
    this.balance -= amount;
  }
}
