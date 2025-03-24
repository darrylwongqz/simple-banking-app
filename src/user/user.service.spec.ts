import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserService],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a user successfully', () => {
      const user = service.createUser('John Doe', 'john@example.com');
      expect(user).toBeDefined();
      expect(user.name).toBe('John Doe');
      expect(user.email).toBe('john@example.com');
      expect(user.userId).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it('should throw an error if email already exists', () => {
      service.createUser('John Doe', 'john@example.com');
      expect(() => {
        service.createUser('Jane Doe', 'john@example.com');
      }).toThrow(HttpException);
      try {
        service.createUser('Jane Doe', 'john@example.com');
      } catch (e) {
        expect(e.status).toBe(HttpStatus.BAD_REQUEST);
        expect(e.message).toBe('Email already exists');
      }
    });

    it('should create multiple users with different emails', () => {
      const user1 = service.createUser('John Doe', 'john@example.com');
      const user2 = service.createUser('Jane Doe', 'jane@example.com');

      expect(user1.userId).not.toBe(user2.userId);
      expect(user1.email).not.toBe(user2.email);
    });

    it('should handle special characters in name', () => {
      const name = "Jöhn O'Dóé-Смит";
      const user = service.createUser(name, 'special@example.com');
      expect(user.name).toBe(name);
    });

    it('should handle email addresses with subdomains and plus signs', () => {
      const email = 'test+tag@sub.domain.example.com';
      const user = service.createUser('Test User', email);
      expect(user.email).toBe(email);
    });

    it('should not be affected by case sensitivity in the same email', () => {
      service.createUser('John Doe', 'case@example.com');
      expect(() => {
        service.createUser('Jane Doe', 'CASE@example.com');
      }).toThrow(HttpException);
    });
  });

  describe('getUser', () => {
    it('should return a user by ID', () => {
      const createdUser = service.createUser('Alice', 'alice@example.com');
      const fetchedUser = service.getUser(createdUser.userId);
      expect(fetchedUser).toEqual(createdUser);
    });

    it('should throw an error if user is not found', () => {
      expect(() => service.getUser('non-existent-id')).toThrow(HttpException);
      try {
        service.getUser('non-existent-id');
      } catch (e) {
        expect(e.status).toBe(HttpStatus.NOT_FOUND);
        expect(e.message).toBe('User not found');
      }
    });

    it('should throw an error for an empty user ID', () => {
      expect(() => service.getUser('')).toThrow(HttpException);
    });

    it('should throw an error for null user ID', () => {
      expect(() => service.getUser(null)).toThrow(HttpException);
    });

    it('should throw an error for undefined user ID', () => {
      expect(() => service.getUser(undefined)).toThrow(HttpException);
    });
  });

  describe('getAllUsers', () => {
    it('should return an empty array when no users exist', () => {
      const allUsers = service.getAllUsers();
      expect(allUsers).toEqual([]);
    });

    it('should return all created users', () => {
      const user1 = service.createUser('User1', 'user1@example.com');
      const user2 = service.createUser('User2', 'user2@example.com');
      const allUsers = service.getAllUsers();
      expect(allUsers.length).toBe(2);
      expect(allUsers).toContainEqual(user1);
      expect(allUsers).toContainEqual(user2);
    });

    it('should return users in the order they were created', async () => {
      // Clear any existing users by creating a new instance of the service
      const module = await Test.createTestingModule({
        providers: [UserService],
      }).compile();
      service = module.get<UserService>(UserService);

      const user1 = service.createUser('User1', 'user1@example.com');
      const user2 = service.createUser('User2', 'user2@example.com');
      const user3 = service.createUser('User3', 'user3@example.com');

      const allUsers = service.getAllUsers();
      expect(allUsers[0]).toEqual(user1);
      expect(allUsers[1]).toEqual(user2);
      expect(allUsers[2]).toEqual(user3);
    });

    it('should correctly reflect user count after multiple operations', async () => {
      // Start fresh
      const module = await Test.createTestingModule({
        providers: [UserService],
      }).compile();
      service = module.get<UserService>(UserService);

      expect(service.getAllUsers().length).toBe(0);

      service.createUser('User1', 'user1@example.com');
      expect(service.getAllUsers().length).toBe(1);

      service.createUser('User2', 'user2@example.com');
      expect(service.getAllUsers().length).toBe(2);

      // If we had a deleteUser method, we would test it here
    });

    it("should return a copy of users array that doesn't affect the original data", () => {
      service.createUser('User1', 'user1@example.com');
      service.createUser('User2', 'user2@example.com');

      const users = service.getAllUsers();
      const initialLength = users.length;

      // Attempt to modify the returned array - this should not affect the service's data
      users.pop();

      // The service should still have the original number of users
      expect(service.getAllUsers().length).toBe(initialLength);
    });
  });

  describe('Other data integrity tests', () => {
    it('should handle a large number of users', () => {
      const userCount = 100;
      for (let i = 0; i < userCount; i++) {
        service.createUser(`User${i}`, `user${i}@example.com`);
      }
      expect(service.getAllUsers().length).toBe(userCount);
    });

    it('should maintain userIds as UUIDs', () => {
      const user = service.createUser('UUID Test', 'uuid@example.com');
      const uuidV4Pattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(user.userId).toMatch(uuidV4Pattern);
    });

    it('should preserve user data between operations', () => {
      const user = service.createUser(
        'Persistence Test',
        'persist@example.com',
      );
      const retrievedUser = service.getUser(user.userId);

      expect(retrievedUser).toEqual(user);
      expect(retrievedUser).toHaveProperty('name', 'Persistence Test');
      expect(retrievedUser).toHaveProperty('email', 'persist@example.com');
    });
  });
});
