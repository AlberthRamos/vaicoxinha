import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UsersService, CreateUserDto, UpdateUserDto, UpdatePasswordDto } from './users.service';
import { User } from './schemas/user.schema';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern({ cmd: 'create_user' })
  async create(@Payload() createUserDto: CreateUserDto): Promise<User> {
    return this.usersService.create(createUserDto);
  }

  @MessagePattern({ cmd: 'find_all_users' })
  async findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @MessagePattern({ cmd: 'find_one_user' })
  async findOne(@Payload() id: string): Promise<User> {
    return this.usersService.findOne(id);
  }

  @MessagePattern({ cmd: 'find_user_by_email' })
  async findByEmail(@Payload() email: string): Promise<User | null> {
    return this.usersService.findByEmail(email);
  }

  @MessagePattern({ cmd: 'validate_user' })
  async validateUser(@Payload() data: { email: string; password: string }): Promise<User | null> {
    return this.usersService.validateUser(data.email, data.password);
  }

  @MessagePattern({ cmd: 'update_user' })
  async update(@Payload() data: { id: string; updateUserDto: UpdateUserDto }): Promise<User> {
    return this.usersService.update(data.id, data.updateUserDto);
  }

  @MessagePattern({ cmd: 'update_user_password' })
  async updatePassword(@Payload() data: { id: string; updatePasswordDto: UpdatePasswordDto }): Promise<User> {
    return this.usersService.updatePassword(data.id, data.updatePasswordDto);
  }

  @MessagePattern({ cmd: 'remove_user' })
  async remove(@Payload() id: string): Promise<User> {
    return this.usersService.remove(id);
  }

  @MessagePattern({ cmd: 'get_user_stats' })
  async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    adminUsers: number;
    recentUsers: number;
  }> {
    return this.usersService.getUserStats();
  }
}