import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SERVICES_CONFIG } from '../config/services.config';

@Module({
  imports: [
    ClientsModule.register([
      SERVICES_CONFIG.ADMIN_SERVICE,
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}