import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/product.entity';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(Product) private productRepository: Repository<Product>,
  ) {}

  async onModuleInit() {
    await this.seed();
  }

  async seed() {
    console.log('🌱 Starting products database seed...');
    
    await this.seedProducts();
    
    console.log('✅ Products database seed completed!');
  }

  private async seedProducts() {
    const productCount = await this.productRepository.count();
    
    if (productCount === 0) {
      console.log('Creating default products...');
      
      const products = [
        {
          name: 'Coxinha Tradicional',
          description: 'A clássica coxinha de frango com massa crocante.',
          price: 4.90,
          image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop',
          isActive: true,
          isOffer: false,
          discount: 0,
          category: 'Salgados Tradicionais',
        },
        {
          name: 'Coxinha Catupiry',
          description: 'A deliciosa coxinha de frango com o toque cremoso do Catupiry.',
          price: 5.50,
          image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop',
          isActive: true,
          isOffer: false,
          discount: 0,
          category: 'Salgados Tradicionais',
        },
        {
          name: 'Coxinha Frango + Cheddar',
          description: 'A combinação perfeita de frango desfiado com queijo cheddar.',
          price: 6.00,
          image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop',
          isActive: true,
          isOffer: false,
          discount: 0,
          category: 'Salgados Especiais',
        },
        {
          name: 'Coxinha Calabresa',
          description: 'Para os amantes de um sabor mais intenso, coxinha de calabresa.',
          price: 6.50,
          image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop',
          isActive: true,
          isOffer: false,
          discount: 0,
          category: 'Salgados Especiais',
        },
        {
          name: 'Coxinha Vegana',
          description: 'Uma opção deliciosa para quem não consome produtos de origem animal.',
          price: 5.90,
          image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop',
          isActive: true,
          isOffer: false,
          discount: 0,
          category: 'Salgados Veganos',
        },
        {
          name: 'Coxinha Doce',
          description: 'Uma sobremesa inusitada e deliciosa: coxinha de doce de leite.',
          price: 4.50,
          image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop',
          isActive: true,
          isOffer: false,
          discount: 0,
          category: 'Doces',
        },
        {
          name: 'Combo Família',
          description: '12 coxinhas variadas para a família toda.',
          price: 29.90,
          image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop',
          isActive: true,
          isOffer: true,
          discount: 0,
          category: 'Combos Promocionais',
        },
        // OFERTAS ESPECIAIS
        {
          name: 'Oferta 1: 3 coxinhas + refri',
          description: '3 coxinhas tradicionais + 1 refrigerante lata.',
          price: 9.90,
          image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop',
          isActive: true,
          isOffer: true,
          discount: 0,
          category: 'Ofertas Imperdíveis',
        },
        {
          name: 'Oferta 2: 5 coxinhas + refri',
          description: '5 coxinhas tradicionais + 1 refrigerante lata.',
          price: 12.90,
          image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop',
          isActive: true,
          isOffer: true,
          discount: 0,
          category: 'Ofertas Imperdíveis',
        },
      ];

      for (const productData of products) {
        const product = this.productRepository.create(productData);
        await this.productRepository.save(product);
      }

      console.log(`✅ ${products.length} products created successfully!`);
    }
  }
}