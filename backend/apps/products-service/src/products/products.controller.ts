import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ProductsService, CreateProductDto, UpdateProductDto } from './products.service';
import { Product } from '../entities/product.entity';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // REST Endpoints
  @Get()
  async getAllProducts(): Promise<Product[]> {
    return this.productsService.findAll();
  }

  @Get(':id')
  async getProductById(@Param('id') id: string): Promise<Product> {
    return this.productsService.findOne(id);
  }

  @Get('category/:category')
  async getProductsByCategory(@Param('category') category: string): Promise<Product[]> {
    return this.productsService.findByCategory(category);
  }

  @Get('promotional/offers')
  async getPromotionalProducts(): Promise<Product[]> {
    return this.productsService.findPromotional();
  }

  @MessagePattern({ cmd: 'create_product' })
  async create(@Payload() createProductDto: CreateProductDto): Promise<Product> {
    return this.productsService.create(createProductDto);
  }

  @MessagePattern({ cmd: 'find_all_products' })
  async findAll(): Promise<Product[]> {
    return this.productsService.findAll();
  }

  @MessagePattern({ cmd: 'find_one_product' })
  async findOne(@Payload() id: string): Promise<Product> {
    return this.productsService.findOne(id);
  }

  @MessagePattern({ cmd: 'update_product' })
  async update(@Payload() data: { id: string; updateProductDto: UpdateProductDto }): Promise<Product> {
    return this.productsService.update(data.id, data.updateProductDto);
  }

  @MessagePattern({ cmd: 'remove_product' })
  async remove(@Payload() id: string): Promise<Product> {
    return this.productsService.remove(id);
  }

  @MessagePattern({ cmd: 'find_products_by_category' })
  async findByCategory(@Payload() category: string): Promise<Product[]> {
    return this.productsService.findByCategory(category);
  }

  @MessagePattern({ cmd: 'find_promotional_products' })
  async findPromotional(): Promise<Product[]> {
    return this.productsService.findPromotional();
  }

}