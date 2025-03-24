import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { setupTestApp } from './test-utils';

describe('BankController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await setupTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Bank Account API Endpoints', () => {
    it('POST /accounts - Create a new account', async () => {
      // First create a user
      const userResponse = await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Account Owner',
          email: `account-owner-${Date.now()}@example.com`,
        })
        .expect(201);

      const userId = userResponse.body.user.userId;

      // Then create an account for that user
      const accountResponse = await request(app.getHttpServer())
        .post('/accounts')
        .send({
          name: 'Test Account',
          ownerUserId: userId,
          startingBalance: '1000.00',
        })
        .expect(201);

      expect(accountResponse.body.message).toBe('Account created');
      expect(accountResponse.body.account).toBeDefined();
      expect(accountResponse.body.account.name).toBe('Test Account');
      expect(accountResponse.body.account.ownerUserId).toBe(userId);
      expect(accountResponse.body.account.balance).toBe('1000.00');
    });

    it('GET /accounts/:accountId - Get account by ID', async () => {
      // Create a user and account first
      const userResponse = await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Get Account User',
          email: `get-account-user-${Date.now()}@example.com`,
        })
        .expect(201);

      const userId = userResponse.body.user.userId;

      const createResponse = await request(app.getHttpServer())
        .post('/accounts')
        .send({
          name: 'Account To Get',
          ownerUserId: userId,
          startingBalance: '1500.00',
        })
        .expect(201);

      const accountId = createResponse.body.account.accountId;

      // Now get the account by ID
      const getResponse = await request(app.getHttpServer())
        .get(`/accounts/${accountId}`)
        .expect(200);

      expect(getResponse.body).toBeDefined();
      expect(getResponse.body.accountId).toBe(accountId);
      expect(getResponse.body.ownerUserId).toBe(userId);
      expect(getResponse.body.name).toBe('Account To Get');
      expect(getResponse.body.balance).toBe('1500.00');
    });

    it('GET /accounts/by-user/:userId - Get accounts by user ID', async () => {
      // Create a user with multiple accounts
      const unique = Date.now().toString();
      const userResponse = await request(app.getHttpServer())
        .post('/users')
        .send({
          name: `Multi Account User ${unique}`,
          email: `multi-account-${unique}@example.com`,
        })
        .expect(201);

      const userId = userResponse.body.user.userId;

      // Create two accounts for the user
      await request(app.getHttpServer())
        .post('/accounts')
        .send({
          name: 'First Account',
          ownerUserId: userId,
          startingBalance: '1000.00',
        })
        .expect(201);

      await request(app.getHttpServer())
        .post('/accounts')
        .send({
          name: 'Second Account',
          ownerUserId: userId,
          startingBalance: '500.00',
        })
        .expect(201);

      // Now get accounts for this user
      const getResponse = await request(app.getHttpServer())
        .get(`/accounts/by-user/${userId}`)
        .expect(200);

      expect(Array.isArray(getResponse.body)).toBe(true);
      expect(getResponse.body.length).toBe(2);

      // Verify we have both accounts with correct details
      const firstAccount = getResponse.body.find(
        (a) => a.name === 'First Account',
      );
      const secondAccount = getResponse.body.find(
        (a) => a.name === 'Second Account',
      );

      expect(firstAccount).toBeDefined();
      expect(firstAccount.ownerUserId).toBe(userId);
      expect(firstAccount.balance).toBe('1000.00');

      expect(secondAccount).toBeDefined();
      expect(secondAccount.ownerUserId).toBe(userId);
      expect(secondAccount.balance).toBe('500.00');
    });

    it('POST /accounts/:accountId/deposit - Deposit money', async () => {
      // Create a user and account first
      const userResponse = await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Deposit User',
          email: `deposit-user-${Date.now()}@example.com`,
        })
        .expect(201);

      const userId = userResponse.body.user.userId;

      const createResponse = await request(app.getHttpServer())
        .post('/accounts')
        .send({
          name: 'Deposit Account',
          ownerUserId: userId,
          startingBalance: '1000.00',
        })
        .expect(201);

      const accountId = createResponse.body.account.accountId;

      // Now make a deposit
      const depositResponse = await request(app.getHttpServer())
        .post(`/accounts/${accountId}/deposit`)
        .send({
          userId: userId,
          amount: '250.00',
        })
        .expect(201);

      expect(depositResponse.body.message).toBe('Deposit successful');
      expect(depositResponse.body.account).toBeDefined();
      expect(depositResponse.body.account.accountId).toBe(accountId);
      expect(depositResponse.body.account.balance).toBe('1250.00'); // 1000 + 250
    });

    it('POST /accounts/:accountId/withdraw - Withdraw money', async () => {
      // Create a user and account first
      const userResponse = await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Withdrawal User',
          email: `withdrawal-user-${Date.now()}@example.com`,
        })
        .expect(201);

      const userId = userResponse.body.user.userId;

      const createResponse = await request(app.getHttpServer())
        .post('/accounts')
        .send({
          name: 'Withdrawal Account',
          ownerUserId: userId,
          startingBalance: '1000.00',
        })
        .expect(201);

      const accountId = createResponse.body.account.accountId;

      // Now make a withdrawal
      const withdrawResponse = await request(app.getHttpServer())
        .post(`/accounts/${accountId}/withdraw`)
        .send({
          userId: userId,
          amount: '300.00',
        })
        .expect(201);

      expect(withdrawResponse.body.message).toBe('Withdrawal successful');
      expect(withdrawResponse.body.account).toBeDefined();
      expect(withdrawResponse.body.account.accountId).toBe(accountId);
      expect(withdrawResponse.body.account.balance).toBe('700.00'); // 1000 - 300
    });

    it('POST /accounts/:accountId/withdraw - Should reject withdrawal with insufficient funds', async () => {
      // Create a user and account first
      const userResponse = await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Overdraft User',
          email: `overdraft-user-${Date.now()}@example.com`,
        })
        .expect(201);

      const userId = userResponse.body.user.userId;

      const createResponse = await request(app.getHttpServer())
        .post('/accounts')
        .send({
          name: 'Low Balance Account',
          ownerUserId: userId,
          startingBalance: '100.00',
        })
        .expect(201);

      const accountId = createResponse.body.account.accountId;

      // Try to withdraw more than available
      const withdrawResponse = await request(app.getHttpServer())
        .post(`/accounts/${accountId}/withdraw`)
        .send({
          userId: userId,
          amount: '500.00', // More than 100 balance
        })
        .expect(400);

      expect(withdrawResponse.body.message).toContain('Insufficient funds');
    });

    it('POST /accounts/transfer - Transfer money between accounts', async () => {
      // Create a user with two accounts
      const userResponse = await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Transfer User',
          email: `transfer-user-${Date.now()}@example.com`,
        })
        .expect(201);

      const userId = userResponse.body.user.userId;

      // Create source account
      const sourceResponse = await request(app.getHttpServer())
        .post('/accounts')
        .send({
          name: 'Source Account',
          ownerUserId: userId,
          startingBalance: '1000.00',
        })
        .expect(201);

      const sourceId = sourceResponse.body.account.accountId;

      // Create destination account
      const destResponse = await request(app.getHttpServer())
        .post('/accounts')
        .send({
          name: 'Destination Account',
          ownerUserId: userId,
          startingBalance: '500.00',
        })
        .expect(201);

      const destId = destResponse.body.account.accountId;

      // Now transfer money
      const transferResponse = await request(app.getHttpServer())
        .post('/accounts/transfer')
        .send({
          userId: userId,
          fromAccountId: sourceId,
          toAccountId: destId,
          amount: '300.00',
        })
        .expect(201);

      expect(transferResponse.body.message).toBe('Transfer successful');
      expect(transferResponse.body.result).toBeDefined();
      expect(transferResponse.body.result.fromAccount.accountId).toBe(sourceId);
      expect(transferResponse.body.result.fromAccount.balance).toBe('700.00'); // 1000 - 300
      expect(transferResponse.body.result.toAccount.accountId).toBe(destId);
      expect(transferResponse.body.result.toAccount.balance).toBe('800.00'); // 500 + 300
    });

    it('GET /accounts/:accountId/transactions - Get transaction history', async () => {
      // Create a user and account for transactions
      const userResponse = await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Transaction User',
          email: `transaction-user-${Date.now()}@example.com`,
        })
        .expect(201);

      const userId = userResponse.body.user.userId;

      const accountResponse = await request(app.getHttpServer())
        .post('/accounts')
        .send({
          name: 'Transaction Account',
          ownerUserId: userId,
          startingBalance: '1000.00', // This will create an INITIAL_DEPOSIT transaction
        })
        .expect(201);

      const accountId = accountResponse.body.account.accountId;

      // Make a deposit to create another transaction
      await request(app.getHttpServer())
        .post(`/accounts/${accountId}/deposit`)
        .send({
          userId: userId,
          amount: '200.00',
        })
        .expect(201);

      // Now get transactions
      const txResponse = await request(app.getHttpServer())
        .get(`/accounts/${accountId}/transactions`)
        .query({ userId: userId })
        .expect(200);

      expect(Array.isArray(txResponse.body)).toBe(true);
      expect(txResponse.body.length).toBeGreaterThanOrEqual(2); // At least initial deposit + our deposit

      // Verify transaction types
      const types = txResponse.body.map((tx) => tx.transactionType);
      expect(types).toContain('INITIAL_DEPOSIT');
      expect(types).toContain('DEPOSIT');
    });

    it('GET /accounts/:accountId - Should return 404 for non-existent account', async () => {
      const nonExistentId = uuidv4();
      const response = await request(app.getHttpServer())
        .get(`/accounts/${nonExistentId}`)
        .expect(404);

      expect(response.body.statusCode).toBe(404);
      expect(response.body.message).toContain('not found');
    });

    it('POST /accounts/transfer - Should reject transfer to the same account', async () => {
      // Create a user and account first
      const userResponse = await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Same Account User',
          email: `same-account-user-${Date.now()}@example.com`,
        })
        .expect(201);

      const userId = userResponse.body.user.userId;

      // Create an account
      const accountResponse = await request(app.getHttpServer())
        .post('/accounts')
        .send({
          name: 'Self Transfer Account',
          ownerUserId: userId,
          startingBalance: '1000.00',
        })
        .expect(201);

      const accountId = accountResponse.body.account.accountId;

      // Try to transfer to the same account
      const transferResponse = await request(app.getHttpServer())
        .post('/accounts/transfer')
        .send({
          userId: userId,
          fromAccountId: accountId,
          toAccountId: accountId, // Same account
          amount: '200.00',
        })
        .expect(400);

      expect(transferResponse.body.message).toContain(
        'Cannot transfer to the same account',
      );
    });
  });
});
