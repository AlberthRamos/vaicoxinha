import { IsString, IsNumber, IsEnum, Min, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  PIX = 'pix',
  CASH = 'cash',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export class CreatePaymentDto {
  @ApiProperty({ description: 'ID do pedido' })
  @IsString()
  orderId: string;

  @ApiProperty({ description: 'ID do usuário' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Valor do pagamento' })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Método de pagamento' })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({ description: 'Dados do cartão (para pagamentos com cartão)', required: false })
  @IsOptional()
  cardData?: {
    cardNumber: string;
    cardHolder: string;
    expiryMonth: number;
    expiryYear: number;
    cvv: string;
  };

  @ApiProperty({ description: 'Chave PIX (para pagamentos via PIX)', required: false })
  @IsOptional()
  @IsString()
  pixKey?: string;
}