import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OrdersService, CreateOrderDto, UpdateOrderStatusDto } from './orders.service';
import { Order } from '../entities/order.entity';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // REST Endpoints
  @Post()
  async createOrder(@Body() createOrderDto: CreateOrderDto): Promise<Order> {
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  async getAllOrders(): Promise<Order[]> {
    return this.ordersService.findAll();
  }

  @Get('user/:userId')
  async getUserOrders(@Param('userId') userId: string): Promise<Order[]> {
    return this.ordersService.findByUser(userId);
  }

  @Get(':id')
  async getOrderById(@Param('id') id: string): Promise<Order> {
    return this.ordersService.findOne(id);
  }

  @Patch(':id/status')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto
  ): Promise<Order> {
    return this.ordersService.updateStatus(id, updateOrderStatusDto);
  }

  @MessagePattern({ cmd: 'create_order' })
  async create(@Payload() createOrderDto: CreateOrderDto): Promise<Order> {
    return this.ordersService.create(createOrderDto);
  }

  @MessagePattern({ cmd: 'find_all_orders' })
  async findAll(): Promise<Order[]> {
    return this.ordersService.findAll();
  }

  @MessagePattern({ cmd: 'find_user_orders' })
  async findByUser(@Payload() userId: string): Promise<Order[]> {
    return this.ordersService.findByUser(userId);
  }

  @MessagePattern({ cmd: 'find_one_order' })
  async findOne(@Payload() id: string): Promise<Order> {
    return this.ordersService.findOne(id);
  }

  @MessagePattern({ cmd: 'update_order_status' })
  async updateStatus(@Payload() data: { id: string; updateOrderStatusDto: UpdateOrderStatusDto }): Promise<Order> {
    return this.ordersService.updateStatus(data.id, data.updateOrderStatusDto);
  }

  @MessagePattern({ cmd: 'update_payment_status' })
  async updatePaymentStatus(@Payload() data: { id: string; status: string; paymentId?: string }): Promise<Order> {
    return this.ordersService.updatePaymentStatus(data.id, data.status, data.paymentId);
  }

  @MessagePattern({ cmd: 'remove_order' })
  async remove(@Payload() id: string): Promise<Order> {
    return this.ordersService.remove(id);
  }

  @MessagePattern({ cmd: 'get_order_stats' })
  async getOrderStats(): Promise<any> {
    return this.ordersService.getOrderStats();
  }
}