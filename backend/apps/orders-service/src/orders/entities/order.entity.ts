import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface CustomerInfo {
  name: string;
  phone: string;
  address: string;
  neighborhood: string;
  number: string;
  complement?: string;
}

export interface PaymentInfo {
  method: string;
  status: string;
  pixCode?: string;
  qrCode?: string;
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  orderNumber: string;

  @Column('json')
  items: OrderItem[];

  @Column('json')
  customerInfo: CustomerInfo;

  @Column('json')
  paymentInfo: PaymentInfo;

  @Column('decimal', { precision: 10, scale: 2 })
  total: number;

  @Column('varchar', { length: 50 })
  status: string;

  @Column('text', { nullable: true })
  trackingCode?: string;

  @Column('timestamp', { nullable: true })
  estimatedDelivery?: Date;

  @Column('text', { nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}