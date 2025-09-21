import { Controller, Get, Post, Body, HttpStatus, HttpException, UseGuards, Inject, Param, Patch } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';

@ApiTags('admin')
@Controller('admin')
@ApiBearerAuth()
@UseGuards(AuthGuard)
export class AdminController {
  constructor(
    @Inject('ADMIN_SERVICE') private client: ClientProxy,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Admin login' })
  @ApiResponse({ status: 200, description: 'Login successful.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  async login(@Body() loginDto: { email: string; password: string }) {
    try {
      return await this.client.send({ cmd: 'admin_login' }, loginDto).toPromise();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.UNAUTHORIZED);
    }
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Return dashboard statistics.' })
  async getDashboardStats() {
    try {
      return await this.client.send({ cmd: 'get_dashboard_stats' }, {}).toPromise();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Return all users.' })
  async getAllUsers() {
    try {
      return await this.client.send({ cmd: 'get_all_users' }, {}).toPromise();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('orders')
  @ApiOperation({ summary: 'Get all orders (admin)' })
  @ApiResponse({ status: 200, description: 'Return all orders.' })
  async getAllOrders() {
    try {
      return await this.client.send({ cmd: 'get_all_orders_admin' }, {}).toPromise();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('orders/stats')
  @ApiOperation({ summary: 'Get order statistics (admin)' })
  @ApiResponse({ status: 200, description: 'Return order statistics.' })
  async getOrderStats() {
    try {
      return await this.client.send({ cmd: 'get_order_stats_admin' }, {}).toPromise();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('revenue')
  @ApiOperation({ summary: 'Get revenue statistics' })
  @ApiResponse({ status: 200, description: 'Return revenue statistics.' })
  async getRevenueStats() {
    try {
      return await this.client.send({ cmd: 'get_revenue_stats' }, {}).toPromise();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Patch('orders/:id/status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiResponse({ status: 200, description: 'Order status updated.' })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  async updateOrderStatus(
    @Param('id') orderId: string,
    @Body() updateStatusDto: { status: string }
  ) {
    try {
      return await this.client.send({ cmd: 'update_order_status' }, { orderId, status: updateStatusDto.status }).toPromise();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }
}