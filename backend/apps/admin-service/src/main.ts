import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { AdminServiceModule } from './admin-service.module';

async function bootstrap() {
  const logger = new Logger('AdminService');
  
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AdminServiceModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: 3004,
      },
    },
  );

  app.useGlobalPipes(new ValidationPipe());

  await app.listen();
  logger.log('Admin Service is listening on port 3004');
}
bootstrap();
