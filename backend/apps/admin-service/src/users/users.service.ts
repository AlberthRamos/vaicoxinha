import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';

export interface CreateUserDto {
  email: string;
  password: string;
  name?: string;
  role?: string;
}

export interface UpdateUserDto {
  name?: string;
  role?: string;
  isActive?: boolean;
}

export interface UpdatePasswordDto {
  currentPassword: string;
  newPassword: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Verificar se email já existe
    const existingUser = await this.userRepository.findOne({ where: { email: createUserDto.email } });
    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      role: createUserDto.role || 'user',
      isActive: true,
    });

    return this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({ select: ['id', 'email', 'name', 'role', 'isActive', 'createdAt', 'updatedAt'] });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ 
      where: { id },
      select: ['id', 'email', 'name', 'role', 'isActive', 'createdAt', 'updatedAt']
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    
    await this.userRepository.update(id, updateUserDto);
    
    return this.findOne(id);
  }

  async updatePassword(id: string, updatePasswordDto: UpdatePasswordDto): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Verificar senha atual
    const isCurrentPasswordValid = await bcrypt.compare(updatePasswordDto.currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash da nova senha
    const hashedNewPassword = await bcrypt.hash(updatePasswordDto.newPassword, 10);

    await this.userRepository.update(id, { password: hashedNewPassword });

    return this.findOne(id);
  }

  async remove(id: string): Promise<User> {
    const user = await this.findOne(id);
    
    // Não permitir deletar o último admin
    if (user.role === 'admin') {
      const adminCount = await this.userRepository.count({ where: { role: 'admin' } });
      if (adminCount <= 1) {
        throw new BadRequestException('Cannot delete the last admin user');
      }
    }

    await this.userRepository.delete(id);
    return user;
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user || !user.isActive) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    adminUsers: number;
    recentUsers: number; // últimos 30 dias
  }> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      adminUsers,
      recentUsers,
    ] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { isActive: true } }),
      this.userRepository.count({ where: { role: 'admin' } }),
      this.userRepository.count({ where: { createdAt: { $gte: thirtyDaysAgo } } }),
    ]);

    return {
      totalUsers,
      activeUsers,
      adminUsers,
      recentUsers,
    };
  }
}