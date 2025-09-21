import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService, LoginDto, AuthResponse } from './auth.service';
import { User } from '../users/schemas/user.schema';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern({ cmd: 'login' })
  async login(@Payload() loginDto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(loginDto);
  }

  @MessagePattern({ cmd: 'validate_token' })
  async validateToken(@Payload() token: string): Promise<User | null> {
    return this.authService.validateToken(token);
  }
}