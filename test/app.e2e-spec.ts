import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { setupTestApp } from './test-utils';

describe('API Routes (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await setupTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('API Endpoints Availability', () => {
    it('GET /users - Should be available', async () => {
      await request(app.getHttpServer()).get('/users').expect(200);
    });

    it('GET /transactions - Should be available', async () => {
      await request(app.getHttpServer()).get('/transactions').expect(200);
    });

    it('GET /accounts - Should return 404 since it requires a specific account ID', async () => {
      await request(app.getHttpServer()).get('/accounts').expect(404);
    });
  });
});
