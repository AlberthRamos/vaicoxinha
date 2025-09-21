import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientProxy } from '@nestjs/microservices';
import { Payment } from './entities/payment.entity';

export interface CreatePaymentDto {
  orderId: string;
  userId: string;
  amount: number;
  method: string;
  cardData?: {
    number: string;
    holder: string;
    expiry: string;
    cvv: string;
  };
}

export interface ProcessPaymentResponse {
  success: boolean;
  payment?: Payment;
  error?: string;
  pixCode?: string;
}

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment) private paymentRepository: Repository<Payment>,
    @Inject('RABBITMQ_SERVICE') private rabbitClient: ClientProxy,
  ) {}

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const payment = this.paymentRepository.create({
      ...createPaymentDto,
      status: 'pending',
      mercadoPagoId: `mp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });

    return this.paymentRepository.save(payment);
  }

  async processPayment(createPaymentDto: CreatePaymentDto): Promise<ProcessPaymentResponse> {
    try {
      // Criar pagamento
      const payment = await this.create(createPaymentDto);

      // Simular processamento baseado no método
      let processedPayment: Payment;

      switch (createPaymentDto.method) {
        case PaymentMethod.PIX:
          processedPayment = await this.processPixPayment(payment);
          break;
        case PaymentMethod.CREDIT_CARD:
          processedPayment = await this.processCreditCardPayment(payment, createPaymentDto.cardData);
          break;
        case PaymentMethod.DEBIT_CARD:
          processedPayment = await this.processDebitCardPayment(payment, createPaymentDto.cardData);
          break;
        case PaymentMethod.CASH:
          processedPayment = await this.processCashPayment(payment);
          break;
        default:
          throw new BadRequestException('Invalid payment method');
      }

      return {
        success: true,
        payment: processedPayment,
        pixCode: processedPayment.method === PaymentMethod.PIX ? processedPayment.pixCode : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async findAll(): Promise<Payment[]> {
    return this.paymentRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findByUser(userId: string): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { orderId: userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findByOrder(orderId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { orderId },
    });
    if (!payment) {
      throw new NotFoundException(`Payment for order ${orderId} not found`);
    }
    return payment;
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
    });
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }
    return payment;
  }

  async refund(id: string): Promise<Payment> {
    const payment = await this.findOne(id);
    
    if (payment.status !== 'approved') {
      throw new BadRequestException('Only approved payments can be refunded');
    }

    payment.status = 'cancelled';
    payment.paymentDate = null;
    
    return this.paymentRepository.save(payment);
  }

  private async processPixPayment(payment: Payment): Promise<Payment> {
    // Simular geração de código PIX
    const pixCode = this.generatePixCode(payment);
    const pixExpiration = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

    // Simular aprovação após 2 segundos
    await new Promise(resolve => setTimeout(resolve, 2000));

    payment.status = 'approved';
    payment.metadata = {
      paymentMethod: 'pix',
      payer: {
        email: 'customer@example.com',
        identification: {
          type: 'CPF',
          number: '12345678909',
        },
      },
    };
    payment.paymentDate = new Date();

    const updatedPayment = await this.paymentRepository.save(payment);

    // Notificar serviço de pedidos sobre pagamento aprovado
    this.rabbitClient.emit('payment_approved', {
      orderId: payment.orderId,
      paymentId: payment.id,
      status: 'approved',
    });

    return updatedPayment;
  }

  private async processCreditCardPayment(payment: Payment, cardData: any): Promise<Payment> {
    // Validar dados do cartão
    if (!cardData || !cardData.number || !cardData.holder || !cardData.expiry || !cardData.cvv) {
      throw new BadRequestException('Credit card data is required');
    }

    // Simular processamento de cartão
    const cardLastFour = cardData.number.slice(-4);
    const cardBrand = this.getCardBrand(cardData.number);

    // Simular decisão de aprovação (90% de aprovação)
    const isApproved = Math.random() > 0.1;

    if (!isApproved) {
      payment.status = 'rejected';
      payment.mercadoPagoResponse = { rejectionReason: 'Card declined by bank' };
      return this.paymentRepository.save(payment);
    }

    payment.status = 'approved';
    payment.metadata = {
      paymentMethod: 'credit_card',
      installments: 1,
      payer: {
        email: 'customer@example.com',
        identification: {
          type: 'CPF',
          number: '12345678909',
        },
      },
    };
    payment.mercadoPagoResponse = {
      cardLastFour,
      cardBrand,
    };
    payment.paymentDate = new Date();

    const updatedPayment = await this.paymentRepository.save(payment);

    // Notificar serviço de pedidos sobre pagamento aprovado
    this.rabbitClient.emit('payment_approved', {
      orderId: payment.orderId,
      paymentId: payment.id,
      status: 'approved',
    });

    return updatedPayment;
  }

  private async processDebitCardPayment(payment: Payment, cardData: any): Promise<Payment> {
    // Processamento similar ao cartão de crédito
    return this.processCreditCardPayment(payment, cardData);
  }

  private async processCashPayment(payment: Payment): Promise<Payment> {
    // Para pagamento em dinheiro, marcar como aprovado imediatamente
    payment.status = 'approved';
    payment.metadata = {
      paymentMethod: 'cash',
      payer: {
        email: 'customer@example.com',
        identification: {
          type: 'CPF',
          number: '12345678909',
        },
      },
    };
    payment.paymentDate = new Date();

    const updatedPayment = await this.paymentRepository.save(payment);

    // Notificar serviço de pedidos sobre pagamento aprovado
    this.rabbitClient.emit('payment_approved', {
      orderId: payment.orderId,
      paymentId: payment.id,
      status: 'approved',
    });

    return updatedPayment;
  }

  private generatePixCode(payment: Payment): string {
    // Gerar um código PIX simulado
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8);
    return `PIX${payment.orderId}${timestamp}${random}`.toUpperCase();
  }

  private getCardBrand(cardNumber: string): string {
    // Identificação básica de bandeira
    if (cardNumber.startsWith('4')) return 'Visa';
    if (cardNumber.startsWith('5')) return 'Mastercard';
    if (cardNumber.startsWith('3')) return 'Amex';
    if (cardNumber.startsWith('6')) return 'Discover';
    return 'Unknown';
  }
}