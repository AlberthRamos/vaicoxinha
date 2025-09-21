import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { CommonModule } from '@app/common';
import { OrdersModule } from './orders/orders.module';
import { SeedModule } from './seed/seed.module';
import configuration from '@app/common/config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT) || 5432,
      username: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'password',
      database: process.env.POSTGRES_DB_ORDERS || 'vai_coxinha_orders',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true,
      logging: process.env.NODE_ENV === 'development',
    }),
    ClientsModule.register([
      {
        name: 'RABBITMQ_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
          queue: 'orders_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
    CommonModule,
    OrdersModule,
    SeedModule,
  ],
})
export class OrdersServiceModule {}
