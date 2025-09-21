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
      <section className="relative text-center py-20 md:py-32 bg-gradient-to-t from-orange-100/50 to-transparent">
        <div className="container mx-auto px-4 z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-6xl font-extrabold text-coxinha-dark mb-4 tracking-tight">
              Promoção Insana!
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto mb-8">
              3 Coxinhas + Refri por apenas <span className="font-bold text-coxinha-primary">R$9,90</span> – Peça já e não perca!
            </p>
            <ShimmerButton>
              <span className="whitespace-pre-wrap text-center text-lg font-semibold leading-none tracking-tight text-white dark:from-white dark:to-slate-900/10">
                Pedir Agora!
              </span>
            </ShimmerButton>
          </motion.div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        {/* Category Filter */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center text-coxinha-dark mb-8">Nossas Delícias</h2>
          <div className="flex justify-center flex-wrap gap-4">
            {['combos', 'tradicionais', 'especiais', 'veganas', 'bebidas'].map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full text-base font-semibold transition-all duration-300 ${
                  selectedCategory === category
                    ? 'bg-coxinha-primary text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-orange-50'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
          {products.filter(p => selectedCategory === 'ofertas' || p.category === selectedCategory).map((product) => (
            <ProductCard
              key={product.id}
              {...product}
              onAddToCart={() => handleAddToCart(product.id)}
            />
          ))}
        </div>
      </section>
      
      {/* Floating Action Button Menu */}
      <FabMenu cartItemsCount={totalItems} />

      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; {new Date().getFullYear()} Vai Coxinha. Todos os direitos reservados.</p>
          <div className="flex justify-center space-x-4 mt-4">
            <a href="#" className="hover:text-coxinha-primary transition-colors">Facebook</a>
            <a href="#" className="hover:text-coxinha-primary transition-colors">Instagram</a>
            <a href="#" className="hover:text-coxinha-primary transition-colors">Twitter</a>
          </div>
        </div>
      </footer>
    </div>
  )
}