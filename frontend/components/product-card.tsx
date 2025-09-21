import React from 'react'
import Image from 'next/image'
import { ShimmerButton } from '@/components/ui/shimmer-button'

interface ProductCardProps {
  id: string
  name: string
  description: string
  price: number
  image: string
  onAddToCart: () => void
  isLoading?: boolean
  isOffer?: boolean
  originalPrice?: number
}

const ProductCard: React.FC<ProductCardProps> = ({
  name,
  description,
  price,
  image,
  onAddToCart,
  isLoading = false,
  isOffer = false,
  originalPrice
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden group border border-transparent hover:border-coxinha-primary/50">
      <div className="relative w-full h-52">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          priority
        />
        {isOffer && (
          <div className="absolute top-3 right-3 bg-coxinha-primary text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
            OFERTA
          </div>
        )}
      </div>

      <div className="p-5">
        <h3 className="text-xl font-bold text-gray-800 mb-2 truncate group-hover:text-coxinha-dark">
          {name}
        </h3>
        <p className="text-gray-600 text-sm mb-4 h-10">
          {description}
        </p>
        
        <div className="flex items-end justify-between mt-4">
          <div>
            {originalPrice && (
              <span className="text-base text-gray-400 line-through mr-2">
                R$ {originalPrice.toFixed(2).replace('.', ',')}
              </span>
            )}
            <span className="text-2xl font-extrabold text-coxinha-dark">
              R$ {price.toFixed(2).replace('.', ',')}
            </span>
          </div>

          <ShimmerButton
            onClick={onAddToCart}
            disabled={isLoading}
            className="px-6 py-2"
          >
            <span className="whitespace-pre-wrap text-center text-sm font-medium leading-none tracking-tight text-white dark:from-white dark:to-slate-900/10 lg:text-lg">
              {isLoading ? 'Adicionando...' : 'Adicionar'}
            </span>
          </ShimmerButton>
        </div>
      </div>
    </div>
  )
}

export default ProductCard