import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProductsController } from './products/products.controller';
import { OrdersController } from './orders/orders.controller';
import { AdminAuthController } from '../../../src/routes/admin/auth';
import { AdminDashboardController } from '../../../src/routes/admin/dashboard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [
    AppController, 
    ProductsController, 
    OrdersController,
    AdminAuthController,
    AdminDashboardController
  ],
  providers: [AppService],
})
export class AppModule {}
