import { Controller, Get, Post, Body } from '@nestjs/common';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isOffer?: boolean;
  originalPrice?: number;
}

@Controller('api/products')
export class ProductsController {
  private products: Product[] = [
    {
      id: '1',
      name: 'Coxinha Tradicional',
      description: 'Coxinha de frango com massa crocante',
      price: 8.90,
      image: '/images/coxinha-tradicional.jpg',
      category: 'salgados'
    },
    {
      id: '2',
      name: 'Coxinha de Catupiry',
      description: 'Coxinha de frango com catupiry',
      price: 9.90,
      image: '/images/coxinha-catupiry.jpg',
      category: 'salgados'
    },
    {
      id: '3',
      name: 'Coxinha de Calabresa',
      description: 'Coxinha de calabresa com cebola',
      price: 10.90,
      image: '/images/coxinha-calabresa.jpg',
      category: 'salgados'
    },
    {
      id: '4',
      name: 'Coxinha de Queijo',
      description: 'Coxinha de queijo derretido',
      price: 9.90,
      image: '/images/coxinha-queijo.jpg',
      category: 'salgados'
    },
    {
      id: '5',
      name: 'Coxinha de Camarão',
      description: 'Coxinha de camarão com requeijão',
      price: 12.90,
      image: '/images/coxinha-camarao.jpg',
      category: 'salgados'
    },
    {
      id: '6',
      name: 'Coxinha de Palmito',
      description: 'Coxinha de palmito com ervas finas',
      price: 11.90,
      image: '/images/coxinha-palmito.jpg',
      category: 'salgados'
    },
    {
      id: '7',
      name: 'Coxinha de Bacalhau',
      description: 'Coxinha de bacalhau com batata',
      price: 13.90,
      image: '/images/coxinha-bacalhau.jpg',
      category: 'salgados'
    },
    {
      id: '8',
      name: 'Combo Família (10 unidades)',
      description: 'Mix de coxinhas tradicionais',
      price: 79.90,
      originalPrice: 89.90,
      image: '/images/combo-familia.jpg',
      category: 'combos',
      isOffer: true
    },
    {
      id: '9',
      name: 'Combo Duplo',
      description: '2 coxinhas tradicionais + bebida',
      price: 22.90,
      originalPrice: 26.70,
      image: '/images/combo-duplo.jpg',
      category: 'combos',
      isOffer: true
    }
  ];

  @Get()
  getAllProducts(): Product[] {
    return this.products;
  }

  @Get('offers')
  getOffers(): Product[] {
    return this.products.filter(product => product.isOffer);
  }

  @Get(':id')
  getProductById(@Body() id: string): Product | undefined {
    return this.products.find(product => product.id === id);
  }
}