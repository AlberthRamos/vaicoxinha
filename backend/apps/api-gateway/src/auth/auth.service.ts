import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class AuthService {
  constructor(
    @Inject('ADMIN_SERVICE') private client: ClientProxy,
  ) {}

  async login(email: string, password: string) {
    return await this.client.send({ cmd: 'login_user' }, { email, password }).toPromise();
  }

  async register(userData: { email: string; password: string; name: string; phone?: string; address?: string }) {
    return await this.client.send({ cmd: 'register_user' }, userData).toPromise();
  }

  async validateToken(token: string) {
    return await this.client.send({ cmd: 'validate_token' }, { token }).toPromise();
  }

  async findById(id: string) {
    return await this.client.send({ cmd: 'find_user_by_id' }, id).toPromise();
  }
}