import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../entities/order.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(Order) private orderRepository: Repository<Order>,
  ) {}

  async onModuleInit() {
    await this.seed();
  }

  async seed() {
    console.log('🌱 Starting orders database seed...');
    
    await this.seedOrders();
    
    console.log('✅ Orders database seed completed!');
  }

  private async seedOrders() {
    const orderCount = await this.orderRepository.count();
    
    if (orderCount === 0) {
      console.log('Creating sample orders...');
      
      const sampleOrders = [
        {
          userId: 'user-123',
          items: [
            {
              productId: 'prod-1',
              name: 'Coxinha de Frango com Catupiry',
              price: 7.00,
              quantity: 2,
              image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop',
            },
            {
              productId: 'prod-2',
              name: 'Coxinha de Frango',
              price: 6.50,
              quantity: 3,
              image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop',
            },
          ],
          totalAmount: 33.50,
          discount: 0,
          finalAmount: 33.50,
          status: OrderStatus.DELIVERED,
          paymentMethod: 'pix',
          paymentId: 'payment-123',
          customerName: 'João Silva',
          customerPhone: '11999999999',
          customerEmail: 'joao@email.com',
          deliveryAddress: {
            street: 'Rua das Flores',
            number: '123',
            complement: 'Apto 45',
            neighborhood: 'Centro',
            city: 'São Paulo',
            state: 'SP',
            zipCode: '01000-000',
          },
          notes: 'Tirem a cebola',
          estimatedDeliveryTime: new Date(Date.now() + 30 * 60000),
          deliveredAt: new Date(Date.now() + 25 * 60000),
        },
        {
          userId: 'user-456',
          items: [
            {
              productId: 'prod-3',
              name: 'Combo Família - 12 Coxinhas',
              price: 70.00,
              quantity: 1,
              image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop',
            },
          ],
          totalAmount: 70.00,
          discount: 10.50,
          finalAmount: 59.50,
          status: OrderStatus.IN_PREPARATION,
          paymentMethod: 'pix',
          paymentId: 'payment-456',
          customerName: 'Maria Santos',
          customerPhone: '11888888888',
          customerEmail: 'maria@email.com',
          deliveryAddress: {
            street: 'Av. Paulista',
            number: '1000',
            neighborhood: 'Bela Vista',
            city: 'São Paulo',
            state: 'SP',
            zipCode: '01310-100',
          },
          estimatedDeliveryTime: new Date(Date.now() + 45 * 60000),
        },
        {
          userId: 'user-789',
          items: [
            {
              productId: 'prod-4',
              name: 'Coxinha de Calabresa',
              price: 7.20,
              quantity: 1,
              image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop',
            },
            {
              productId: 'prod-5',
              name: 'Coxinha de Queijo',
              price: 6.80,
              quantity: 1,
              image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop',
            },
          ],
          totalAmount: 14.00,
          discount: 0,
          finalAmount: 14.00,
          status: OrderStatus.OUT_FOR_DELIVERY,
          paymentMethod: 'pix',
          paymentId: 'payment-789',
          customerName: 'Pedro Oliveira',
          customerPhone: '11777777777',
          customerEmail: 'pedro@email.com',
          deliveryAddress: {
            street: 'Rua Augusta',
            number: '2500',
            neighborhood: 'Cerqueira César',
            city: 'São Paulo',
            state: 'SP',
            zipCode: '01412-100',
          },
          estimatedDeliveryTime: new Date(Date.now() + 20 * 60000),
        },
      ];

      for (const orderData of sampleOrders) {
        const order = this.orderRepository.create(orderData);
        await this.orderRepository.save(order);
      }

      console.log(`✅ ${sampleOrders.length} sample orders created successfully!`);
    }
  }
}