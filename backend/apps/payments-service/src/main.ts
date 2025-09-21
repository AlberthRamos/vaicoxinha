import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { PaymentsModule } from './payments/payments.module';

async function bootstrap() {
  const logger = new Logger('PaymentsService');
  
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    PaymentsModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: 3003,
      },
    },
  );

  app.useGlobalPipes(new ValidationPipe());

  await app.listen();
  logger.log('Payments Service is listening on port 3003');
}
bootstrap();
