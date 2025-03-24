import { Test, TestingModule } from '@nestjs/testing';
import { BankController } from './bank.controller';
import { BankService } from './bank.service';
import {
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateAccountDto } from './dto/create-account.dto';
import { DepositDto } from './dto/deposit.dto';
import { WithdrawDto } from './dto/withdraw.dto';
import { TransferDto } from './dto/transfer.dto';
import { v4 as uuidv4 } from 'uuid';
import BigNumber from 'bignumber.js';
import { TransactionType } from './entities/bank-account.entity';

describe('BankController', () => {
  let controller: BankController;
  let bankService: BankService;

  // Create mock user and account IDs
  const mockUserId = uuidv4();
  const mockAccountId = uuidv4();
  const mockAccount2Id = uuidv4();

  // Create a mock bank account
  const mockAccount = {
    accountId: mockAccountId,
    ownerUserId: mockUserId,
    name: 'Test Account',
    balance: new BigNumber('1000.00'),
    createdAt: new Date(),
  };

  // Create a second mock account for transfers
  const mockAccount2 = {
    accountId: mockAccount2Id,
    ownerUserId: mockUserId,
    name: 'Secondary Account',
    balance: new BigNumber('500.00'),
    createdAt: new Date(),
  };

  // Create mock transactions
  const mockTransactions = [
    {
      transactionId: uuidv4(),
      accountId: mockAccountId,
      transactionType: TransactionType.DEPOSIT,
      amount: '100.00',
      timestamp: new Date(),
    },
    {
      transactionId: uuidv4(),
      accountId: mockAccountId,
      transactionType: TransactionType.WITHDRAWAL,
      amount: '50.00',
      timestamp: new Date(),
    },
  ];

  // Mock BankService with implementations
  const mockBankService = {
    createAccount: jest.fn().mockImplementation((dto) => {
      if (dto.name === 'Existing Account' && dto.ownerUserId === mockUserId) {
        throw new HttpException(
          `User already has an account with the name "${dto.name}"`,
          HttpStatus.BAD_REQUEST,
        );
      }
      return {
        accountId: uuidv4(),
        ownerUserId: dto.ownerUserId,
        name: dto.name,
        balance: new BigNumber(dto.startingBalance),
        createdAt: new Date(),
      };
    }),
    getAccount: jest.fn().mockImplementation((accountId) => {
      if (accountId === mockAccountId) {
        return mockAccount;
      }
      if (accountId === mockAccount2Id) {
        return mockAccount2;
      }
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
    }),
    getAccountsByUserId: jest.fn().mockImplementation((userId) => {
      if (userId === mockUserId) {
        return [mockAccount, mockAccount2];
      }
      return [];
    }),
    getTransactionHistory: jest.fn().mockImplementation((accountId) => {
      if (accountId === mockAccountId) {
        return mockTransactions;
      }
      return [];
    }),
    deposit: jest.fn().mockImplementation((accountId, depositDto) => {
      if (accountId === mockAccountId) {
        if (depositDto.userId !== mockUserId) {
          throw new HttpException(
            'Unauthorized access to deposit',
            HttpStatus.UNAUTHORIZED,
          );
        }
        // Return a clone of mockAccount with updated balance
        return {
          ...mockAccount,
          balance: mockAccount.balance.plus(depositDto.amount),
        };
      }
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
    }),
    withdraw: jest.fn().mockImplementation((accountId, withdrawDto) => {
      if (accountId === mockAccountId) {
        if (withdrawDto.userId !== mockUserId) {
          throw new HttpException(
            'Unauthorized access to withdraw',
            HttpStatus.UNAUTHORIZED,
          );
        }
        const amount = new BigNumber(withdrawDto.amount);
        if (mockAccount.balance.lt(amount)) {
          throw new HttpException(
            'Insufficient funds for withdrawal',
            HttpStatus.BAD_REQUEST,
          );
        }
        // Return a clone of mockAccount with updated balance
        return {
          ...mockAccount,
          balance: mockAccount.balance.minus(withdrawDto.amount),
        };
      }
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
    }),
    transfer: jest.fn().mockImplementation((transferDto) => {
      if (
        transferDto.fromAccountId === mockAccountId &&
        transferDto.toAccountId === mockAccount2Id
      ) {
        if (transferDto.userId !== mockUserId) {
          throw new HttpException(
            'Unauthorized access to transfer from this account',
            HttpStatus.UNAUTHORIZED,
          );
        }
        const amount = new BigNumber(transferDto.amount);
        if (mockAccount.balance.lt(amount)) {
          throw new HttpException(
            'Insufficient funds for transfer',
            HttpStatus.BAD_REQUEST,
          );
        }
        // Return clones of accounts with updated balances
        return {
          fromAccount: {
            ...mockAccount,
            balance: mockAccount.balance.minus(transferDto.amount),
          },
          toAccount: {
            ...mockAccount2,
            balance: mockAccount2.balance.plus(transferDto.amount),
          },
        };
      }
      throw new HttpException('Account not found', HttpStatus.NOT_FOUND);
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BankController],
      providers: [
        {
          provide: BankService,
          useValue: mockBankService,
        },
      ],
    }).compile();

    controller = module.get<BankController>(BankController);
    bankService = module.get<BankService>(BankService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(bankService).toBeDefined();
  });

  describe('createAccount', () => {
    it('should create a new account and return success message', () => {
      const createAccountDto: CreateAccountDto = {
        ownerUserId: mockUserId,
        name: 'New Account',
        startingBalance: '1000.00',
      };

      const result = controller.createAccount(createAccountDto);

      expect(bankService.createAccount).toHaveBeenCalledWith(createAccountDto);
      expect(result.message).toBe('Account created');
      expect(result.account).toBeDefined();
      expect(result.account.name).toBe('New Account');
      expect(result.account.ownerUserId).toBe(mockUserId);
      expect(result.account.balance).toBe('1000.00'); // Should be formatted as string with 2 decimal places
    });

    it('should throw an error if user already has an account with the same name', () => {
      const createAccountDto: CreateAccountDto = {
        ownerUserId: mockUserId,
        name: 'Existing Account',
        startingBalance: '1000.00',
      };

      expect(() => controller.createAccount(createAccountDto)).toThrow(
        HttpException,
      );
      expect(() => controller.createAccount(createAccountDto)).toThrow(
        'User already has an account',
      );
      expect(bankService.createAccount).toHaveBeenCalledWith(createAccountDto);
    });
  });

  describe('getAccount', () => {
    it('should return account details by ID', () => {
      const result = controller.getAccount(mockAccountId);

      expect(bankService.getAccount).toHaveBeenCalledWith(mockAccountId);
      expect(result.accountId).toBe(mockAccountId);
      expect(result.ownerUserId).toBe(mockUserId);
      expect(result.name).toBe('Test Account');
      expect(result.balance).toBe('1000.00'); // Should be formatted as string with 2 decimal places
    });

    it('should throw an error if account does not exist', () => {
      const nonExistentId = uuidv4();

      expect(() => controller.getAccount(nonExistentId)).toThrow(HttpException);
      expect(bankService.getAccount).toHaveBeenCalledWith(nonExistentId);
    });
  });

  describe('getAccountsByUser', () => {
    it('should return a list of accounts for a user', () => {
      const result = controller.getAccountsByUser(mockUserId);

      expect(bankService.getAccountsByUserId).toHaveBeenCalledWith(mockUserId);
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(2);
      expect(result[0].accountId).toBe(mockAccountId);
      expect(result[0].balance).toBe('1000.00');
      expect(result[1].accountId).toBe(mockAccount2Id);
      expect(result[1].balance).toBe('500.00');
    });

    it('should return an empty array if user has no accounts', () => {
      const userId = uuidv4();

      const result = controller.getAccountsByUser(userId);

      expect(bankService.getAccountsByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual([]);
    });
  });

  describe('getAccountTransactions', () => {
    it('should return transaction history for the account owner', () => {
      const result = controller.getAccountTransactions(
        mockAccountId,
        mockUserId,
      );

      expect(bankService.getAccount).toHaveBeenCalledWith(mockAccountId);
      expect(bankService.getTransactionHistory).toHaveBeenCalledWith(
        mockAccountId,
      );
      expect(result).toEqual(mockTransactions);
    });

    it('should throw UnauthorizedException if user is not the account owner', () => {
      const differentUserId = uuidv4();

      expect(() =>
        controller.getAccountTransactions(mockAccountId, differentUserId),
      ).toThrow(UnauthorizedException);
      expect(bankService.getAccount).toHaveBeenCalledWith(mockAccountId);
      expect(bankService.getTransactionHistory).not.toHaveBeenCalled();
    });

    it('should throw an error if account does not exist', () => {
      const nonExistentId = uuidv4();

      expect(() =>
        controller.getAccountTransactions(nonExistentId, mockUserId),
      ).toThrow(HttpException);
      expect(bankService.getAccount).toHaveBeenCalledWith(nonExistentId);
    });
  });

  describe('deposit', () => {
    it('should deposit money and return updated account', () => {
      const depositDto: DepositDto = {
        userId: mockUserId,
        amount: '200.50',
      };

      const result = controller.deposit(mockAccountId, depositDto);

      expect(bankService.deposit).toHaveBeenCalledWith(
        mockAccountId,
        depositDto,
      );
      expect(result.message).toBe('Deposit successful');
      expect(result.account.balance).toBe('1200.50'); // 1000 + 200.50 = 1200.50
    });

    it('should throw an error if unauthorized', () => {
      const depositDto: DepositDto = {
        userId: uuidv4(), // Different user ID
        amount: '200.00',
      };

      expect(() => controller.deposit(mockAccountId, depositDto)).toThrow(
        HttpException,
      );
      expect(bankService.deposit).toHaveBeenCalledWith(
        mockAccountId,
        depositDto,
      );
    });

    it('should throw an error if account does not exist', () => {
      const nonExistentId = uuidv4();
      const depositDto: DepositDto = {
        userId: mockUserId,
        amount: '200.00',
      };

      expect(() => controller.deposit(nonExistentId, depositDto)).toThrow(
        HttpException,
      );
      expect(bankService.deposit).toHaveBeenCalledWith(
        nonExistentId,
        depositDto,
      );
    });
  });

  describe('withdraw', () => {
    it('should withdraw money and return updated account', () => {
      const withdrawDto: WithdrawDto = {
        userId: mockUserId,
        amount: '300.00',
      };

      const result = controller.withdraw(mockAccountId, withdrawDto);

      expect(bankService.withdraw).toHaveBeenCalledWith(
        mockAccountId,
        withdrawDto,
      );
      expect(result.message).toBe('Withdrawal successful');
      expect(result.account.balance).toBe('700.00'); // 1000 - 300 = 700
    });

    it('should throw an error if insufficient funds', () => {
      const withdrawDto: WithdrawDto = {
        userId: mockUserId,
        amount: '1500.00', // More than account balance
      };

      mockBankService.withdraw.mockImplementationOnce(() => {
        throw new HttpException(
          'Insufficient funds for withdrawal',
          HttpStatus.BAD_REQUEST,
        );
      });

      expect(() => controller.withdraw(mockAccountId, withdrawDto)).toThrow(
        HttpException,
      );
      expect(() => controller.withdraw(mockAccountId, withdrawDto)).toThrow(
        'Insufficient funds',
      );
      expect(bankService.withdraw).toHaveBeenCalledWith(
        mockAccountId,
        withdrawDto,
      );
    });

    it('should throw an error if unauthorized', () => {
      const withdrawDto: WithdrawDto = {
        userId: uuidv4(), // Different user ID
        amount: '200.00',
      };

      expect(() => controller.withdraw(mockAccountId, withdrawDto)).toThrow(
        HttpException,
      );
      expect(bankService.withdraw).toHaveBeenCalledWith(
        mockAccountId,
        withdrawDto,
      );
    });

    it('should throw an error if account does not exist', () => {
      const nonExistentId = uuidv4();
      const withdrawDto: WithdrawDto = {
        userId: mockUserId,
        amount: '200.00',
      };

      expect(() => controller.withdraw(nonExistentId, withdrawDto)).toThrow(
        HttpException,
      );
      expect(bankService.withdraw).toHaveBeenCalledWith(
        nonExistentId,
        withdrawDto,
      );
    });
  });

  describe('transfer', () => {
    it('should transfer money between accounts and return updated accounts', () => {
      const transferDto: TransferDto = {
        userId: mockUserId,
        fromAccountId: mockAccountId,
        toAccountId: mockAccount2Id,
        amount: '250.00',
      };

      const result = controller.transfer(transferDto);

      expect(bankService.transfer).toHaveBeenCalledWith(transferDto);
      expect(result.message).toBe('Transfer successful');
      expect(result.result.fromAccount.balance).toBe('750.00'); // 1000 - 250 = 750
      expect(result.result.toAccount.balance).toBe('750.00'); // 500 + 250 = 750
    });

    it('should throw an error if insufficient funds', () => {
      const transferDto: TransferDto = {
        userId: mockUserId,
        fromAccountId: mockAccountId,
        toAccountId: mockAccount2Id,
        amount: '1500.00', // More than source account balance
      };

      mockBankService.transfer.mockImplementationOnce(() => {
        throw new HttpException(
          'Insufficient funds for transfer',
          HttpStatus.BAD_REQUEST,
        );
      });

      expect(() => controller.transfer(transferDto)).toThrow(HttpException);
      expect(() => controller.transfer(transferDto)).toThrow(
        'Insufficient funds',
      );
      expect(bankService.transfer).toHaveBeenCalledWith(transferDto);
    });

    it('should throw an error if unauthorized', () => {
      const transferDto: TransferDto = {
        userId: uuidv4(), // Different user ID
        fromAccountId: mockAccountId,
        toAccountId: mockAccount2Id,
        amount: '250.00',
      };

      expect(() => controller.transfer(transferDto)).toThrow(HttpException);
      expect(bankService.transfer).toHaveBeenCalledWith(transferDto);
    });

    it('should throw an error if account does not exist', () => {
      const nonExistentId = uuidv4();
      const transferDto: TransferDto = {
        userId: mockUserId,
        fromAccountId: nonExistentId,
        toAccountId: mockAccount2Id,
        amount: '250.00',
      };

      expect(() => controller.transfer(transferDto)).toThrow(HttpException);
      expect(bankService.transfer).toHaveBeenCalledWith(transferDto);
    });
  });
});
