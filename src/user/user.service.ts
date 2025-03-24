import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { User } from './entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UserService {
  private users: Map<string, User> = new Map();
  private readonly logger = new Logger(UserService.name);

  createUser(name: string, email: string): User {
    // Check for duplicate email
    const duplicateUserEmail = Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );
    if (duplicateUserEmail) {
      throw new HttpException('Email already exists', HttpStatus.BAD_REQUEST);
    }

    const userId = uuidv4();
    const user = new User(userId, name, email.toLowerCase());
    this.users.set(userId, user);
    this.logger.log(`User created: ${userId}`);
    return user;
  }

  getUser(userId: string): User {
    const user = this.users.get(userId);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return user;
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }
}
