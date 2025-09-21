import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum PaymentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  PIX = 'pix',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  CASH = 'cash',
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderId: string;

  @Column()
  userId: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.PIX,
  })
  method: PaymentMethod;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({ nullable: true })
  mercadoPagoId: string;

  @Column({ nullable: true })
  pixQrCode: string;

  @Column({ nullable: true })
  pixExpiration: Date;

  @Column({ nullable: true })
  transactionId: string;

  @Column('json', { nullable: true })
  metadata: any;

  @Column({ nullable: true })
  paidAt: Date;

  @Column({ nullable: true })
  cancelledAt: Date;

  @Column({ nullable: true })
  refundedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}