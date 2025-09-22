'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Star, Clock, Plus, Eye, Heart, ShoppingCart } from 'lucide-react';

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

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onQuickView: (product: Product) => void;
  viewMode?: 'grid' | 'list';
}

export function ProductCard({ product, onAddToCart, onQuickView, viewMode = 'grid' }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    try {
      await onAddToCart(product);
      // Mostrar feedback visual
      setTimeout(() => setIsAddingToCart(false), 1000);
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      setIsAddingToCart(false);
    }
  };

  const handleQuickView = () => {
    onQuickView(product);
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
  };

  // Render list view
  if (viewMode === 'list') {
    return (
      <div className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg">
        <div className="flex gap-4 p-4">
          {/* Product Image - List View */}
          <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 rounded-lg overflow-hidden">
            <Image
              src={product.image || '/images/placeholder-coxinha.jpg'}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 96px, 128px"
            />
            
            {/* Badges - List View */}
            <div className="absolute top-1 left-1 flex flex-col gap-1">
              {product.isNew && (
                <span className="bg-green-500 text-white text-[10px] px-1 py-0.5 rounded font-semibold">
                  Novo
                </span>
              )}
              {product.isFeatured && (
                <span className="bg-orange-500 text-white text-[10px] px-1 py-0.5 rounded font-semibold">
                  Destaque
                </span>
              )}
              {discount > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1 py-0.5 rounded font-semibold">
                  -{discount}%
                </span>
              )}
            </div>
          </div>

          {/* Product Info - List View */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm mb-1">
                  {product.name}
                </h3>
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                  {product.description}
                </p>
              </div>
              
              {/* Wishlist Button - List View */}
              <button
                onClick={handleLike}
                className={`ml-2 p-1.5 rounded-full ${
                  isLiked 
                    ? 'bg-red-500 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:text-red-500'
                }`}
                aria-label={isLiked ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              >
                <Heart className={`w-3 h-3 ${isLiked ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Rating and Prep Time - List View */}
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                <span className="text-xs text-gray-600">{product.rating}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Clock className="w-3 h-3" />
                <span>{product.prepTime}</span>
              </div>
            </div>

            {/* Price and Actions - List View */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-gray-900">
                  R$ {product.price.toFixed(2)}
                </span>
                {product.originalPrice && (
                  <span className="text-xs text-gray-500 line-through">
                    R$ {product.originalPrice.toFixed(2)}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {!product.isAvailable && (
                  <span className="text-xs text-red-600 font-semibold">
                    Indisponível
                  </span>
                )}
                
                <button
                  onClick={handleQuickView}
                  className="p-2 text-gray-600 hover:text-gray-800"
                  aria-label="Visualização rápida"
                >
                  <Eye className="w-4 h-4" />
                </button>
                
                <button
                  onClick={handleAddToCart}
                  disabled={!product.isAvailable || isAddingToCart}
                  className="bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                  aria-label="Adicionar ao carrinho"
                >
                  {isAddingToCart ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    <ShoppingCart className="w-4 h-4" />
                  )}
                  {isAddingToCart ? 'Adicionando...' : 'Comprar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render grid view (original layout)
  return (
    <div className="group relative bg-white rounded-xl shadow-sm hover:shadow-xl"
         onMouseEnter={() => setIsHovered(true)}
         onMouseLeave={() => setIsHovered(false)}>
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
        {product.isNew && (
          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
            Novo
          </span>
        )}
        {product.isFeatured && (
          <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
            Destaque
          </span>
        )}
        {discount > 0 && (
          <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
            -{discount}%
          </span>
        )}
      </div>

      {/* Wishlist Button */}
      <button
        onClick={handleLike}
        className={`absolute top-3 right-3 z-10 p-2 rounded-full ${
          isLiked 
            ? 'bg-red-500 text-white' 
            : 'bg-gray-100 text-gray-600 hover:text-red-500'
        }`}
        aria-label={isLiked ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      >
        <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
      </button>

      {/* Product Image */}
      <div className="relative w-full h-48 overflow-hidden rounded-t-xl">
        <Image
          src={product.image || '/images/placeholder-coxinha.jpg'}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        {/* Overlay Actions */}
        <div className={`absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center gap-2 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <button
            onClick={handleQuickView}
            className="bg-white text-gray-800 p-2 rounded-full hover:bg-gray-100"
            aria-label="Visualização rápida"
          >
            <Eye className="w-4 h-4" />
          </button>
          
          <button
            onClick={handleAddToCart}
            disabled={!product.isAvailable || isAddingToCart}
            className="bg-orange-500 text-white px-4 py-2 rounded-full font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
            aria-label="Adicionar ao carrinho"
          >
            {isAddingToCart ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {isAddingToCart ? 'Adicionando...' : 'Adicionar'}
          </button>
        </div>

        {/* Availability Status */}
        {!product.isAvailable && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center">
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
              Indisponível
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 truncate">
          {product.name}
        </h3>
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
          {product.description}
        </p>

        {/* Rating and Prep Time */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm text-gray-600">{product.rating}</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{product.prepTime}</span>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg font-bold text-gray-900">
            R$ {product.price.toFixed(2)}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-gray-500 line-through">
              R$ {product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={handleAddToCart}
          disabled={!product.isAvailable || isAddingToCart}
          className="w-full bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          aria-label="Adicionar ao carrinho"
        >
          {isAddingToCart ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <ShoppingCart className="w-4 h-4" />
          )}
          {isAddingToCart ? 'Adicionando...' : 'Adicionar ao Carrinho'}
        </button>
      </div>
    </div>
  );
}