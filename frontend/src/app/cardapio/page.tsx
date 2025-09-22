'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Star, Clock, DollarSign, Grid, List, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { ProductCard } from '@/components/ProductCard/ProductCard';
import { ProductModal } from '@/components/ProductModal/ProductModal';
import { UnifiedLoadingScreen } from '@/components/UnifiedLoadingScreen/UnifiedLoadingScreen';
import { useCart } from '@/contexts/CartContext';
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

export default function CardapioPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(100);

  const { addToCart } = useCart();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      
      // Carregar todos os produtos
      const allProducts = await productsService.getAllProducts();
      setProducts(allProducts);
      
      // Calcular faixa de preços
      const prices = allProducts.map(p => p.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      setMinPrice(minPrice);
      setMaxPrice(maxPrice);
      setPriceRange([minPrice, maxPrice]);
      
      // Agrupar por categoria e contar
      const categoryCounts = allProducts.reduce((acc, product) => {
        acc[product.category] = (acc[product.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const categoryMap: Record<string, { name: string; icon: string }> = {
        'coxinhas': { name: 'Coxinhas', icon: '🍗' },
        'pasteis': { name: 'Pastéis', icon: '/Icon.png' },
        'bebidas': { name: 'Bebidas', icon: '🥤' },
        'sobremesas': { name: 'Sobremesas', icon: '🍰' },
        'combos': { name: 'Combos', icon: '📦' },
        'salgados': { name: 'Salgados', icon: '🥐' },
        'lanches': { name: 'Lanches', icon: '🍔' },
      };
      
      const categoriesData = Object.entries(categoryCounts).map(([id, count]) => ({
        id,
        name: categoryMap[id]?.name || id.charAt(0).toUpperCase() + id.slice(1),
        icon: categoryMap[id]?.icon || '🍽️',
        count
      }));
      
      setCategories(categoriesData);
      
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
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

  const handleAddComboToCart = (comboName: string, comboPrice: number, comboDescription: string) => {
    const comboId = `combo-${comboName.toLowerCase().replace(/\s+/g, '-')}`;
    addToCart({
      id: comboId,
      name: `Combo ${comboName}`,
      price: comboPrice,
      quantity: 1,
      image: '/api/placeholder/300/200',
    });
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
    return matchesSearch && matchesCategory && matchesPrice;
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
      case 'prep-time':
        return parseInt(a.prepTime) - parseInt(b.prepTime);
      default:
        return b.isFeatured ? 1 : -1;
    }
  });

  if (isLoading) {
    return <UnifiedLoadingScreen isLoading={true} context="catalog" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Delícias do Vai Coxinha</h1>
            <p className="text-gray-600"><Image src="/Icon.png" alt="Vai Coxinha" width={20} height={20} className="inline mr-1" /> Coxinhas artesanais e combos imperdíveis</p>
          </div>
        </div>
      </div>





      {/* Vai Coxinha Combos Section */}
      <div className="container mx-auto px-4 py-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {/* Vai Simples */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-orange-100 hover:border-orange-300 transition-colors">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2"><Image src="/Icon.png" alt="Vai Coxinha" width={24} height={24} className="inline mr-2" /> Vai Simples</h3>
              <div className="text-sm text-gray-600 mb-4">
                <p>• 3 coxinhas grandes de frango tradicional</p>
                <p>• 1 Coca-Cola lata (350ml)</p>
              </div>
              <div className="text-2xl font-bold text-orange-600 mb-4">R$ 9,00</div>
              <button 
                onClick={() => handleAddComboToCart('Vai Simples', 9.00, '3 coxinhas grandes de frango tradicional + 1 Coca-Cola lata (350ml)')}
                className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors font-semibold"
              >
                Adicionar ao Carrinho
              </button>
            </div>
          </div>

          {/* Vai Dupla */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-orange-100 hover:border-orange-300 transition-colors">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2"><Image src="/Icon.png" alt="Vai Coxinha" width={24} height={24} className="inline mr-2" /> Vai Dupla</h3>
              <div className="text-sm text-gray-600 mb-4">
                <p>• 5 coxinhas grandes (frango, frango c/ catupiry, queijo, calabresa, carne seca)</p>
                <p>• 1 Coca-Cola lata (350ml)</p>
              </div>
              <div className="text-2xl font-bold text-orange-600 mb-4">R$ 14,00</div>
              <button 
                onClick={() => handleAddComboToCart('Vai Dupla', 14.00, '5 coxinhas grandes (frango, frango c/ catupiry, queijo, calabresa, carne seca) + 1 Coca-Cola lata (350ml)')}
                className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors font-semibold"
              >
                Adicionar ao Carrinho
              </button>
            </div>
          </div>

          {/* Vai Trio */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-orange-100 hover:border-orange-300 transition-colors">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2"><Image src="/Icon.png" alt="Vai Coxinha" width={24} height={24} className="inline mr-2" /> Vai Trio</h3>
              <div className="text-sm text-gray-600 mb-4">
                <p>• 6 coxinhas grandes (frango, queijo, calabresa, carne seca, catupiry, 4 queijos)</p>
                <p>• 1 Coca-Cola lata (350ml)</p>
              </div>
              <div className="text-2xl font-bold text-orange-600 mb-4">R$ 18,00</div>
              <button 
                onClick={() => handleAddComboToCart('Vai Trio', 18.00, '6 coxinhas grandes (frango, queijo, calabresa, carne seca, catupiry, 4 queijos) + 1 Coca-Cola lata (350ml)')}
                className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors font-semibold"
              >
                Adicionar ao Carrinho
              </button>
            </div>
          </div>

          {/* Vai Quarteto */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-orange-100 hover:border-orange-300 transition-colors">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2"><Image src="/Icon.png" alt="Vai Coxinha" width={24} height={24} className="inline mr-2" /> Vai Quarteto</h3>
              <div className="text-sm text-gray-600 mb-4">
                <p>• 8 coxinhas grandes (frango, carne seca, catupiry, 4 queijos, calabresa, frango c/ cheddar, palmito, milho)</p>
                <p>• 1 Coca-Cola lata (350ml)</p>
              </div>
              <div className="text-2xl font-bold text-orange-600 mb-4">R$ 22,00</div>
              <button 
                onClick={() => handleAddComboToCart('Vai Quarteto', 22.00, '8 coxinhas grandes (frango, carne seca, catupiry, 4 queijos, calabresa, frango c/ cheddar, palmito, milho) + 1 Coca-Cola lata (350ml)')}
                className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors font-semibold"
              >
                Adicionar ao Carrinho
              </button>
            </div>
          </div>

          {/* Vai Veggie */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-orange-100 hover:border-orange-300 transition-colors">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">🌱 Vai Veggie</h3>
              <div className="text-sm text-gray-600 mb-4">
                <p>• 5 coxinhas grandes vegetarianas (palmito, milho c/ catupiry, brócolis c/ queijo, 4 queijos, espinafre)</p>
                <p>• 1 Coca-Cola lata (350ml)</p>
              </div>
              <div className="text-2xl font-bold text-orange-600 mb-4">R$ 13,00</div>
              <button 
                onClick={() => handleAddComboToCart('Vai Veggie', 13.00, '5 coxinhas grandes vegetarianas (palmito, milho c/ catupiry, brócolis c/ queijo, 4 queijos, espinafre) + 1 Coca-Cola lata (350ml)')}
                className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors font-semibold"
              >
                Adicionar ao Carrinho
              </button>
            </div>
          </div>

          {/* Vai Família */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-orange-100 hover:border-orange-300 transition-colors md:col-span-2 lg:col-span-1">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">👨‍👩‍👧‍👦 Vai Família</h3>
              <div className="text-sm text-gray-600 mb-4">
                <p>• 15 coxinhas grandes sortidas</p>
                <p>• (frango, cheddar, carne seca, calabresa, 4 queijos, palmito, frango c/ catupiry, milho, camarão, brócolis, queijo + frango cremoso, carne seca c/ catupiry, calabresa, catupiry, frango tradicional)</p>
                <p>• 1 Coca-Cola lata (350ml)</p>
              </div>
              <div className="text-2xl font-bold text-orange-600 mb-4">R$ 35,00</div>
              <button 
                onClick={() => handleAddComboToCart('Vai Família', 35.00, '15 coxinhas grandes sortidas (frango, cheddar, carne seca, calabresa, 4 queijos, palmito, frango c/ catupiry, milho, camarão, brócolis, queijo + frango cremoso, carne seca c/ catupiry, calabresa, catupiry, frango tradicional) + 1 Coca-Cola lata (350ml)')}
                className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors font-semibold"
              >
                Adicionar ao Carrinho
              </button>
            </div>
          </div>

          {/* Vai Premium */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-orange-100 hover:border-orange-300 transition-colors md:col-span-2 lg:col-span-1">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">✨ Vai Premium</h3>
              <div className="text-sm text-gray-600 mb-4">
                <p>• 10 coxinhas grandes especiais</p>
                <p>• (camarão, frango c/ catupiry, carne seca, 4 queijos, calabresa, cheddar, frango cremoso, palmito, frango com milho, catupiry + carne seca)</p>
                <p>• 1 Coca-Cola lata (350ml)</p>
              </div>
              <div className="text-2xl font-bold text-orange-600 mb-4">R$ 28,00</div>
              <button 
                onClick={() => handleAddComboToCart('Vai Premium', 28.00, '10 coxinhas grandes especiais (camarão, frango c/ catupiry, carne seca, 4 queijos, calabresa, cheddar, frango cremoso, palmito, frango com milho, catupiry + carne seca) + 1 Coca-Cola lata (350ml)')}
                className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors font-semibold"
              >
                Adicionar ao Carrinho
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="container mx-auto px-4 py-4">
        {searchQuery && (
          <div className="flex items-center justify-end">
            <button
              onClick={() => setSearchQuery('')}
              className="text-orange-600 hover:text-orange-700 text-sm"
            >
              Limpar busca
            </button>
          </div>
        )}
      </div>

      {/* Products */}
      <div className="container mx-auto px-4 pb-16">
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
          : 'space-y-4'
        }>
          {sortedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
              onQuickView={setSelectedProduct}
              viewMode={viewMode}
            />
          ))}
        </div>
      </div>

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