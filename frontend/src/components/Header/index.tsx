'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, Menu, X, Phone, MapPin, Clock } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { cn } from '@/lib/utils'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { state } = useCart()

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        {/* Top Bar */}
        <div className="hidden md:flex items-center justify-between py-2 text-sm text-gray-600 border-b">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>Seg-Sab: 11h-22h | Dom: 11h-21h</span>
            </div>
            <div className="flex items-center space-x-1">
              <Phone className="w-4 h-4" />
              <span>(11) 99999-9999</span>
            </div>
            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4" />
              <span>São Paulo - SP</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
          </div>
        </div>

        {/* Main Header */}
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-12 h-12 bg-vai-coxinha-red rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">VC</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-2xl font-bold text-vai-coxinha-red">Vai Coxinha</h1>
              <p className="text-sm text-gray-600">A melhor coxinha da cidade</p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 hover:text-vai-coxinha-red transition-colors font-medium">
              Início
            </Link>
            <Link href="/cardapio" className="text-gray-700 hover:text-vai-coxinha-red transition-colors font-medium">
              Cardápio
            </Link>
            <Link href="/promocoes" className="text-gray-700 hover:text-vai-coxinha-red transition-colors font-medium">
              Promoções
            </Link>
            <Link href="/entrega" className="text-gray-700 hover:text-vai-coxinha-red transition-colors font-medium">
              Entrega
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            <Link href="/carrinho" className="relative">
              <button className="p-2 text-gray-700 hover:text-vai-coxinha-red transition-colors">
                <ShoppingCart className="w-6 h-6" />
                {state.itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-vai-coxinha-red text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {state.itemCount}
                  </span>
                )}
              </button>
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-gray-700 hover:text-vai-coxinha-red transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={cn(
          'lg:hidden border-t transition-all duration-300',
          isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        )}>
          <nav className="py-4 space-y-2">
            <Link 
              href="/" 
              className="block py-2 text-gray-700 hover:text-vai-coxinha-red transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Início
            </Link>
            <Link 
              href="/cardapio" 
              className="block py-2 text-gray-700 hover:text-vai-coxinha-red transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Cardápio
            </Link>
            <Link 
              href="/promocoes" 
              className="block py-2 text-gray-700 hover:text-vai-coxinha-red transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Promoções
            </Link>
            <Link 
              href="/entrega" 
              className="block py-2 text-gray-700 hover:text-vai-coxinha-red transition-colors font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              Entrega
            </Link>
            <div className="pt-4 border-t space-y-2">
            </div>
          </nav>
        </div>
      </div>
    </header>
  )
}