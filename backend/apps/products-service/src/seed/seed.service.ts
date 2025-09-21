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
          name: 'Coxinha de Frango',
          description: 'Coxinha tradicional de frango desfiado, massa crocante por fora e macia por dentro. O salgado mais pedido do Brasil!',
          price: 6.50,
          image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop',
          isActive: true,
          isOffer: false,
          discount: 0,
          category: 'Salgados Tradicionais',
        },
        {
          name: 'Coxinha de Frango com Catupiry',
          description: 'A clássica coxinha de frango com o toque especial do catupiry. Combinação perfeita que agrada a todos!',
          price: 7.00,
          image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop',
          isActive: true,
          isOffer: false,
          discount: 0,
          category: 'Salgados Tradicionais',
        },
        {
          name: 'Coxinha de Frango com Requeijão',
          description: 'Coxinha de frango desfiado com requeijão cremoso. Uma delícia que derrete na boca!',
          price: 6.80,
          image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop',
          isActive: true,
          isOffer: false,
          discount: 0,
          category: 'Salgados Tradicionais',
        },
        {
          name: 'Coxinha de Calabresa',
          description: 'Coxinha recheada com calabresa defumada e temperos especiais. Para quem gosta de um sabor mais apimentado!',
          price: 7.20,
          image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop',
          isActive: true,
          isOffer: false,
          discount: 0,
          category: 'Salgados Especiais',
        },
        {
          name: 'Coxinha de Queijo',
          description: 'Coxinha recheada com queijo muçarela de alta qualidade. Perfeita para os amantes de queijo!',
          price: 6.80,
          image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop',
          isActive: true,
          isOffer: false,
          discount: 0,
          category: 'Salgados Especiais',
        },
        {
          name: 'Coxinha de Carne Seca',
          description: 'Coxinha recheada com carne seca desfiada e temperada. Um sabor nordestino que conquista paladares!',
          price: 8.50,
          image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop',
          isActive: true,
          isOffer: false,
          discount: 0,
          category: 'Salgados Especiais',
        },
        {
          name: 'Coxinha de Camarão',
          description: 'Coxinha recheada com camarão fresco e temperos finos. Uma iguaria do mar que não pode faltar!',
          price: 9.50,
          image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop',
          isActive: true,
          isOffer: false,
          discount: 0,
          category: 'Salgados Especiais',
        },
        // OFERTAS ESPECIAIS
        {
          name: 'Combo Família - 12 Coxinhas',
          description: 'Combo especial com 12 coxinhas de frango (6 tradicionais + 6 com catupiry). Economize e aproveite com a família!',
          price: 70.00,
          image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop',
          isActive: true,
          isOffer: true,
          discount: 15,
          category: 'Combos Promocionais',
        },
        {
          name: 'Combo Dupla - 2 Coxinhas + Bebida',
          description: '2 coxinhas de frango com catupiry + 1 refrigerante lata. A combinação perfeita para o seu lanche!',
          price: 18.00,
          image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop',
          isActive: true,
          isOffer: true,
          discount: 10,
          category: 'Combos Promocionais',
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