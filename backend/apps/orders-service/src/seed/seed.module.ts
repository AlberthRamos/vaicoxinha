import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../entities/order.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([Order])],
  providers: [SeedService],
})
export class SeedModule {}