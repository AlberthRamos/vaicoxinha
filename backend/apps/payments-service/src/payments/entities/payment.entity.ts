import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export interface PaymentMetadata {
  paymentMethod: string;
  installments?: number;
  payer: {
    email: string;
    identification: {
      type: string;
      number: string;
    };
  };
}

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  orderId: string;

  @Column({ unique: true })
  mercadoPagoId: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: ['pending', 'approved', 'rejected', 'cancelled'], default: 'pending' })
  status: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: PaymentMetadata;

  @Column({ type: 'jsonb', nullable: true })
  mercadoPagoResponse: any;

  @Column({ nullable: true })
  paymentDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}