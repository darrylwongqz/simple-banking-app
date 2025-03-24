import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { setupTestApp } from './test-utils';

describe('UserController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await setupTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('User API Endpoints', () => {
    it('POST /users - Create a new user', async () => {
      const testUserName = 'Test Create User';
      const testUserEmail = 'testcreate@example.com';

      const response = await request(app.getHttpServer())
        .post('/users')
        .send({
          name: testUserName,
          email: testUserEmail,
        })
        .expect(201);

      expect(response.body.message).toBe('User created');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.userId).toBeDefined();
      expect(response.body.user.name).toBe(testUserName);
      expect(response.body.user.email).toBe(testUserEmail);
    });

    it('GET /users/:userId - Get user by ID', async () => {
      // First create a user
      const testUserName = 'Test Get User';
      const testUserEmail = 'testget@example.com';

      const createResponse = await request(app.getHttpServer())
        .post('/users')
        .send({
          name: testUserName,
          email: testUserEmail,
        })
        .expect(201);

      const userId = createResponse.body.user.userId;

      // Then fetch the user by ID
      const getResponse = await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .expect(200);

      expect(getResponse.body).toBeDefined();
      expect(getResponse.body.userId).toBe(userId);
      expect(getResponse.body.name).toBe(testUserName);
      expect(getResponse.body.email).toBe(testUserEmail);
    });

    it('GET /users - Get all users', async () => {
      // Create a unique user we can look for
      const uniqueName = `Unique User ${Date.now()}`;
      const uniqueEmail = `unique${Date.now()}@example.com`;

      const createResponse = await request(app.getHttpServer())
        .post('/users')
        .send({
          name: uniqueName,
          email: uniqueEmail,
        })
        .expect(201);

      const userId = createResponse.body.user.userId;

      // Get all users and check if our user is included
      const response = await request(app.getHttpServer())
        .get('/users')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const createdUser = response.body.find((user) => user.userId === userId);
      expect(createdUser).toBeDefined();
      expect(createdUser.name).toBe(uniqueName);
      expect(createdUser.email).toBe(uniqueEmail);
    });

    it('POST /users - Should reject duplicate email', async () => {
      // Create a user with a specific email
      const testUserName = 'Test Duplicate Email';
      const testUserEmail = 'testduplicate@example.com';

      await request(app.getHttpServer())
        .post('/users')
        .send({
          name: testUserName,
          email: testUserEmail,
        })
        .expect(201);

      // Try to create another user with the same email
      const response = await request(app.getHttpServer())
        .post('/users')
        .send({
          name: 'Another User',
          email: testUserEmail, // Same email as before
        })
        .expect(400);

      expect(response.body.message).toContain('Email already exists');
      expect(response.body.statusCode).toBe(400);
    });

    it('GET /users/:userId - Should return 404 for non-existent user', async () => {
      const nonExistentId = uuidv4();
      const response = await request(app.getHttpServer())
        .get(`/users/${nonExistentId}`)
        .expect(404);

      expect(response.body.statusCode).toBe(404);
      expect(response.body.message).toContain('not found');
    });
  });
});
