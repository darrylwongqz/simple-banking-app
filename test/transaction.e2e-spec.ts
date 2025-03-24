import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { setupTestApp } from './test-utils';

describe('TransactionController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await setupTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Transaction API Endpoints', () => {
    it('GET /transactions - Should return an array (may be empty at first)', async () => {
      const response = await request(app.getHttpServer())
        .get('/transactions')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      // Transactions might be empty before other tests run
    });

    it('GET /transactions - Should return transactions in the expected format if present', async () => {
      const response = await request(app.getHttpServer())
        .get('/transactions')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      if (response.body.length > 0) {
        const transaction = response.body[0];

        // Test that amount is a string with 2 decimal places
        expect(typeof transaction.amount).toBe('string');
        expect(transaction.amount).toMatch(/^\d+\.\d{2}$/);

        // Verify timestamp is a valid date
        expect(() => new Date(transaction.timestamp)).not.toThrow();
        const date = new Date(transaction.timestamp);
        expect(date instanceof Date).toBe(true);
        expect(date.getTime()).not.toBeNaN();
      }
    });
  });
});
