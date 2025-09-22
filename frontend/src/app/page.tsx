'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Star, Clock, Truck, Shield, CreditCard, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard/ProductCard';
import { ProductModal } from '@/components/ProductModal/ProductModal';
import { UnifiedLoadingScreen } from '@/components/UnifiedLoadingScreen/UnifiedLoadingScreen';
import { useCart } from '@/contexts/CartContext';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { productsService } from '@/services/productsService';


interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  rating: number;
  prepTime: string;
  isAvailable: boolean;
  isFeatured: boolean;
  isNew: boolean;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  count: number;
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [isLoading, setIsLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [menuProducts, setMenuProducts] = useState<Product[]>([]);
  const [currentProductSlide, setCurrentProductSlide] = useState(0);
  
  const { addToCart } = useCart();
  usePerformanceMonitor();

  const heroSlides = [
    {
      id: 1,
      title: 'Coxinhas Artesanais',
      subtitle: 'Feitas com amor e ingredientes selecionados',
      image: '/images/hero-coxinha-1.jpg',
      cta: 'Ver Cardápio',
      href: '/cardapio',
    },
    {
      id: 2,
      title: 'Entrega Rápida',
      subtitle: 'Receba em até 30 minutos na sua casa',
      image: '/images/hero-delivery.jpg',
      cta: 'Fazer Pedido',
      href: '/cardapio',
    },
    {
      id: 3,
      title: 'Pagamento Facilitado',
      subtitle: 'PIX, cartão ou dinheiro - você escolhe!',
      image: '/images/hero-payment.jpg',
      cta: 'Comprar Agora',
      href: '/cardapio',
    },
  ];

  const features = [
    {
      icon: Clock,
      title: 'Entrega Rápida',
      description: 'Até 30 minutos',
      color: 'text-blue-600',
    },
    {
      icon: Shield,
      title: 'Pagamento Seguro',
      description: 'PIX e cartões',
      color: 'text-green-600',
    },
    {
      icon: Truck,
      title: 'Frete Grátis',
      description: 'Acima de R$ 50',
      color: 'text-orange-600',
    },
    {
      icon: Star,
      title: '5 Estrelas',
      description: 'Avaliação dos clientes',
      color: 'text-yellow-500',
    },
  ];

  useEffect(() => {
    loadInitialData();
    
    // Auto-play do hero
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Auto-play do banner de produtos
  useEffect(() => {
    if (menuProducts.length > 0) {
      const interval = setInterval(() => {
        setCurrentProductSlide((prev) => (prev + 1) % menuProducts.length);
      }, 4000);
      
      return () => clearInterval(interval);
    }
  }, [menuProducts]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      
      // Carregar produtos em destaque
      const featuredProducts = await productsService.getFeaturedProducts();
      setProducts(featuredProducts);
      
      // Carregar 4 primeiros produtos do cardápio para o banner
      const menuResponse = await productsService.getProducts({ available: true }, { page: 1, limit: 4 });
      setMenuProducts(menuResponse.products);
      
      // Carregar categorias - usando dados mockados temporariamente
      // TODO: Implementar endpoint de categorias no backend
      const mockCategories = [
        { id: 'coxinhas', name: 'Coxinhas', icon: '🍗', count: 12 },
        { id: 'pasteis', name: 'Pastéis', icon: '🥟', count: 8 },
        { id: 'bebidas', name: 'Bebidas', icon: '🥤', count: 6 },
        { id: 'sobremesas', name: 'Sobremesas', icon: '🍰', count: 4 },
        { id: 'combos', name: 'Combos', icon: '📦', count: 5 },
      ];
      setCategories(mockCategories);
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = (product: Product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.image,
    });
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'name':
        return a.name.localeCompare(b.name);
      case 'rating':
        return b.rating - a.rating;
      default:
        return b.isFeatured ? 1 : -1;
    }
  });

  if (isLoading) {
    return <UnifiedLoadingScreen isLoading={true} context="products" />;
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[400px] bg-gradient-to-r from-orange-400 to-red-500 overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        
        <div className="relative container mx-auto px-4 h-full flex items-center">
          <div className="max-w-2xl text-white">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
              {heroSlides[currentSlide].title}
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90">
              {heroSlides[currentSlide].subtitle}
            </p>
            <Link
              href={heroSlides[currentSlide].href}
              className="inline-flex items-center px-8 py-4 bg-white text-orange-600 rounded-full font-semibold text-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-50"
            >
              {heroSlides[currentSlide].cta}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>

        {/* Navigation Dots */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlide ? 'bg-white' : 'bg-white bg-opacity-50'
              }`}
              aria-label={`Ir para slide ${index + 1}`}
            />
          ))}
        </div>


      </section>

      {/* Banner de Produtos do Cardápio */}
      {menuProducts.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Nossos Destaques
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Os sabores mais pedidos da nossa cozinha, preparados com carinho para você
              </p>
            </div>

            <div className="relative max-w-6xl mx-auto">
              <div className="overflow-hidden rounded-2xl">
                <div 
                  className="flex transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentProductSlide * 100}%)` }}
                >
                  {menuProducts.map((product) => (
                    <div key={product.id} className="w-full flex-shrink-0">
                      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                        <div className="md:flex">
                          <div className="md:w-1/2">
                            <img 
                              src={product.image} 
                              alt={product.name}
                              className="w-full h-64 md:h-80 object-cover"
                            />
                          </div>
                          <div className="md:w-1/2 p-8 flex flex-col justify-center">
                            <div className="mb-4">
                              <span className="inline-block px-3 py-1 bg-orange-100 text-orange-800 text-sm font-medium rounded-full mb-2">
                                {product.category}
                              </span>
                              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                                {product.name}
                              </h3>
                              <p className="text-gray-600 mb-4">
                                {product.description}
                              </p>
                            </div>
                            
                            <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center">
                                <div className="flex text-yellow-400 mr-2">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating || 0) ? 'fill-current' : 'text-gray-300'}`} />
                                  ))}
                                </div>
                                <span className="text-sm text-gray-600">
                                  {product.rating?.toFixed(1) || '5.0'}
                                </span>
                              </div>
                              <div className="text-sm text-gray-500">
                                ⏱️ {product.prepTime}
                              </div>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="text-3xl font-bold text-orange-600">
                                R$ {product.price.toFixed(2)}
                              </div>
                              <button
                                onClick={() => handleAddToCart(product)}
                                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-full font-semibold transition-colors duration-300 flex items-center"
                              >
                                Adicionar ao Carrinho
                                <ArrowRight className="ml-2 w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Dots */}
              <div className="flex justify-center mt-8 space-x-2">
                {menuProducts.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentProductSlide(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                      index === currentProductSlide ? 'bg-orange-500' : 'bg-gray-300'
                    }`}
                    aria-label={`Ir para produto ${index + 1}`}
                  />
                ))}
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={() => setCurrentProductSlide((prev) => (prev - 1 + menuProducts.length) % menuProducts.length)}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-3 shadow-lg hover:bg-gray-100 transition-colors duration-300"
                aria-label="Produto anterior"
              >
                <ChevronLeft className="w-6 h-6 text-gray-600" />
              </button>
              <button
                onClick={() => setCurrentProductSlide((prev) => (prev + 1) % menuProducts.length)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-3 shadow-lg hover:bg-gray-100 transition-colors duration-300"
                aria-label="Próximo produto"
              >
                <ChevronRight className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="text-center mt-8">
              <Link
                href="/cardapio"
                className="inline-flex items-center px-6 py-3 bg-orange-500 text-white rounded-full font-semibold hover:bg-orange-600 transition-colors duration-300"
              >
                Ver Cardápio Completo
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Banner de Taxa Grátis para Primeiro Pedido */}
      <section className="py-12 bg-gradient-to-r from-orange-400 to-orange-600">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white bg-opacity-20 mb-4">
              <span className="text-2xl">🎉</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Taxa de Entrega Grátis no Primeiro Pedido!
            </h2>
            <p className="text-lg text-white opacity-90 mb-6 max-w-2xl mx-auto">
              Seja bem-vindo! Aproveite nossa oferta especial e receba seu primeiro pedido sem pagar taxa de entrega. 
              É só fazer seu cadastro no carrinho e aproveitar!
            </p>
            <Link
              href="/cardapio"
              className="inline-flex items-center px-8 py-4 bg-white text-orange-600 rounded-full font-semibold text-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-50"
            >
              Fazer Primeiro Pedido
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4 ${feature.color}`}>
                  <feature.icon className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-r from-orange-400 to-red-500">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Pronto para experimentar?
          </h2>
          <p className="text-xl text-white opacity-90 mb-8 max-w-2xl mx-auto">
            Faça seu pedido agora e receba em até 30 minutos!
          </p>
          <Link
            href="/cardapio"
            className="inline-flex items-center px-8 py-4 bg-white text-orange-600 rounded-full font-semibold text-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-white focus:ring-opacity-50"
          >
            Ver Cardápio Completo
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}
    </div>
  );
}
