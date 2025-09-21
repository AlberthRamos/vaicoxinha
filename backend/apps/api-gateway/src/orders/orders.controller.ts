import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpStatus, HttpException, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CreateOrderDto } from '../common/dto';
import { WinstonLoggerService } from '../common/logger';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(
    @Inject('ORDERS_SERVICE') private client: ClientProxy,
    private readonly logger: WinstonLoggerService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo pedido' })
  @ApiResponse({ status: 201, description: 'Pedido criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  async create(@Body() createOrderDto: CreateOrderDto) {
    try {
      this.logger.log(`Criando novo pedido para usuário: ${createOrderDto.userId}`, 'OrdersController');
      const result = await this.client.send({ cmd: 'create_order' }, createOrderDto).toPromise();
      this.logger.log(`Pedido criado com sucesso: ${result?.id}`, 'OrdersController');
      return result;
    } catch (error) {
      this.logger.error('Erro ao criar pedido', error.stack, 'OrdersController');
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os pedidos' })
  @ApiResponse({ status: 200, description: 'Lista de pedidos.' })
  async findAll() {
    try {
      this.logger.log('Listando todos os pedidos', 'OrdersController');
      const result = await this.client.send('get_orders', {}).toPromise();
      this.logger.log(`Retornados ${result?.length || 0} pedidos`, 'OrdersController');
      return result;
    } catch (error) {
      this.logger.error('Erro ao listar pedidos', error.stack, 'OrdersController');
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get orders by user' })
  @ApiResponse({ status: 200, description: 'Return user orders.' })
  async findUserOrders(@Param('userId') userId: string) {
    try {
      return await this.client.send({ cmd: 'find_user_orders' }, userId).toPromise();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get order statistics' })
  @ApiResponse({ status: 200, description: 'Return order statistics.' })
  async getOrderStats() {
    try {
      return await this.client.send({ cmd: 'get_order_stats' }, {}).toPromise();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar pedido por ID' })
  @ApiResponse({ status: 200, description: 'Pedido encontrado.' })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado.' })
  async findOne(@Param('id') id: string) {
    try {
      this.logger.log(`Buscando pedido com ID: ${id}`, 'OrdersController');
      const result = await this.client.send('get_order_by_id', id).toPromise();
      this.logger.log(`Pedido encontrado: ${result?.id || 'N/A'}`, 'OrdersController');
      return result;
    } catch (error) {
      this.logger.error(`Erro ao buscar pedido ${id}`, error.stack, 'OrdersController');
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiResponse({ status: 200, description: 'Order status updated successfully.' })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    try {
      return await this.client.send({ cmd: 'update_order_status' }, { id, status }).toPromise();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Put(':id/payment-status')
  @ApiOperation({ summary: 'Update payment status' })
  @ApiResponse({ status: 200, description: 'Payment status updated successfully.' })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  async updatePaymentStatus(@Param('id') id: string, @Body('isPaid') isPaid: boolean) {
    try {
      return await this.client.send({ cmd: 'update_payment_status' }, { id, isPaid }).toPromise();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete order' })
  @ApiResponse({ status: 200, description: 'Order deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  async remove(@Param('id') id: string) {
    try {
      return await this.client.send({ cmd: 'remove_order' }, id).toPromise();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }
}