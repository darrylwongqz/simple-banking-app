import { BankAccount } from './bank-account.entity';
import BigNumber from 'bignumber.js';

describe('BankAccount', () => {
  const accountId = '123e4567-e89b-12d3-a456-426614174000';
  const userId = '123e4567-e89b-12d3-a456-426614174001';
  const accountName = 'Test Account';

  describe('constructor', () => {
    it('should create a bank account with valid parameters', () => {
      const account = new BankAccount(accountId, userId, accountName, '100');

      expect(account.accountId).toBe(accountId);
      expect(account.ownerUserId).toBe(userId);
      expect(account.name).toBe(accountName);
      expect(account.balance.toString()).toBe('100');
      expect(account.createdAt).toBeInstanceOf(Date);
    });

    it('should create a bank account with zero balance', () => {
      const account = new BankAccount(accountId, userId, accountName, '0');

      expect(account.balance.toString()).toBe('0');
    });

    it('should create a bank account with decimal balance', () => {
      const account = new BankAccount(accountId, userId, accountName, '100.25');

      expect(account.balance.toString()).toBe('100.25');
    });

    it('should throw an error when starting balance is negative', () => {
      expect(() => {
        new BankAccount(accountId, userId, accountName, '-50');
      }).toThrow('Starting balance cannot be negative');
    });

    it('should accept number type for starting balance', () => {
      const account = new BankAccount(accountId, userId, accountName, 150.75);

      expect(account.balance.toString()).toBe('150.75');
    });
  });

  describe('deposit', () => {
    it('should increase balance by deposit amount', () => {
      const account = new BankAccount(accountId, userId, accountName, '100');
      account.deposit(new BigNumber('50'));

      expect(account.balance.toString()).toBe('150');
    });

    it('should correctly handle decimal deposits', () => {
      const account = new BankAccount(accountId, userId, accountName, '100');
      account.deposit(new BigNumber('25.75'));

      expect(account.balance.toString()).toBe('125.75');
    });

    it('should throw error for zero deposit amount', () => {
      const account = new BankAccount(accountId, userId, accountName, '100');

      expect(() => {
        account.deposit(new BigNumber('0'));
      }).toThrow('Deposit amount must be positive');
    });

    it('should throw error for negative deposit amount', () => {
      const account = new BankAccount(accountId, userId, accountName, '100');

      expect(() => {
        account.deposit(new BigNumber('-50'));
      }).toThrow('Deposit amount must be positive');
    });
  });

  describe('withdraw', () => {
    it('should decrease balance by withdrawal amount', () => {
      const account = new BankAccount(accountId, userId, accountName, '100');
      account.withdraw(new BigNumber('30'));

      expect(account.balance.toString()).toBe('70');
    });

    it('should correctly handle decimal withdrawals', () => {
      const account = new BankAccount(accountId, userId, accountName, '100');
      account.withdraw(new BigNumber('25.75'));

      expect(account.balance.toString()).toBe('74.25');
    });

    it('should allow withdrawal of entire balance', () => {
      const account = new BankAccount(accountId, userId, accountName, '100');
      account.withdraw(new BigNumber('100'));

      expect(account.balance.toString()).toBe('0');
    });

    it('should throw error for zero withdrawal amount', () => {
      const account = new BankAccount(accountId, userId, accountName, '100');

      expect(() => {
        account.withdraw(new BigNumber('0'));
      }).toThrow('Withdrawal amount must be positive');
    });

    it('should throw error for negative withdrawal amount', () => {
      const account = new BankAccount(accountId, userId, accountName, '100');

      expect(() => {
        account.withdraw(new BigNumber('-50'));
      }).toThrow('Withdrawal amount must be positive');
    });

    it('should throw error for insufficient funds', () => {
      const account = new BankAccount(accountId, userId, accountName, '100');

      expect(() => {
        account.withdraw(new BigNumber('150'));
      }).toThrow('Insufficient funds for withdrawal');
    });
  });

  describe('complex operations', () => {
    it('should handle multiple deposits and withdrawals correctly', () => {
      const account = new BankAccount(accountId, userId, accountName, '100');

      account.deposit(new BigNumber('50'));
      expect(account.balance.toString()).toBe('150');

      account.withdraw(new BigNumber('30'));
      expect(account.balance.toString()).toBe('120');

      account.deposit(new BigNumber('25.50'));
      expect(account.balance.toString()).toBe('145.5');

      account.withdraw(new BigNumber('45.50'));
      expect(account.balance.toString()).toBe('100');
    });

    it('should maintain precision with multiple operations', () => {
      const account = new BankAccount(accountId, userId, accountName, '100.25');

      account.deposit(new BigNumber('50.33'));
      account.withdraw(new BigNumber('75.58'));

      // 100.25 + 50.33 - 75.58 = 75
      expect(account.balance.toString()).toBe('75');
    });
  });
});
