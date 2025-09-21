import React from 'react'
import Image from 'next/image'
import { RippleButton } from '@/components/ui/ripple-button'
import { BlurFade } from '@/components/ui/blur-fade'

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
    <BlurFade>
      <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-coxinha-primary/30 group">
        {/* Image Container */}
        <div className="relative w-full h-48 bg-gradient-to-br from-orange-50 to-orange-100 group-hover:from-orange-100 group-hover:to-orange-200 transition-all duration-300">
          <Image
            src={image}
            alt={name}
            fill
            className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
            priority
          />
          {isOffer && (
            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold animate-pulse">
              OFERTA!
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-1 line-clamp-1 group-hover:text-coxinha-primary transition-colors">
              {name}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
              {description}
            </p>
          </div>
          
          {/* Price Section */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex flex-col">
              {originalPrice && (
                <span className="text-sm text-gray-400 line-through">
                  R$ {originalPrice.toFixed(2).replace('.', ',')}
                </span>
              )}
              <span className="text-xl font-bold text-coxinha-primary">
                R$ {price.toFixed(2).replace('.', ',')}
              </span>
            </div>
            
            <RippleButton
              onClick={onAddToCart}
              disabled={isLoading}
              className="bg-coxinha-primary hover:bg-coxinha-secondary text-white font-semibold px-6 py-2 rounded-full transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              rippleColor="rgba(255, 255, 255, 0.8)"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Adicionando...
                </div>
              ) : (
                'Adicionar'
              )}
            </RippleButton>
          </div>
        </div>
      </div>
    </BlurFade>
  )
}

export default ProductCard