import { Test, TestingModule } from '@nestjs/testing';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { Transaction } from './entities/transaction.entity';
import { v4 as uuidv4 } from 'uuid';
import { TransactionType } from '../bank/entities/bank-account.entity';

describe('TransactionController', () => {
  let controller: TransactionController;
  let transactionService: TransactionService;

  // Create some mock transactions for testing
  const mockAccountId = uuidv4();
  const mockAccountId2 = uuidv4();

  const mockTransactions: Transaction[] = [
    new Transaction(
      uuidv4(),
      mockAccountId,
      TransactionType.DEPOSIT,
      '500.00',
      new Date(Date.now() - 3600000), // 1 hour ago
    ),
    new Transaction(
      uuidv4(),
      mockAccountId,
      TransactionType.WITHDRAWAL,
      '100.00',
      new Date(Date.now() - 1800000), // 30 minutes ago
    ),
    new Transaction(
      uuidv4(),
      mockAccountId2,
      TransactionType.DEPOSIT,
      '750.00',
      new Date(Date.now() - 7200000), // 2 hours ago
    ),
    new Transaction(
      uuidv4(),
      mockAccountId,
      TransactionType.TRANSFER_OUT,
      '250.00',
      new Date(Date.now() - 900000), // 15 minutes ago
      mockAccountId2,
    ),
  ];

  // Mock TransactionService
  const mockTransactionService = {
    getAllTransactions: jest.fn().mockReturnValue(mockTransactions),
    getTransactionsByAccount: jest
      .fn()
      .mockImplementation((accountId: string) => {
        return mockTransactions.filter((tx) => tx.accountId === accountId);
      }),
    addTransaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionController],
      providers: [
        {
          provide: TransactionService,
          useValue: mockTransactionService,
        },
      ],
    }).compile();

    controller = module.get<TransactionController>(TransactionController);
    transactionService = module.get<TransactionService>(TransactionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(transactionService).toBeDefined();
  });

  describe('getTransactions', () => {
    it('should return all transactions', () => {
      const result = controller.getTransactions();

      expect(transactionService.getAllTransactions).toHaveBeenCalled();
      expect(result).toEqual(mockTransactions);
      expect(result.length).toBe(4);
    });

    it('should return transactions sorted by timestamp if implemented in service', () => {
      // Update mock to return sorted transactions
      const sortedTransactions = [...mockTransactions].sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
      );

      jest
        .spyOn(transactionService, 'getAllTransactions')
        .mockReturnValueOnce(sortedTransactions);

      const result = controller.getTransactions();

      expect(transactionService.getAllTransactions).toHaveBeenCalled();
      expect(result).toEqual(sortedTransactions);

      // Verify time-based ordering (most recent first)
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].timestamp.getTime()).toBeGreaterThanOrEqual(
          result[i + 1].timestamp.getTime(),
        );
      }
    });

    it('should return empty array when no transactions exist', () => {
      jest
        .spyOn(transactionService, 'getAllTransactions')
        .mockReturnValueOnce([]);

      const result = controller.getTransactions();

      expect(transactionService.getAllTransactions).toHaveBeenCalled();
      expect(result).toEqual([]);
      expect(result.length).toBe(0);
    });
  });
});
