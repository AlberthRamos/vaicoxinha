import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../entities/product.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  providers: [SeedService],
})
export class SeedModule {}