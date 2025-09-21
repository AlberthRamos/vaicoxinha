import { Controller, Get, Post, Body, Param, Patch } from '@nestjs/common';

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  status: 'received' | 'preparing' | 'out-for-delivery' | 'delivered';
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  paymentMethod: string;
  pixCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

@Controller('api/orders')
export class OrdersController {
  private orders: Order[] = [];

  @Post()
  createOrder(@Body() orderData: {
    items: OrderItem[];
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    paymentMethod: string;
  }): Order {
    const total = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const order: Order = {
      id: Date.now().toString(),
      ...orderData,
      total,
      status: 'received',
      createdAt: new Date(),
      updatedAt: new Date(),
      pixCode: orderData.paymentMethod === 'pix' ? this.generatePixCode() : undefined
    };

    this.orders.push(order);
    return order;
  }

  @Get(':id')
  getOrderById(@Param('id') id: string): Order | undefined {
    return this.orders.find(order => order.id === id);
  }

  @Get('user/:phone')
  getOrdersByPhone(@Param('phone') phone: string): Order[] {
    return this.orders.filter(order => order.customerPhone === phone);
  }

  @Patch(':id/status')
  updateOrderStatus(
    @Param('id') id: string,
    @Body() statusUpdate: { status: Order['status'] }
  ): Order | undefined {
    const order = this.orders.find(order => order.id === id);
    if (order) {
      order.status = statusUpdate.status;
      order.updatedAt = new Date();
    }
    return order;
  }

  private generatePixCode(): string {
    return '00020126580014BR.GOV.BCB.PIX0126vai-coxinha-pix@example.com520400005303986540610.005802BR5914VAI COXINHA6009SAO PAULO62070503***6304AAAA';
  }
}