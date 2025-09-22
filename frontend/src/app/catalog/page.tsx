'use client';

import { useState, useEffect } from 'react';
import { Package, Clock, MapPin, Phone, Star, Search, Filter } from 'lucide-react';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { UnifiedLoadingScreen } from '@/components/UnifiedLoadingScreen/UnifiedLoadingScreen';

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
  ingredients?: string[];
  allergens?: string[];
  nutritionalInfo?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const performanceMetrics = usePerformanceMonitor();

  // Mock products data
  const mockProducts: Product[] = [
    {
      id: '1',
      name: 'Coxinha de Frango com Catupiry',
      description: 'A clássica coxinha de frango desfiado com o toque especial do catupiry',
      price: 8.90,
      originalPrice: 10.90,
      image: '/images/coxinha-frango.jpg',
      category: 'coxinhas',
      rating: 4.8,
      prepTime: '10-15 min',
      isAvailable: true,
      isFeatured: true,
      isNew: false,
      ingredients: ['Frango desfiado', 'Catupiry', 'Massa de coxinha', 'Especiarias'],
      allergens: ['Glúten', 'Lactose'],
      nutritionalInfo: { calories: 280, protein: 12, carbs: 25, fat: 15 }
    },
    {
      id: '2',
      name: 'Coxinha de Costela',
      description: 'Coxinha recheada com costela desfiada no molho barbecue',
      price: 12.90,
      image: '/images/coxinha-costela.jpg',
      category: 'coxinhas',
      rating: 4.9,
      prepTime: '12-18 min',
      isAvailable: true,
      isFeatured: true,
      isNew: true,
      ingredients: ['Costela desfiada', 'Molho barbecue', 'Massa de coxinha', 'Cebolinha'],
      allergens: ['Glúten'],
      nutritionalInfo: { calories: 320, protein: 18, carbs: 22, fat: 18 }
    },
    {
      id: '3',
      name: 'Coxinha Vegetariana',
      description: 'Opção vegetariana com recheio de palmito e legumes',
      price: 9.90,
      image: '/images/coxinha-vegetariana.jpg',
      category: 'coxinhas',
      rating: 4.5,
      prepTime: '8-12 min',
      isAvailable: true,
      isFeatured: false,
      isNew: false,
      ingredients: ['Palmito', 'Legumes', 'Massa de coxinha', 'Ervas finas'],
      allergens: ['Glúten'],
      nutritionalInfo: { calories: 220, protein: 8, carbs: 28, fat: 9 }
    },
    {
      id: '4',
      name: 'Kibe de Carne',
      description: 'Kibe crocante por fora, macio por dentro, recheado com carne moída',
      price: 7.90,
      image: '/images/kibe.jpg',
      category: 'salgados',
      rating: 4.7,
      prepTime: '8-10 min',
      isAvailable: true,
      isFeatured: false,
      isNew: false,
      ingredients: ['Carne moída', 'Trigo para quibe', 'Cebola', 'Especiarias árabes'],
      allergens: ['Glúten'],
      nutritionalInfo: { calories: 180, protein: 10, carbs: 20, fat: 7 }
    },
    {
      id: '5',
      name: 'Bolinha de Queijo',
      description: 'Bolinha crocante recheada com queijo derretido',
      price: 6.90,
      image: '/images/bolinha-queijo.jpg',
      category: 'salgados',
      rating: 4.6,
      prepTime: '6-8 min',
      isAvailable: true,
      isFeatured: false,
      isNew: true,
      ingredients: ['Queijo', 'Massa de bolinha', 'Orégano'],
      allergens: ['Glúten', 'Lactose'],
      nutritionalInfo: { calories: 150, protein: 6, carbs: 18, fat: 6 }
    },
    {
      id: '6',
      name: 'Enroladinho de Salsicha',
      description: 'Massa enrolada com salsicha, perfeito para petiscar',
      price: 5.90,
      image: '/images/enroladinho.jpg',
      category: 'salgados',
      rating: 4.4,
      prepTime: '5-7 min',
      isAvailable: true,
      isFeatured: false,
      isNew: false,
      ingredients: ['Salsicha', 'Massa de enroladinho', 'Orégano'],
      allergens: ['Glúten'],
      nutritionalInfo: { calories: 130, protein: 5, carbs: 16, fat: 5 }
    }
  ];

  // Cart functionality (mock implementation)
  const addToCart = (product: Product) => {
    console.log('Adicionando ao carrinho:', product.name);
    // Implementação real do carrinho será adicionada quando o contexto estiver disponível
  };

  // Quick view functionality (mock implementation)
  const openQuickView = (product: Product) => {
    console.log('Visualização rápida:', product.name);
    // Implementação real da visualização rápida será adicionada quando o modal estiver disponível
  };

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      try {
        setProducts(mockProducts);
        setLoading(false);
      } catch (error) {
        setError('Erro ao carregar produtos');
        setLoading(false);
      }
    }, 1000);
  }, []);

  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

  const categories = [
    { value: 'all', label: 'Todos os Produtos' },
    { value: 'coxinhas', label: 'Coxinhas' },
    { value: 'salgados', label: 'Salgados' },
  ];

  const sortOptions = [
    { value: 'name', label: 'Nome' },
    { value: 'price-low', label: 'Menor Preço' },
    { value: 'price-high', label: 'Maior Preço' },
    { value: 'rating', label: 'Avaliação' },
  ];

  if (loading) {
    return <UnifiedLoadingScreen isLoading={loading} />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erro ao carregar produtos</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Nossos Produtos</h1>
              <p className="text-gray-600 mt-1">Descubra nossa seleção de coxinhas e salgados especiais</p>
            </div>
            
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  aria-label="Buscar produtos"
                />
              </div>
              
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                aria-label="Abrir filtros"
              >
                <Filter className="w-5 h-5" />
                <span>Filtros</span>
              </button>
            </div>
          </div>

          {/* Filter Panel */}
          <div className={`mt-4 p-4 bg-gray-50 rounded-lg ${isFilterOpen ? 'block' : 'hidden'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  aria-label="Selecionar categoria"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ordenar por</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  aria-label="Ordenar produtos"
                >
                  {sortOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum produto encontrado</h3>
            <p className="text-gray-600">Tente ajustar seus filtros de busca</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-xl shadow-sm hover:shadow-md border">
                <div className="aspect-square relative overflow-hidden rounded-t-xl">
                  <img
                    src={product.image || '/images/placeholder-coxinha.jpg'}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  {product.isNew && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                      Novo
                    </div>
                  )}
                  {product.isFeatured && (
                    <div className="absolute top-2 left-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                      Destaque
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
                    {product.originalPrice && (
                      <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-semibold">
                        Promoção
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
                  
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-semibold">{product.rating}</span>
                    </div>
                    <span className="text-sm text-gray-500">•</span>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{product.prepTime}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-gray-900">
                        R$ {product.price.toFixed(2)}
                      </span>
                      {product.originalPrice && (
                        <span className="text-sm text-gray-500 line-through">
                          R$ {product.originalPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                    {!product.isAvailable && (
                      <span className="text-xs text-red-600 font-semibold">
                        Indisponível
                      </span>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => openQuickView(product)}
                      className="flex-1 px-3 py-2 text-orange-500 border border-orange-500 rounded-lg hover:bg-orange-50 text-sm font-medium"
                      aria-label={`Visualizar ${product.name}`}
                    >
                      Ver Detalhes
                    </button>
                    <button
                      onClick={() => addToCart(product)}
                      disabled={!product.isAvailable}
                      className="flex-1 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      aria-label={`Adicionar ${product.name} ao carrinho`}
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Performance Metrics */}
      {performanceMetrics && (
        <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border">
          <h4 className="font-semibold text-sm mb-2">Métricas de Performance</h4>
          <div className="text-xs space-y-1">
            <div>Tempo de carregamento: {performanceMetrics.loadTime}ms</div>
            <div>Tempo de renderização: {performanceMetrics.renderTime}ms</div>
            <div>Produtos carregados: {filteredProducts.length}</div>
          </div>
        </div>
      )}
    </div>
  );
}