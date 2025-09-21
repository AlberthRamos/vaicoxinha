import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus, PaymentMethod } from '../entities/payment.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(Payment) private paymentRepository: Repository<Payment>,
  ) {}

  async onModuleInit() {
    await this.seed();
  }

  async seed() {
    console.log('🌱 Starting payments database seed...');
    
    await this.seedPayments();
    
    console.log('✅ Payments database seed completed!');
  }

  private async seedPayments() {
    const paymentCount = await this.paymentRepository.count();
    
    if (paymentCount === 0) {
      console.log('Creating sample payments...');
      
      const samplePayments = [
        {
          orderId: 'order-123',
          userId: 'user-123',
          amount: 33.50,
          method: PaymentMethod.PIX,
          status: PaymentStatus.APPROVED,
          mercadoPagoId: 'mp-payment-123',
          transactionId: 'tx-123',
          paidAt: new Date(Date.now() - 60 * 60000),
        },
        {
          orderId: 'order-456',
          userId: 'user-456',
          amount: 59.50,
          method: PaymentMethod.PIX,
          status: PaymentStatus.APPROVED,
          mercadoPagoId: 'mp-payment-456',
          transactionId: 'tx-456',
          paidAt: new Date(Date.now() - 30 * 60000),
        },
        {
          orderId: 'order-789',
          userId: 'user-789',
          amount: 14.00,
          method: PaymentMethod.PIX,
          status: PaymentStatus.PENDING,
          mercadoPagoId: 'mp-payment-789',
          transactionId: 'tx-789',
        },
      ];

      for (const paymentData of samplePayments) {
        const payment = this.paymentRepository.create(paymentData);
        await this.paymentRepository.save(payment);
      }

      console.log(`✅ ${samplePayments.length} sample payments created successfully!`);
    }
  }
}