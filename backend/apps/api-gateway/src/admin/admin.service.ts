import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ClientProxy } from '@nestjs/microservices';
import { Inject } from '@nestjs/common';

@Injectable()
export class AdminService {
  constructor(
    @Inject('ADMIN_SERVICE') private client: ClientProxy,
    private jwtService: JwtService,
  ) {}

  async validateAdmin(email: string, password: string): Promise<any> {
    // Admin padrão para testes
    const adminUser = {
      id: 'admin-001',
      email: 'admin@vaicoxinha.com',
      password: await bcrypt.hash('admin123', 10),
      name: 'Administrador',
      role: 'admin'
    };

    if (email === adminUser.email) {
      const isPasswordValid = await bcrypt.compare(password, adminUser.password);
      if (isPasswordValid) {
        const { password, ...result } = adminUser;
        return result;
      }
    }
    return null;
  }

  async login(email: string, password: string) {
    const admin = await this.validateAdmin(email, password);
    if (!admin) {
      throw new HttpException('Credenciais inválidas', HttpStatus.UNAUTHORIZED);
    }

    const payload = { email: admin.email, sub: admin.id, role: admin.role };
    return {
      access_token: this.jwtService.sign(payload),
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role
      }
    };
  }

  async getDashboard() {
    try {
      const stats = await this.client.send({ cmd: 'get_dashboard_stats' }, {}).toPromise();
      return stats;
    } catch (error) {
      throw new HttpException('Erro ao buscar estatísticas', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getAllOrders() {
    try {
      return await this.client.send({ cmd: 'get_all_orders_admin' }, {}).toPromise();
    } catch (error) {
      throw new HttpException('Erro ao buscar pedidos', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateOrderStatus(orderId: string, status: string) {
    try {
      return await this.client.send({ cmd: 'update_order_status' }, { orderId, status }).toPromise();
    } catch (error) {
      throw new HttpException('Erro ao atualizar status do pedido', HttpStatus.NOT_FOUND);
    }
  }
}