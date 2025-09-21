import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PaymentDocument = Payment & Document;

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  PIX = 'pix',
  CASH = 'cash',
}

@Schema({ timestamps: true })
export class Payment {
  @Prop({ required: true })
  orderId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, enum: PaymentMethod })
  method: PaymentMethod;

  @Prop({ required: true, enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Prop()
  transactionId?: string;

  @Prop()
  cardLastFour?: string;

  @Prop()
  cardBrand?: string;

  @Prop()
  pixCode?: string;

  @Prop()
  pixExpiration?: Date;

  @Prop()
  paidAt?: Date;

  @Prop()
  refundedAt?: Date;

  @Prop()
  rejectionReason?: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);