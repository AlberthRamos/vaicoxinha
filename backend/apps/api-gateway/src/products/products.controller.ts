import { Controller, Get, Post, Put, Delete, Body, Param, HttpStatus, HttpException, Inject, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CreateProductDto } from '../common/dto';
import { WinstonLoggerService } from '../common/logger';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(
    @Inject('PRODUCTS_SERVICE') private client: ClientProxy,
    private readonly logger: WinstonLoggerService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo produto' })
  @ApiResponse({ status: 201, description: 'Produto criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  async create(@Body() createProductDto: CreateProductDto) {
    try {
      this.logger.log(`Criando novo produto: ${createProductDto.name}`, 'ProductsController');
      const result = await this.client.send({ cmd: 'create_product' }, createProductDto).toPromise();
      this.logger.log(`Produto criado com sucesso: ${result?.id}`, 'ProductsController');
      return result;
    } catch (error) {
      this.logger.error('Erro ao criar produto', error.stack, 'ProductsController');
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os produtos' })
  @ApiQuery({ name: 'category', required: false })
  @ApiResponse({ status: 200, description: 'Lista de produtos.' })
  async findAll(@Query('category') category?: string) {
    try {
      this.logger.log('Listando todos os produtos', 'ProductsController');
      let result;
      if (category) {
        result = await this.client.send({ cmd: 'find_products_by_category' }, category).toPromise();
      } else {
        result = await this.client.send({ cmd: 'find_all_products' }, {}).toPromise();
      }
      this.logger.log(`Retornados ${result?.length || 0} produtos`, 'ProductsController');
      return result;
    } catch (error) {
      this.logger.error('Erro ao listar produtos', error.stack, 'ProductsController');
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('promotional')
  @ApiOperation({ summary: 'Get promotional products' })
  @ApiResponse({ status: 200, description: 'Return promotional products.' })
  async findPromotional() {
    try {
      return await this.client.send({ cmd: 'find_promotional_products' }, {}).toPromise();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar produto por ID' })
  @ApiResponse({ status: 200, description: 'Produto encontrado.' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado.' })
  async findOne(@Param('id') id: string) {
    try {
      this.logger.log(`Buscando produto com ID: ${id}`, 'ProductsController');
      const result = await this.client.send('get_product_by_id', id).toPromise();
      this.logger.log(`Produto encontrado: ${result?.name || 'N/A'}`, 'ProductsController');
      return result;
    } catch (error) {
      this.logger.error(`Erro ao buscar produto ${id}`, error.stack, 'ProductsController');
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update product' })
  @ApiResponse({ status: 200, description: 'Product updated successfully.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  async update(@Param('id') id: string, @Body() updateProductDto: CreateProductDto) {
    try {
      return await this.client.send({ cmd: 'update_product' }, { id, ...updateProductDto }).toPromise();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product' })
  @ApiResponse({ status: 200, description: 'Product deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  async remove(@Param('id') id: string) {
    try {
      return await this.client.send({ cmd: 'remove_product' }, id).toPromise();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }

  @Post('seed')
  @ApiOperation({ summary: 'Seed products database' })
  @ApiResponse({ status: 201, description: 'Products seeded successfully.' })
  async seedProducts() {
    try {
      return await this.client.send({ cmd: 'seed_products' }, {}).toPromise();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}