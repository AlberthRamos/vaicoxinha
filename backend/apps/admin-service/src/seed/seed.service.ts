import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/entities/user.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async onModuleInit() {
    await this.seed();
  }

  async seed() {
    console.log('🌱 Starting database seed...');
    
    await this.seedUsers();
    
    console.log('✅ Database seed completed!');
  }

  private async seedUsers() {
    const userCount = await this.userRepository.count();
    
    if (userCount === 0) {
      console.log('Creating default admin user...');
      
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const adminUser = this.userRepository.create({
        email: 'admin@vaicoxinha.com',
        password: hashedPassword,
        name: 'Admin Vai Coxinha',
        role: 'admin',
        isActive: true,
      });

      await this.userRepository.save(adminUser);
      console.log('✅ Default admin user created (admin@vaicoxinha.com / admin123)');
    }
  }
}