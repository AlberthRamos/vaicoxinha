import { IsString, IsNumber, IsOptional, Min, IsArray, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum ProductCategory {
  COXINHA = 'coxinha',
  BEBIDA = 'bebida',
  ACOMPANHAMENTO = 'acompanhamento',
}

export class CreateProductDto {
  @ApiProperty({ description: 'Nome do produto' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Descrição do produto' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Preço do produto' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ description: 'Categoria do produto' })
  @IsEnum(ProductCategory)
  category: ProductCategory;

  @ApiProperty({ description: 'URL da imagem do produto', required: false })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({ description: 'Disponibilidade do produto', default: true })
  @IsOptional()
  available?: boolean = true;

  @ApiProperty({ description: 'Tempo de preparo em minutos', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  preparationTime?: number;

  @ApiProperty({ description: 'Ingredientes do produto', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ingredients?: string[];
}