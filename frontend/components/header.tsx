'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import { Menu, X, ShoppingBag } from 'lucide-react'
import { CartSidebar } from '@/components/cart-sidebar'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const { totalItems } = useCart()

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isClient])

  const cartItemsCount = totalItems || 0

  // Fallback para SSR
  if (!isClient) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-transparent">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-xl font-bold">🥟</span>
              </div>
              <span className="text-2xl font-bold text-white">
                Vai Coxinha
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="p-2 rounded-full bg-white/20 text-white">
                <ShoppingBag className="w-6 h-6" />
              </span>
              <button className="p-2 rounded-full text-white">
                <Menu className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div
              className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg hover:scale-110 hover:rotate-10 transition-transform duration-200 cursor-pointer active:scale-95"
            >
              <span className="text-white text-xl font-bold">🥟</span>
            </div>
            <span
              className={`text-2xl font-bold ${
                isScrolled ? 'text-coxinha-dark' : 'text-white'
              }`}
            >
              Vai Coxinha
            </span>
          </Link>

          {/* Menu Desktop */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className={`font-medium transition-colors ${
              isScrolled ? 'text-gray-700 hover:text-coxinha-primary' : 'text-white hover:text-yellow-300'
            }`}>
              Início
            </Link>
            <Link href="/menu" className={`font-medium transition-colors ${
              isScrolled ? 'text-gray-700 hover:text-coxinha-primary' : 'text-white hover:text-yellow-300'
            }`}>
              Cardápio
            </Link>
            <Link href="/about" className={`font-medium transition-colors ${
              isScrolled ? 'text-gray-700 hover:text-coxinha-primary' : 'text-white hover:text-yellow-300'
            }`}>
              Sobre
            </Link>
            <Link href="/contact" className={`font-medium transition-colors ${
              isScrolled ? 'text-gray-700 hover:text-coxinha-primary' : 'text-white hover:text-yellow-300'
            }`}>
              Contato
            </Link>
          </nav>

          {/* Carrinho e Menu Mobile */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsCartOpen(true)}
              className={`relative p-2 rounded-full transition-colors ${
                isScrolled ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-white/20 hover:bg-white/30 text-white'
              }`}
            >
              <ShoppingBag className="w-6 h-6" />
              {cartItemsCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 bg-coxinha-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-scale-in"
                >
                  {cartItemsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`md:hidden p-2 rounded-full transition-colors ${
                isScrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/20'
              }`}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Menu Mobile */}
        {isMenuOpen && (
          <nav
            className="md:hidden mt-4 pb-4 border-t border-gray-200 animate-fade-in"
          >
            <div className="flex flex-col space-y-4 pt-4">
              <Link href="/" className="font-medium text-gray-700 hover:text-coxinha-primary transition-colors">
                Início
              </Link>
              <Link href="/menu" className="font-medium text-gray-700 hover:text-coxinha-primary transition-colors">
                Cardápio
              </Link>
              <Link href="/about" className="font-medium text-gray-700 hover:text-coxinha-primary transition-colors">
                Sobre
              </Link>
              <Link href="/contact" className="font-medium text-gray-700 hover:text-coxinha-primary transition-colors">
                Contato
              </Link>
            </div>
          </nav>
        )}
      </div>
      <style jsx>{`
        @keyframes scale-in {
          0% {
            transform: scale(0);
          }
          100% {
            transform: scale(1);
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            height: 0;
          }
          to {
            opacity: 1;
            height: auto;
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
      
      {/* Cart Sidebar */}
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </header>
  )
}