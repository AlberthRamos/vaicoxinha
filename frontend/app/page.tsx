'use client'

import React, { useState, useEffect } from 'react'
import { Header } from '@/components/header'
import ProductCard from '@/components/product-card'
import LoadingSpinner from '@/components/loading-spinner'
import { GlassCard } from '@/components/ui/glass-card'
import { FabMenu } from '@/components/fab-menu'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { BlurFade, TypingAnimation, ShimmerButton } from '@/components/ui/magic-ui'
import { UXTestTrigger } from '@/components/ui/ux-test'
import { useCart } from '@/contexts/CartContext'

interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  category: string
}

const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Combo Clássico',
    description: '10 coxinhas de frango + 5 coxinhas de queijo. Perfeito para compartilhar!',
    price: 45.90,
    image: '/images/combo-classico.svg',
    category: 'combos'
  },
  {
    id: '2',
    name: 'Combo Família',
    description: '20 coxinhas de frango + 10 coxinhas de queijo. Ideal para a família toda!',
    price: 89.90,
    image: '/images/combo-familia.svg',
    category: 'combos'
  },
  {
    id: '3',
    name: 'Combo Dupla',
    description: '6 coxinhas de frango + 4 coxinhas de queijo. Perfeito para dois!',
    price: 32.90,
    image: '/images/combo-dupla.svg',
    category: 'combos'
  },
  {
    id: '4',
    name: 'Combo Vegano',
    description: '8 coxinhas veganas de palmito + 4 coxinhas de jackfruit. Sabor e saúde!',
    price: 52.90,
    image: '/images/combo-vegano.svg',
    category: 'combos'
  },
  {
    id: '5',
    name: 'Combo Premium',
    description: '8 coxinhas de frango gourmet + 4 coxinhas de camarão. Experiência única!',
    price: 78.90,
    image: '/images/combo-premium.svg',
    category: 'combos'
  },
  {
    id: '6',
    name: 'Combo Kids',
    description: '6 coxinhas de frango mini + 2 coxinhas de queijo mini. Perfeito para as crianças!',
    price: 25.90,
    image: '/images/combo-kids.svg',
    category: 'combos'
  },
  {
    id: '7',
    name: 'Combo Festa',
    description: '30 coxinhas de frango + 15 coxinhas de queijo. Para sua festa ser inesquecível!',
    price: 129.90,
    image: '/images/combo-festa.svg',
    category: 'combos'
  },
  {
    id: '8',
    name: 'Combo Light',
    description: '8 coxinhas assadas de frango + 4 coxinhas assadas de queijo. Sabor sem culpa!',
    price: 42.90,
    image: '/images/combo-light.svg',
    category: 'combos'
  }
]

export default function Home() {
  const { addToCart, totalItems } = useCart()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('ofertas')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    // Simular carregamento de produtos
    setTimeout(() => {
      setProducts(mockProducts)
      setLoading(false)
    }, 1000)
  }, [])

  const handleAddToCart = (productId: string) => {
    const product = products.find(p => p.id === productId)
    if (product) {
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image
      })
      toast.success(`${product.name} adicionado ao carrinho!`, {
        icon: '🎉',
        style: {
          background: '#FF6B35',
          color: '#fff',
          borderRadius: '12px',
        },
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-coxinha-light via-orange-50 to-white">
        <Header />
        <div className="container mx-auto px-4 py-8 pt-24">
          <LoadingSpinner size="lg" text="Carregando deliciosas coxinhas..." useCoxinha={true} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-coxinha-light via-orange-50 to-white">
      <Header />
      
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-8 pt-24">
        <BlurFade>
          <GlassCard className="max-w-3xl mx-auto mb-12 text-center">
            <div className="animate-float mb-6">
              <span className="text-6xl">🍗</span>
            </div>
            <TypingAnimation
              className="text-4xl md:text-5xl font-bold text-coxinha-dark mb-6"
              text="Coxinhas Artesanais"
            />
            <p className="text-xl text-gray-700 mb-8 leading-relaxed">
              Entrega rápida em até 30 minutos! Os melhores combos para você aproveitar.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-base text-gray-600">
              <span className="flex items-center gap-2 bg-white/50 px-4 py-2 rounded-full">
                ⚡ Entrega Express
              </span>
              <span className="flex items-center gap-2 bg-white/50 px-4 py-2 rounded-full">
                🔥 Quentinhas na Hora
              </span>
              <span className="flex items-center gap-2 bg-white/50 px-4 py-2 rounded-full">
                💳 Pagamento Fácil
              </span>
            </div>
          </GlassCard>
        </BlurFade>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.map((product, index) => (
            <BlurFade key={product.id} delay={index * 0.1}>
              <ProductCard
                {...product}
                onAddToCart={() => handleAddToCart(product.id)}
              />
            </BlurFade>
          ))}
        </div>
      </section>
      
      {/* Floating Action Button Menu */}
      <FabMenu cartItemsCount={totalItems} />
      
      {/* UX Test Component */}
      <div className="fixed bottom-20 right-4 z-50">
        <UXTestTrigger />
      </div>
    </div>
  )
}