import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus, OrderItem } from './entities/order.entity';

export interface CreateOrderDto {
  userId: string;
  items: OrderItem[];
  customerName: string;
  customerPhone: string;
  deliveryAddress?: string;
  notes?: string;
  paymentMethod: string;
  customerInfo: {
    name: string;
    phone: string;
    address: string;
    neighborhood: string;
    number: string;
    complement?: string;
  };
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private orderRepository: Repository<Order>,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    // Calcular subtotal e total
    const subtotal = createOrderDto.items.reduce((sum, item) => sum + item.total, 0);
    const deliveryFee = subtotal < 50 ? 5.00 : 0; // Taxa de entrega grátis acima de R$50
    const total = subtotal + deliveryFee;

    const order = this.orderRepository.create({
      orderNumber: `VAI${Date.now()}${Math.floor(Math.random() * 1000)}`,
      items: createOrderDto.items,
      customerInfo: createOrderDto.customerInfo,
      paymentInfo: {
        method: createOrderDto.paymentMethod,
        status: 'pending',
      },
      total,
      status: OrderStatus.PENDING,
      trackingCode: `TRK${Date.now()}${Math.floor(Math.random() * 1000)}`,
      estimatedDelivery: new Date(Date.now() + 30 * 60 * 1000), // 30 minutos
      notes: createOrderDto.notes,
    });

    return this.orderRepository.save(order);
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findByUser(userId: string): Promise<Order[]> {
    return this.orderRepository.find({ 
      where: { userId },
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }
    return order;
  }

  async updateStatus(id: string, updateOrderStatusDto: UpdateOrderStatusDto): Promise<Order> {
    const order = await this.findOne(id);
    
    // Validar transição de status
    this.validateStatusTransition(order.status, updateOrderStatusDto.status);

    order.status = updateOrderStatusDto.status;
    return this.orderRepository.save(order);
  }

  async updatePaymentStatus(id: string, status: string, paymentId?: string): Promise<Order> {
    const order = await this.findOne(id);
    
    order.paymentInfo.status = status;
    if (paymentId) {
      order.paymentInfo.paymentId = paymentId;
    }
    
    return this.orderRepository.save(order);
  }

  async remove(id: string): Promise<Order> {
    const order = await this.findOne(id);
    
    // Só permitir cancelar pedidos que não estejam entregues
    if (order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException('Cannot cancel delivered orders');
    }

    await this.orderRepository.remove(order);
    return order;
  }

  async getOrderStats(): Promise<{
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    totalRevenue: number;
  }> {
    const orders = await this.orderRepository.find();
    
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(order => 
      [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY].includes(order.status)
    ).length;
    const completedOrders = orders.filter(order => order.status === OrderStatus.DELIVERED).length;
    const totalRevenue = orders
      .filter(order => order.status === OrderStatus.DELIVERED && order.paymentInfo.status === 'paid')
      .reduce((sum, order) => sum + order.total, 0);

    return {
      totalOrders,
      pendingOrders,
      completedOrders,
      totalRevenue,
    };
  }

  private validateStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): void {
    const allowedTransitions = {
      [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
      [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
      [OrderStatus.PREPARING]: [OrderStatus.READY, OrderStatus.CANCELLED],
      [OrderStatus.READY]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [],
      [OrderStatus.CANCELLED]: [],
    };

    const allowed = allowedTransitions[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`
      );
    }
  }
}