import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { initializeWebSocketServer } from '../../../src/websocket/server';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });
  
  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe());
  
  const server = await app.listen(process.env.PORT ?? 3001);
  
  // Initialize WebSocket server
  initializeWebSocketServer(server);
  
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
