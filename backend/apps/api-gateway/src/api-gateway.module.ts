import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ProductsController } from './products/products.controller';
import { OrdersController } from './orders/orders.controller';
import { PaymentsController } from './payments/payments.controller';
import { AdminController } from './admin/admin.controller';
import { AuthController } from './auth/auth.controller';
import { SERVICES_CONFIG } from './config/services.config';
import { LoggerModule } from './common/logger/logger.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule,
    ClientsModule.register([
      SERVICES_CONFIG.PRODUCTS_SERVICE,
      SERVICES_CONFIG.ORDERS_SERVICE,
      SERVICES_CONFIG.PAYMENTS_SERVICE,
      SERVICES_CONFIG.ADMIN_SERVICE,
    ]),
  ],
  controllers: [
    ProductsController,
    OrdersController,
    PaymentsController,
    AdminController,
    AuthController,
  ],
})
export class ApiGatewayModule {}
