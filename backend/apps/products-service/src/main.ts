import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { ProductsModule } from './products/products.module';
import { CommonModule } from '@app/common';

async function bootstrap() {
  const logger = new Logger('ProductsService');
  
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    ProductsModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: 3001,
      },
    },
  );

  app.useGlobalPipes(new ValidationPipe());

  await app.listen();
  logger.log('Products Service is listening on port 3001');
}
bootstrap();
