import { Test, TestingModule } from '@nestjs/testing';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionType } from '../bank/entities/bank-account.entity';
import { v4 as uuidv4 } from 'uuid';

describe('TransactionService', () => {
  let service: TransactionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransactionService],
    }).compile();

    service = module.get<TransactionService>(TransactionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addTransaction', () => {
    it('should add a transaction successfully', () => {
      const transactionId = uuidv4();
      const accountId = uuidv4();

      const transactionData: CreateTransactionDto = {
        transactionId,
        accountId,
        transactionType: TransactionType.DEPOSIT,
        amount: '500.00',
        timestamp: new Date(),
        relatedAccount: undefined,
      };

      service.addTransaction(transactionData);
      const allTransactions = service.getAllTransactions();
      expect(allTransactions.length).toBe(1);
      expect(allTransactions[0].transactionId).toBe(transactionId);
      expect(allTransactions[0].amount).toBe('500.00');
    });

    it('should add multiple transactions correctly', () => {
      const transactionId1 = uuidv4();
      const transactionId2 = uuidv4();
      const accountId = uuidv4();

      const transaction1: CreateTransactionDto = {
        transactionId: transactionId1,
        accountId,
        transactionType: TransactionType.DEPOSIT,
        amount: '500.00',
        timestamp: new Date(),
      };

      const transaction2: CreateTransactionDto = {
        transactionId: transactionId2,
        accountId,
        transactionType: TransactionType.WITHDRAWAL,
        amount: '200.00',
        timestamp: new Date(),
      };

      service.addTransaction(transaction1);
      service.addTransaction(transaction2);

      const allTransactions = service.getAllTransactions();
      expect(allTransactions.length).toBe(2);
    });

    it('should preserve all transaction properties', () => {
      const now = new Date();
      const transactionId = uuidv4();
      const accountId = uuidv4();
      const relatedAccountId = uuidv4();

      const transactionData: CreateTransactionDto = {
        transactionId,
        accountId,
        transactionType: TransactionType.TRANSFER_OUT,
        amount: '123.45',
        timestamp: now,
        relatedAccount: relatedAccountId,
      };

      service.addTransaction(transactionData);
      const savedTransaction = service.getAllTransactions()[0];

      expect(savedTransaction.transactionId).toBe(transactionId);
      expect(savedTransaction.accountId).toBe(accountId);
      expect(savedTransaction.transactionType).toBe(
        TransactionType.TRANSFER_OUT,
      );
      expect(savedTransaction.amount).toBe('123.45');
      expect(savedTransaction.timestamp).toBe(now);
      expect(savedTransaction.relatedAccount).toBe(relatedAccountId);
    });
  });

  describe('getAllTransactions', () => {
    it('should return an empty array when no transactions exist', () => {
      const transactions = service.getAllTransactions();
      expect(transactions).toEqual([]);
    });

    it('should return all added transactions', () => {
      const transactionId1 = uuidv4();
      const transactionId2 = uuidv4();
      const accountId1 = uuidv4();
      const accountId2 = uuidv4();

      const transaction1: CreateTransactionDto = {
        transactionId: transactionId1,
        accountId: accountId1,
        transactionType: TransactionType.DEPOSIT,
        amount: '500.00',
        timestamp: new Date(),
      };

      const transaction2: CreateTransactionDto = {
        transactionId: transactionId2,
        accountId: accountId2,
        transactionType: TransactionType.WITHDRAWAL,
        amount: '200.00',
        timestamp: new Date(),
      };

      service.addTransaction(transaction1);
      service.addTransaction(transaction2);

      const allTransactions = service.getAllTransactions();
      expect(allTransactions.length).toBe(2);
      expect(allTransactions[0].transactionId).toBe(transactionId1);
      expect(allTransactions[1].transactionId).toBe(transactionId2);
    });

    it('should return a copy of the transactions array', () => {
      const transactionId = uuidv4();
      const accountId = uuidv4();

      service.addTransaction({
        transactionId,
        accountId,
        transactionType: TransactionType.DEPOSIT,
        amount: '500.00',
        timestamp: new Date(),
      });

      const transactions = service.getAllTransactions();
      const initialLength = transactions.length;

      // Modify the returned array
      transactions.pop();

      // Original data should be unchanged
      expect(service.getAllTransactions().length).toBe(initialLength);
    });
  });

  describe('getTransactionsByAccount', () => {
    it('should return only transactions for a specific account', () => {
      const accountId = uuidv4();
      const anotherAccountId = uuidv4();

      const transactionData1: CreateTransactionDto = {
        transactionId: uuidv4(),
        accountId,
        transactionType: TransactionType.DEPOSIT,
        amount: '500.00',
        timestamp: new Date(),
      };

      const transactionData2: CreateTransactionDto = {
        transactionId: uuidv4(),
        accountId: anotherAccountId,
        transactionType: TransactionType.WITHDRAWAL,
        amount: '200.00',
        timestamp: new Date(),
      };

      const transactionData3: CreateTransactionDto = {
        transactionId: uuidv4(),
        accountId,
        transactionType: TransactionType.DEPOSIT,
        amount: '300.00',
        timestamp: new Date(),
      };

      service.addTransaction(transactionData1);
      service.addTransaction(transactionData2);
      service.addTransaction(transactionData3);

      const transactionsForAccount =
        service.getTransactionsByAccount(accountId);
      expect(transactionsForAccount.length).toBe(2);
      expect(
        transactionsForAccount.find(
          (tx) => tx.transactionId === transactionData1.transactionId,
        ),
      ).toBeDefined();
      expect(
        transactionsForAccount.find(
          (tx) => tx.transactionId === transactionData3.transactionId,
        ),
      ).toBeDefined();
    });

    it('should return an empty array when no transactions exist for the account', () => {
      const nonExistentAccountId = uuidv4();
      const transactions =
        service.getTransactionsByAccount(nonExistentAccountId);
      expect(transactions).toEqual([]);
    });

    it('should handle accounts with various transaction types', () => {
      const accountId = uuidv4();
      const otherAccountId = uuidv4();

      // Add different transaction types for the same account
      const depositTx = {
        transactionId: uuidv4(),
        accountId,
        transactionType: TransactionType.DEPOSIT,
        amount: '100.00',
        timestamp: new Date(),
      };

      const withdrawalTx = {
        transactionId: uuidv4(),
        accountId,
        transactionType: TransactionType.WITHDRAWAL,
        amount: '50.00',
        timestamp: new Date(),
      };

      const transferTx = {
        transactionId: uuidv4(),
        accountId,
        transactionType: TransactionType.TRANSFER_IN,
        amount: '200.00',
        timestamp: new Date(),
        relatedAccount: otherAccountId,
      };

      service.addTransaction(depositTx);
      service.addTransaction(withdrawalTx);
      service.addTransaction(transferTx);

      const accountTransactions = service.getTransactionsByAccount(accountId);
      expect(accountTransactions.length).toBe(3);

      // Check if all transaction types are included
      const types = accountTransactions.map((tx) => tx.transactionType);
      expect(types).toContain(TransactionType.DEPOSIT);
      expect(types).toContain(TransactionType.WITHDRAWAL);
      expect(types).toContain(TransactionType.TRANSFER_IN);
    });

    it('should return transactions in the order they were added', () => {
      const accountId = uuidv4();

      const tx1 = {
        transactionId: uuidv4(),
        accountId,
        transactionType: TransactionType.DEPOSIT,
        amount: '100.00',
        timestamp: new Date(2023, 1, 1),
      };

      const tx2 = {
        transactionId: uuidv4(),
        accountId,
        transactionType: TransactionType.WITHDRAWAL,
        amount: '50.00',
        timestamp: new Date(2023, 1, 2),
      };

      const tx3 = {
        transactionId: uuidv4(),
        accountId,
        transactionType: TransactionType.DEPOSIT,
        amount: '25.00',
        timestamp: new Date(2023, 1, 3),
      };

      service.addTransaction(tx1);
      service.addTransaction(tx2);
      service.addTransaction(tx3);

      const accountTransactions = service.getTransactionsByAccount(accountId);
      expect(accountTransactions[0].transactionId).toBe(tx1.transactionId);
      expect(accountTransactions[1].transactionId).toBe(tx2.transactionId);
      expect(accountTransactions[2].transactionId).toBe(tx3.transactionId);
    });
  });

  describe('edge cases', () => {
    it('should handle transaction amounts with different decimal places', () => {
      const accountId = uuidv4();

      const tx1 = {
        transactionId: uuidv4(),
        accountId,
        transactionType: TransactionType.DEPOSIT,
        amount: '100',
        timestamp: new Date(),
      };

      const tx2 = {
        transactionId: uuidv4(),
        accountId,
        transactionType: TransactionType.DEPOSIT,
        amount: '100.5',
        timestamp: new Date(),
      };

      const tx3 = {
        transactionId: uuidv4(),
        accountId,
        transactionType: TransactionType.DEPOSIT,
        amount: '100.55',
        timestamp: new Date(),
      };

      service.addTransaction(tx1);
      service.addTransaction(tx2);
      service.addTransaction(tx3);

      const transactions = service.getAllTransactions();
      expect(transactions.length).toBe(3);
      expect(transactions[0].amount).toBe('100');
      expect(transactions[1].amount).toBe('100.5');
      expect(transactions[2].amount).toBe('100.55');
    });

    it('should handle large numbers of transactions', () => {
      const accountId = uuidv4();
      const transactionCount = 100;

      for (let i = 0; i < transactionCount; i++) {
        service.addTransaction({
          transactionId: uuidv4(),
          accountId,
          transactionType: TransactionType.DEPOSIT,
          amount: '1.00',
          timestamp: new Date(),
        });
      }

      expect(service.getAllTransactions().length).toBe(transactionCount);
      expect(service.getTransactionsByAccount(accountId).length).toBe(
        transactionCount,
      );
    });
  });
});
