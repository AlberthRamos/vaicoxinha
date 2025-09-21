import { IsArray, IsString, IsNumber, IsOptional, Min, ArrayMinSize, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @ApiProperty({ description: 'ID do produto' })
  @IsString()
  productId: string;

  @ApiProperty({ description: 'Quantidade do produto' })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Observações do item', required: false })
  @IsOptional()
  @IsString()
  observations?: string;
}

export class CreateOrderDto {
  @ApiProperty({ description: 'ID do usuário' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Itens do pedido' })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ description: 'Endereço de entrega' })
  @IsString()
  deliveryAddress: string;

  @ApiProperty({ description: 'Observações do pedido', required: false })
  @IsOptional()
  @IsString()
  observations?: string;

  @ApiProperty({ description: 'Método de pagamento', required: false })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiProperty({ description: 'Taxa de entrega', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  deliveryFee?: number = 0;
}