import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';

export interface CreateProductDto {
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  available: boolean;
  promotional?: boolean;
  promotionalPrice?: number;
  promotionalText?: string;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product) private productRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const product = this.productRepository.create(createProductDto);
    return this.productRepository.save(product);
  }

  async findAll(): Promise<Product[]> {
    return this.productRepository.find();
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    await this.productRepository.update(id, updateProductDto);
    const updatedProduct = await this.findOne(id);
    return updatedProduct;
  }

  async remove(id: string): Promise<Product> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
    return product;
  }

  async findByCategory(category: string): Promise<Product[]> {
    return this.productRepository.find({ where: { category } });
  }

  async findPromotional(): Promise<Product[]> {
    return this.productRepository.find({ where: { promotional: true } });
  }

  async seedProducts(): Promise<void> {
    const existingProducts = await this.productRepository.count();
    
    if (existingProducts > 0) {
      console.log('Products already seeded');
      return;
    }

    const products = [
      {
        name: 'Coxinha Tradicional',
        description: 'Coxinha de frango tradicional, crocante por fora e macia por dentro',
        price: 8.90,
        image: 'https://via.placeholder.com/300x200?text=Coxinha+Tradicional',
        category: 'salgados',
        available: true,
        promotional: true,
        promotionalPrice: 7.90,
        promotionalText: 'Promoção do Dia',
      },
      {
        name: 'Coxinha de Frango com Catupiry',
        description: 'Coxinha recheada com frango desfiado e catupiry',
        price: 9.90,
        image: 'https://via.placeholder.com/300x200?text=Coxinha+Catupiry',
        category: 'salgados',
        available: true,
        promotional: true,
        promotionalPrice: 8.90,
        promotionalText: 'Oferta Especial',
      },
      {
        name: 'Coxinha de Calabresa',
        description: 'Coxinha recheada com calabresa e queijo',
        price: 10.90,
        image: 'https://via.placeholder.com/300x200?text=Coxinha+Calabresa',
        category: 'salgados',
        available: true,
        promotional: false,
      },
      {
        name: 'Coxinha de Queijo',
        description: 'Coxinha vegetariana recheada com queijo',
        price: 9.50,
        image: 'https://via.placeholder.com/300x200?text=Coxinha+Queijo',
        category: 'salgados',
        available: true,
        promotional: false,
      },
      {
        name: 'Refrigerante Lata',
        description: 'Refrigerante em lata 350ml',
        price: 5.00,
        image: 'https://via.placeholder.com/300x200?text=Refrigerante',
        category: 'bebidas',
        available: true,
        promotional: true,
        promotionalPrice: 4.50,
        promotionalText: 'Combo do Dia',
      },
      {
        name: 'Suco Natural',
        description: 'Suco natural de laranja 300ml',
        price: 7.00,
        image: 'https://via.placeholder.com/300x200?text=Suco+Natural',
        category: 'bebidas',
        available: true,
        promotional: false,
      },
      {
        name: 'Água Mineral',
        description: 'Água mineral sem gás 500ml',
        price: 3.50,
        image: 'https://via.placeholder.com/300x200?text=Agua+Mineral',
        category: 'bebidas',
        available: true,
        promotional: false,
      },
      {
        name: 'Coxinha Crocante Especial',
        description: 'Coxinha especial com massa extra crocante',
        price: 11.90,
        image: 'https://via.placeholder.com/300x200?text=Coxinha+Especial',
        category: 'salgados',
        available: true,
        promotional: false,
      },
    ];

    await this.productRepository.save(products);
    console.log('Products seeded successfully');
  }
}