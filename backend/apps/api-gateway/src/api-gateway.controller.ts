import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req, ValidationPipe, UsePipes } from '@nestjs/common';
import { ApiGatewayService } from './api-gateway.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Controller()
export class ApiGatewayController {
  constructor(private readonly apiGatewayService: ApiGatewayService) {}

  @Get()
  getHello(): string {
    return this.apiGatewayService.getHello();
  }

  // Products endpoints
  @Get('products')
  getProducts() {
    return this.apiGatewayService.getProducts();
  }

  @Get('products/:id')
  getProduct(@Param('id') id: string) {
    return this.apiGatewayService.getProduct(id);
  }

  // Orders endpoints
  @Post('orders')
  @UsePipes(new ValidationPipe())
  async createOrder(@Body() createOrderDto: CreateOrderDto) {
    return this.apiGatewayService.createOrder(createOrderDto);
  }

  @Get('orders/:id')
  getOrder(@Param('id') id: string) {
    return this.apiGatewayService.getOrder(id);
  }

  @Patch('orders/:id/status')
  @UsePipes(new ValidationPipe())
  async updateOrderStatus(@Param('id') id: string, @Body() updateStatusDto: UpdateOrderStatusDto) {
    return this.apiGatewayService.updateOrderStatus(id, updateStatusDto);
  }

  // Admin endpoints
  @Post('admin/login')
  @UsePipes(new ValidationPipe())
  async adminLogin(@Body() loginDto: AdminLoginDto) {
    return this.apiGatewayService.adminLogin(loginDto);
  }

  @Get('admin/orders')
  getAdminOrders(@Req() req: any) {
    return this.apiGatewayService.getAdminOrders();
  }

  @Get('admin/stats')
  getAdminStats(@Req() req: any) {
    return this.apiGatewayService.getAdminStats();
  }
}
