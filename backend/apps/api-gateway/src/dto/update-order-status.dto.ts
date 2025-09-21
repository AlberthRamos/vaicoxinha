import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['received', 'preparing', 'out-for-delivery', 'delivered', 'cancelled'])
  status: string;
}