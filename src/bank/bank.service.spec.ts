import { Test, TestingModule } from '@nestjs/testing';
import { BankService } from './bank.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { CreateAccountDto } from './dto/create-account.dto';
import { DepositDto } from './dto/deposit.dto';
import { WithdrawDto } from './dto/withdraw.dto';
import { TransferDto } from './dto/transfer.dto';
import { v4 as uuidv4 } from 'uuid';
import { TransactionType } from './entities/bank-account.entity';
import { TransactionService } from '../transaction/transaction.service';
import { UserService } from '../user/user.service';

describe('BankService', () => {
  let service: BankService;
  const validUserId = uuidv4();

  const mockTransactionService = {
    addTransaction: jest.fn(),
    getTransactionsByAccount: jest.fn().mockReturnValue([]),
  };

  const mockUserService = {
    getUser: jest.fn((userId: string) => {
      if (userId === validUserId) {
        return {
          userId: validUserId,
          name: 'Test User',
          email: 'test@example.com',
          createdAt: new Date(),
        };
      } else {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BankService,
        {
          provide: TransactionService,
          useValue: mockTransactionService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    service = module.get<BankService>(BankService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAccount', () => {
    it('should create a new account with valid data', () => {
      const createAccountDto: CreateAccountDto = {
        ownerUserId: validUserId,
        name: 'Savings',
        startingBalance: '1000.00',
      };

      const account = service.createAccount(createAccountDto);
      expect(account).toBeDefined();
      expect(account.ownerUserId).toBe(validUserId);
      expect(account.name).toBe('Savings');
      expect(account.balance.toString()).toBe('1000');
      expect(account.accountId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );

      // Expect that transactionService.addTransaction was called for initial deposit
      expect(mockTransactionService.addTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: account.accountId,
          transactionType: TransactionType.INITIAL_DEPOSIT,
          amount: '1000.00',
        }),
      );
    });

    it('should throw an error if user does not exist', () => {
      const nonExistentUserId = uuidv4();
      const createAccountDto: CreateAccountDto = {
        ownerUserId: nonExistentUserId,
        name: 'Savings',
        startingBalance: '500.00',
      };

      expect(() => service.createAccount(createAccountDto)).toThrow(
        HttpException,
      );
      expect(mockUserService.getUser).toHaveBeenCalledWith(nonExistentUserId);
    });

    it('should not allow duplicate account names for the same user', () => {
      const createAccountDto: CreateAccountDto = {
        ownerUserId: validUserId,
        name: 'Checking',
        startingBalance: '1000.00',
      };

      service.createAccount(createAccountDto);
      expect(() => service.createAccount(createAccountDto)).toThrow(
        HttpException,
      );
      expect(() => service.createAccount(createAccountDto)).toThrow(
        /User already has an account/,
      );
    });

    it('should allow different users to create accounts with the same name', () => {
      const secondValidUserId = uuidv4();

      // Mock the user service to recognize the second user ID too
      mockUserService.getUser.mockImplementation((userId: string) => {
        if (userId === validUserId || userId === secondValidUserId) {
          return {
            userId: userId,
            name: 'Test User',
            email: 'test@example.com',
            createdAt: new Date(),
          };
        } else {
          throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }
      });

      const createAccountDto1: CreateAccountDto = {
        ownerUserId: validUserId,
        name: 'Savings',
        startingBalance: '1000.00',
      };

      const createAccountDto2: CreateAccountDto = {
        ownerUserId: secondValidUserId,
        name: 'Savings',
        startingBalance: '2000.00',
      };

      const account1 = service.createAccount(createAccountDto1);
      const account2 = service.createAccount(createAccountDto2);

      expect(account1.accountId).not.toBe(account2.accountId);
      expect(account1.ownerUserId).toBe(validUserId);
      expect(account2.ownerUserId).toBe(secondValidUserId);
      expect(account1.name).toBe('Savings');
      expect(account2.name).toBe('Savings');
    });

    it('should create an account with zero starting balance', () => {
      const createAccountDto: CreateAccountDto = {
        ownerUserId: validUserId,
        name: 'Zero Balance',
        startingBalance: '0',
      };

      const account = service.createAccount(createAccountDto);
      expect(account.balance.toString()).toBe('0');
      expect(mockTransactionService.addTransaction).not.toHaveBeenCalled();
    });

    it('should handle different decimal places in starting balance', () => {
      // Test with whole number
      const account1 = service.createAccount({
        ownerUserId: validUserId,
        name: 'Account1',
        startingBalance: '100',
      });
      expect(account1.balance.toString()).toBe('100');

      // Test with one decimal place
      const account2 = service.createAccount({
        ownerUserId: validUserId,
        name: 'Account2',
        startingBalance: '200.5',
      });
      expect(account2.balance.toString()).toBe('200.5');

      // Test with two decimal places
      const account3 = service.createAccount({
        ownerUserId: validUserId,
        name: 'Account3',
        startingBalance: '300.75',
      });
      expect(account3.balance.toString()).toBe('300.75');
    });
  });

  describe('getAccount', () => {
    it('should return an account when given a valid accountId', () => {
      const createAccountDto: CreateAccountDto = {
        ownerUserId: validUserId,
        name: 'Checking',
        startingBalance: '500.00',
      };
      const account = service.createAccount(createAccountDto);
      const fetchedAccount = service.getAccount(account.accountId);
      expect(fetchedAccount).toEqual(account);
    });

    it('should throw an error if account is not found', () => {
      const nonExistentAccountId = uuidv4();
      expect(() => service.getAccount(nonExistentAccountId)).toThrow(
        HttpException,
      );
      expect(() => service.getAccount(nonExistentAccountId)).toThrow(
        'Account not found',
      );

      try {
        service.getAccount(nonExistentAccountId);
      } catch (e) {
        expect(e.status).toBe(HttpStatus.NOT_FOUND);
      }
    });
  });

  describe('deposit', () => {
    it('should deposit money and update the account balance', () => {
      // Create an account and save it in the service
      const createAccountDto: CreateAccountDto = {
        ownerUserId: validUserId,
        name: 'DepositTest',
        startingBalance: '1000.00',
      };
      const account = service.createAccount(createAccountDto);

      // Clear mocks to start fresh for deposit test
      jest.clearAllMocks();

      const depositDto: DepositDto = {
        userId: validUserId,
        amount: '200.50',
      };

      const updatedAccount = service.deposit(account.accountId, depositDto);
      expect(updatedAccount.balance.toString()).toBe('1200.5');

      // Check that transactionService.addTransaction was called correctly
      expect(mockTransactionService.addTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: account.accountId,
          transactionType: TransactionType.DEPOSIT,
          amount: '200.50',
        }),
      );
    });

    it('should throw an error for negative deposit amount', () => {
      const createAccountDto: CreateAccountDto = {
        ownerUserId: validUserId,
        name: 'NegativeDepositTest',
        startingBalance: '1000.00',
      };
      const account = service.createAccount(createAccountDto);

      const depositDto: DepositDto = {
        userId: validUserId,
        amount: '-50.00',
      };

      expect(() => service.deposit(account.accountId, depositDto)).toThrow(
        HttpException,
      );
      expect(() => service.deposit(account.accountId, depositDto)).toThrow(
        'Deposit amount must be positive',
      );
    });

    it('should throw an error for unauthorized deposit', () => {
      const createAccountDto: CreateAccountDto = {
        ownerUserId: validUserId,
        name: 'AuthDepositTest',
        startingBalance: '1000.00',
      };
      const account = service.createAccount(createAccountDto);

      const unauthorizedUserId = uuidv4();
      const depositDto: DepositDto = {
        userId: unauthorizedUserId,
        amount: '200.00',
      };

      expect(() => service.deposit(account.accountId, depositDto)).toThrow(
        HttpException,
      );
      expect(() => service.deposit(account.accountId, depositDto)).toThrow(
        'Unauthorized access to deposit',
      );
    });
  });

  describe('withdraw', () => {
    it('should withdraw money if sufficient funds are available', () => {
      const createAccountDto: CreateAccountDto = {
        ownerUserId: validUserId,
        name: 'WithdrawTest',
        startingBalance: '1000.00',
      };
      const account = service.createAccount(createAccountDto);

      // Clear mocks to start fresh for withdraw test
      jest.clearAllMocks();

      const withdrawDto: WithdrawDto = {
        userId: validUserId,
        amount: '300.00',
      };

      const updatedAccount = service.withdraw(account.accountId, withdrawDto);
      expect(updatedAccount.balance.toString()).toBe('700');

      // Check that transactionService.addTransaction was called correctly
      expect(mockTransactionService.addTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: account.accountId,
          transactionType: TransactionType.WITHDRAWAL,
          amount: '300.00',
        }),
      );
    });

    it('should throw an error when withdrawing more than the available balance', () => {
      const createAccountDto: CreateAccountDto = {
        ownerUserId: validUserId,
        name: 'OverdraftTest',
        startingBalance: '500.00',
      };
      const account = service.createAccount(createAccountDto);

      const withdrawDto: WithdrawDto = {
        userId: validUserId,
        amount: '600.00',
      };

      expect(() => service.withdraw(account.accountId, withdrawDto)).toThrow(
        HttpException,
      );
      expect(() => service.withdraw(account.accountId, withdrawDto)).toThrow(
        /Insufficient funds/,
      );
    });

    it('should throw an error for negative withdrawal amount', () => {
      const createAccountDto: CreateAccountDto = {
        ownerUserId: validUserId,
        name: 'NegativeWithdrawTest',
        startingBalance: '1000.00',
      };
      const account = service.createAccount(createAccountDto);

      const withdrawDto: WithdrawDto = {
        userId: validUserId,
        amount: '-50.00',
      };

      expect(() => service.withdraw(account.accountId, withdrawDto)).toThrow(
        HttpException,
      );
      expect(() => service.withdraw(account.accountId, withdrawDto)).toThrow(
        'Withdrawal amount must be positive',
      );
    });

    it('should throw an error for unauthorized withdrawal', () => {
      const createAccountDto: CreateAccountDto = {
        ownerUserId: validUserId,
        name: 'AuthWithdrawTest',
        startingBalance: '1000.00',
      };
      const account = service.createAccount(createAccountDto);

      const unauthorizedUserId = uuidv4();
      const withdrawDto: WithdrawDto = {
        userId: unauthorizedUserId,
        amount: '200.00',
      };

      expect(() => service.withdraw(account.accountId, withdrawDto)).toThrow(
        HttpException,
      );
      expect(() => service.withdraw(account.accountId, withdrawDto)).toThrow(
        'Unauthorized access to withdraw',
      );
    });
  });

  describe('transfer', () => {
    it('should transfer money between two accounts', () => {
      // Create two accounts for the same user
      const account1Dto: CreateAccountDto = {
        ownerUserId: validUserId,
        name: 'Source',
        startingBalance: '1000.00',
      };
      const account2Dto: CreateAccountDto = {
        ownerUserId: validUserId,
        name: 'Destination',
        startingBalance: '500.00',
      };

      const sourceAccount = service.createAccount(account1Dto);
      const destinationAccount = service.createAccount(account2Dto);

      // Clear mocks to start fresh for transfer test
      jest.clearAllMocks();

      const transferDto: TransferDto = {
        userId: validUserId,
        fromAccountId: sourceAccount.accountId,
        toAccountId: destinationAccount.accountId,
        amount: '300.00',
      };

      const { fromAccount, toAccount } = service.transfer(transferDto);
      expect(fromAccount.balance.toString()).toBe('700');
      expect(toAccount.balance.toString()).toBe('800');

      // Check that transactionService.addTransaction was called twice with correct data
      expect(mockTransactionService.addTransaction).toHaveBeenCalledTimes(2);
      expect(mockTransactionService.addTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: sourceAccount.accountId,
          transactionType: TransactionType.TRANSFER_OUT,
          amount: '300.00',
          relatedAccount: destinationAccount.accountId,
        }),
      );
      expect(mockTransactionService.addTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          accountId: destinationAccount.accountId,
          transactionType: TransactionType.TRANSFER_IN,
          amount: '300.00',
          relatedAccount: sourceAccount.accountId,
        }),
      );
    });

    it('should throw an error for negative transfer amount', () => {
      const account1Dto: CreateAccountDto = {
        ownerUserId: validUserId,
        name: 'Source',
        startingBalance: '1000.00',
      };
      const account2Dto: CreateAccountDto = {
        ownerUserId: validUserId,
        name: 'Destination',
        startingBalance: '500.00',
      };

      const sourceAccount = service.createAccount(account1Dto);
      const destinationAccount = service.createAccount(account2Dto);

      const transferDto: TransferDto = {
        userId: validUserId,
        fromAccountId: sourceAccount.accountId,
        toAccountId: destinationAccount.accountId,
        amount: '-100.00',
      };

      expect(() => service.transfer(transferDto)).toThrow(HttpException);
      expect(() => service.transfer(transferDto)).toThrow(
        'Transfer amount must be positive',
      );
    });

    it('should throw an error when source account has insufficient funds', () => {
      const account1Dto: CreateAccountDto = {
        ownerUserId: validUserId,
        name: 'LowBalanceSource',
        startingBalance: '200.00',
      };
      const account2Dto: CreateAccountDto = {
        ownerUserId: validUserId,
        name: 'Destination',
        startingBalance: '500.00',
      };

      const sourceAccount = service.createAccount(account1Dto);
      const destinationAccount = service.createAccount(account2Dto);

      const transferDto: TransferDto = {
        userId: validUserId,
        fromAccountId: sourceAccount.accountId,
        toAccountId: destinationAccount.accountId,
        amount: '300.00',
      };

      expect(() => service.transfer(transferDto)).toThrow(HttpException);
      expect(() => service.transfer(transferDto)).toThrow(/Insufficient funds/);
    });

    it('should throw an error if source account does not exist', () => {
      const destinationDto: CreateAccountDto = {
        ownerUserId: validUserId,
        name: 'Destination',
        startingBalance: '500.00',
      };

      const destinationAccount = service.createAccount(destinationDto);
      const nonExistentAccountId = uuidv4();

      const transferDto: TransferDto = {
        userId: validUserId,
        fromAccountId: nonExistentAccountId,
        toAccountId: destinationAccount.accountId,
        amount: '100.00',
      };

      expect(() => service.transfer(transferDto)).toThrow(HttpException);
      expect(() => service.transfer(transferDto)).toThrow('Account not found');
    });

    it('should throw an error if destination account does not exist', () => {
      const sourceDto: CreateAccountDto = {
        ownerUserId: validUserId,
        name: 'Source',
        startingBalance: '500.00',
      };

      const sourceAccount = service.createAccount(sourceDto);
      const nonExistentAccountId = uuidv4();

      const transferDto: TransferDto = {
        userId: validUserId,
        fromAccountId: sourceAccount.accountId,
        toAccountId: nonExistentAccountId,
        amount: '100.00',
      };

      expect(() => service.transfer(transferDto)).toThrow(HttpException);
      expect(() => service.transfer(transferDto)).toThrow('Account not found');
    });

    it('should throw an error for unauthorized transfer (different user)', () => {
      const account1Dto: CreateAccountDto = {
        ownerUserId: validUserId,
        name: 'Source',
        startingBalance: '1000.00',
      };
      const account2Dto: CreateAccountDto = {
        ownerUserId: validUserId,
        name: 'Destination',
        startingBalance: '500.00',
      };

      const sourceAccount = service.createAccount(account1Dto);
      const destinationAccount = service.createAccount(account2Dto);

      const unauthorizedUserId = uuidv4();
      const transferDto: TransferDto = {
        userId: unauthorizedUserId,
        fromAccountId: sourceAccount.accountId,
        toAccountId: destinationAccount.accountId,
        amount: '300.00',
      };

      expect(() => service.transfer(transferDto)).toThrow(HttpException);
      expect(() => service.transfer(transferDto)).toThrow(
        'Unauthorized access to transfer from this account',
      );
    });
  });

  describe('getTransactionHistory', () => {
    it('should return transaction history for an account', () => {
      const accountId = uuidv4();
      const mockTransactions = [
        {
          transactionId: uuidv4(),
          accountId,
          amount: '100.00',
          transactionType: TransactionType.DEPOSIT,
        },
        {
          transactionId: uuidv4(),
          accountId,
          amount: '50.00',
          transactionType: TransactionType.WITHDRAWAL,
        },
      ];

      // Configure mock to return specific transactions for this test
      mockTransactionService.getTransactionsByAccount.mockReturnValueOnce(
        mockTransactions,
      );

      const history = service.getTransactionHistory(accountId);
      expect(history).toEqual(mockTransactions);
      expect(
        mockTransactionService.getTransactionsByAccount,
      ).toHaveBeenCalledWith(accountId);
    });
  });

  describe('getAccountsByUserId', () => {
    it('should return all accounts for a given user', () => {
      // Create multiple accounts for the same user
      const account1Dto: CreateAccountDto = {
        ownerUserId: validUserId,
        name: 'Account1',
        startingBalance: '1000.00',
      };
      const account2Dto: CreateAccountDto = {
        ownerUserId: validUserId,
        name: 'Account2',
        startingBalance: '2000.00',
      };

      const account1 = service.createAccount(account1Dto);
      const account2 = service.createAccount(account2Dto);

      const userAccounts = service.getAccountsByUserId(validUserId);
      expect(userAccounts.length).toBe(2);
      expect(userAccounts.map((a) => a.accountId)).toContain(
        account1.accountId,
      );
      expect(userAccounts.map((a) => a.accountId)).toContain(
        account2.accountId,
      );
      expect(userAccounts.map((a) => a.name)).toEqual(
        expect.arrayContaining(['Account1', 'Account2']),
      );
    });

    it('should return an empty array if the user has no accounts', () => {
      const userWithNoAccounts = uuidv4();
      const userAccounts = service.getAccountsByUserId(userWithNoAccounts);
      expect(userAccounts).toEqual([]);
    });

    it('should not return accounts belonging to other users', () => {
      // Create account for our valid user
      const account1 = service.createAccount({
        ownerUserId: validUserId,
        name: 'MyAccount',
        startingBalance: '1000.00',
      });

      // Create a second user and mock the userService
      const otherUserId = uuidv4();
      mockUserService.getUser.mockImplementation((userId: string) => {
        if (userId === validUserId || userId === otherUserId) {
          return {
            userId: userId,
            name: 'Test User',
            email: 'test@example.com',
            createdAt: new Date(),
          };
        } else {
          throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }
      });

      // Create account for the other user
      const account2 = service.createAccount({
        ownerUserId: otherUserId,
        name: 'OtherAccount',
        startingBalance: '2000.00',
      });

      // Check that each user only sees their own accounts
      const user1Accounts = service.getAccountsByUserId(validUserId);
      expect(user1Accounts.length).toBe(1);
      expect(user1Accounts[0].accountId).toBe(account1.accountId);

      const user2Accounts = service.getAccountsByUserId(otherUserId);
      expect(user2Accounts.length).toBe(1);
      expect(user2Accounts[0].accountId).toBe(account2.accountId);
    });
  });
});
