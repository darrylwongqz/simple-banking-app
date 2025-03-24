import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { User } from './entities/user.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UserService {
  private users: Map<string, User> = new Map();
  private readonly logger = new Logger(UserService.name);

  createUser(name: string, email: string): User {
    const userId = uuidv4();
    const user = new User(userId, name, email);
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
