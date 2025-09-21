import { Controller, MessagePattern, Payload } from '@nestjs/microservices';
import { PaymentsService, CreatePaymentDto, ProcessPaymentResponse } from './payments.service';
import { Payment } from './entities/payment.entity';

@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @MessagePattern({ cmd: 'create_payment' })
  async create(@Payload() createPaymentDto: CreatePaymentDto): Promise<Payment> {
    return this.paymentsService.create(createPaymentDto);
  }

  @MessagePattern({ cmd: 'process_payment' })
  async processPayment(@Payload() createPaymentDto: CreatePaymentDto): Promise<ProcessPaymentResponse> {
    return this.paymentsService.processPayment(createPaymentDto);
  }

  @MessagePattern({ cmd: 'find_all_payments' })
  async findAll(): Promise<Payment[]> {
    return this.paymentsService.findAll();
  }

  @MessagePattern({ cmd: 'find_user_payments' })
  async findByUser(@Payload() userId: string): Promise<Payment[]> {
    return this.paymentsService.findByUser(userId);
  }

  @MessagePattern({ cmd: 'find_order_payment' })
  async findByOrder(@Payload() orderId: string): Promise<Payment> {
    return this.paymentsService.findByOrder(orderId);
  }

  @MessagePattern({ cmd: 'find_one_payment' })
  async findOne(@Payload() id: string): Promise<Payment> {
    return this.paymentsService.findOne(id);
  }

  @MessagePattern({ cmd: 'refund_payment' })
  async refund(@Payload() id: string): Promise<Payment> {
    return this.paymentsService.refund(id);
  }
}