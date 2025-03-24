import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { v4 as uuidv4 } from 'uuid';

describe('UserController', () => {
  let controller: UserController;
  let userService: UserService;

  // Create a mock user
  const mockUserId = uuidv4();
  const mockUser = {
    userId: mockUserId,
    name: 'Test User',
    email: 'test@example.com',
    createdAt: new Date(),
  };

  // Mock UserService with implementations that match the real service behavior
  const mockUserService = {
    createUser: jest.fn().mockImplementation((name, email) => {
      if (email === 'existing@example.com') {
        throw new HttpException('Email already exists', HttpStatus.BAD_REQUEST);
      }
      return {
        userId: uuidv4(),
        name,
        email,
        createdAt: new Date(),
      };
    }),
    getUser: jest.fn().mockImplementation((userId) => {
      if (userId === mockUserId) {
        return mockUser;
      }
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }),
    getAllUsers: jest.fn().mockReturnValue([mockUser]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(userService).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a new user and return success message', () => {
      const createUserDto: CreateUserDto = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      const result = controller.createUser(createUserDto);

      expect(userService.createUser).toHaveBeenCalledWith(
        'John Doe',
        'john@example.com',
      );
      expect(result.message).toBe('User created');
      expect(result.user).toBeDefined();
      expect(result.user.name).toBe('John Doe');
      expect(result.user.email).toBe('john@example.com');
      expect(result.user.userId).toBeDefined();
      expect(result.user.createdAt).toBeInstanceOf(Date);
    });

    it('should throw an error if email already exists', () => {
      const createUserDto: CreateUserDto = {
        name: 'Another User',
        email: 'existing@example.com',
      };

      expect(() => controller.createUser(createUserDto)).toThrow(HttpException);
      expect(() => controller.createUser(createUserDto)).toThrow(
        'Email already exists',
      );
      expect(userService.createUser).toHaveBeenCalledWith(
        'Another User',
        'existing@example.com',
      );
    });
  });

  describe('getAllUsers', () => {
    it('should return an array of users', () => {
      const result = controller.getAllUsers();

      expect(userService.getAllUsers).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Array);
      expect(result).toContainEqual(mockUser);
    });

    it('should return an empty array when no users exist', () => {
      jest.spyOn(userService, 'getAllUsers').mockReturnValueOnce([]);

      const result = controller.getAllUsers();

      expect(result).toEqual([]);
    });
  });

  describe('getUser', () => {
    it('should return a user by ID', () => {
      const result = controller.getUser(mockUserId);

      expect(userService.getUser).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(mockUser);
    });

    it('should throw an error if user does not exist', () => {
      const nonExistentId = uuidv4();

      expect(() => controller.getUser(nonExistentId)).toThrow(HttpException);
      expect(() => controller.getUser(nonExistentId)).toThrow('User not found');
      expect(userService.getUser).toHaveBeenCalledWith(nonExistentId);
    });
  });
});
