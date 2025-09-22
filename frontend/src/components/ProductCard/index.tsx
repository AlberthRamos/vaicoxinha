'use client'

import Image from 'next/image'
import { Star, Clock, Tag } from 'lucide-react'
import { Product } from '@/services/productsService'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  product: Product
  onClick?: () => void
  className?: string
}

export default function ProductCard({ product, onClick, className }: ProductCardProps) {
  const discount = product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer',
        'transform hover:scale-105 transition-all duration-300',
        'border border-gray-100 hover:shadow-xl',
        className
      )}
    >
      {/* Imagem do Produto */}
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.isFeatured && (
            <span className="bg-vc-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
              <Tag className="w-3 h-3" />
              Destaque
            </span>
          )}
          {product.isNew && (
            <span className="bg-vc-yellow-400 text-vc-brown-800 px-2 py-1 rounded-full text-xs font-semibold">
              Novo
            </span>
          )}
          {!product.available && (
            <span className="bg-gray-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
              Indisponível
            </span>
          )}
          {discount > 0 && (
            <span className="bg-vc-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
              -{discount}%
            </span>
          )}
        </div>

        {/* Avaliação */}
        {product.rating && (
          <div className="absolute top-3 right-3 bg-white bg-opacity-90 px-2 py-1 rounded-full flex items-center gap-1">
            <Star className="w-4 h-4 text-vc-yellow-400 fill-current" />
            <span className="text-sm font-semibold text-gray-800">
              {product.rating}
            </span>
          </div>
        )}
      </div>

      {/* Informações do Produto */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">
          {product.name}
        </h3>
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {product.description}
        </p>

        {/* Tempo de Preparo */}
        <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
          <Clock className="w-4 h-4" />
          <span>{product.preparationTime} min</span>
        </div>

        {/* Categoria */}
        {product.category && (
          <div className="text-xs text-gray-500 mb-3">
            {product.category}
          </div>
        )}

        {/* Preço */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-vc-red-500">
              R$ {product.price.toFixed(2)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-sm text-gray-500 line-through ml-2">
                R$ {product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}