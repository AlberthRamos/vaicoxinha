import { Controller, Get, Post, Put, Body, Param, HttpStatus, HttpException, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreatePaymentDto } from '../common/dto';
import { WinstonLoggerService } from '../common/logger';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    @Inject('PAYMENTS_SERVICE') private client: ClientProxy,
    private readonly logger: WinstonLoggerService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo pagamento' })
  @ApiResponse({ status: 201, description: 'Pagamento criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  async create(@Body() createPaymentDto: CreatePaymentDto) {
    try {
      this.logger.log(`Criando novo pagamento para pedido: ${createPaymentDto.orderId}`, 'PaymentsController');
      const result = await this.client.send('create_payment', createPaymentDto).toPromise();
      this.logger.log(`Pagamento criado com sucesso: ${result?.id}`, 'PaymentsController');
      return result;
    } catch (error) {
      this.logger.error('Erro ao criar pagamento', error.stack, 'PaymentsController');
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('process')
  @ApiOperation({ summary: 'Process payment' })
  @ApiResponse({ status: 200, description: 'Payment processed successfully.' })
  async processPayment(@Body() processPaymentDto: any) {
    try {
      return await this.client.send({ cmd: 'process_payment' }, processPaymentDto).toPromise();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os pagamentos' })
  @ApiResponse({ status: 200, description: 'Lista de pagamentos.' })
  async findAll() {
    try {
      this.logger.log('Listando todos os pagamentos', 'PaymentsController');
      const result = await this.client.send('get_payments', {}).toPromise();
      this.logger.log(`Retornados ${result?.length || 0} pagamentos`, 'PaymentsController');
      return result;
    } catch (error) {
      this.logger.error('Erro ao listar pagamentos', error.stack, 'PaymentsController');
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get payments by user' })
  @ApiResponse({ status: 200, description: 'Return user payments.' })
  async findUserPayments(@Param('userId') userId: string) {
    try {
      return await this.client.send({ cmd: 'find_user_payments' }, userId).toPromise();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Get payment by order' })
  @ApiResponse({ status: 200, description: 'Return payment by order.' })
  async findOrderPayment(@Param('orderId') orderId: string) {
    try {
      return await this.client.send({ cmd: 'find_order_payment' }, orderId).toPromise();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by id' })
  @ApiResponse({ status: 200, description: 'Return payment by id.' })
  @ApiResponse({ status: 404, description: 'Payment not found.' })
  async findOne(@Param('id') id: string) {
    try {
      return await this.client.send({ cmd: 'find_one_payment' }, id).toPromise();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @Put(':id/refund')
  @ApiOperation({ summary: 'Refund payment' })
  @ApiResponse({ status: 200, description: 'Payment refunded successfully.' })
  @ApiResponse({ status: 404, description: 'Payment not found.' })
  async refund(@Param('id') id: string, @Body('reason') reason?: string) {
    try {
      return await this.client.send({ cmd: 'refund_payment' }, { id, reason }).toPromise();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}