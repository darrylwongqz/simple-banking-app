import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully.' })
  createUser(@Body() createUserDto: CreateUserDto) {
    const user = this.userService.createUser(
      createUserDto.name,
      createUserDto.email,
    );
    return { message: 'User created', user };
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Returns a list of users.' })
  getAllUsers() {
    return this.userService.getAllUsers();
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({ status: 200, description: 'Returns the user details.' })
  getUser(@Param('userId') userId: string) {
    return this.userService.getUser(userId);
  }
}
