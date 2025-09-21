import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { OrdersModule } from './orders/orders.module';

async function bootstrap() {
  const logger = new Logger('OrdersService');
  
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    OrdersModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: 3002,
      },
    },
  );

  app.useGlobalPipes(new ValidationPipe());

  await app.listen();
  logger.log('Orders Service is listening on port 3002');
}
bootstrap();
