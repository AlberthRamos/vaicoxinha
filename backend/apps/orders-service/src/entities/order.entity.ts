import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Product } from '../entities/product.entity';

export enum OrderStatus {
  RECEIVED = 'received',
  IN_PREPARATION = 'in_preparation',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column('json')
  items: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }>;

  @Column('decimal', { precision: 10, scale: 2 })
  totalAmount: number;

  @Column('decimal', { precision: 10, scale: 2 })
  discount: number;

  @Column('decimal', { precision: 10, scale: 2 })
  finalAmount: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.RECEIVED,
  })
  status: OrderStatus;

  @Column({ nullable: true })
  paymentMethod: string;

  @Column({ nullable: true })
  paymentId: string;

  @Column({ nullable: true })
  pixQrCode: string;

  @Column({ nullable: true })
  pixExpiration: Date;

  @Column('json', { nullable: true })
  deliveryAddress: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };

  @Column({ nullable: true })
  customerName: string;

  @Column({ nullable: true })
  customerPhone: string;

  @Column({ nullable: true })
  customerEmail: string;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  estimatedDeliveryTime: Date;

  @Column({ nullable: true })
  deliveredAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}