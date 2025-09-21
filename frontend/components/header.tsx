'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useCart } from '@/contexts/CartContext'
import { ShoppingBag } from 'lucide-react'
import { CartSidebar } from '@/components/cart-sidebar'
import { Logo } from './logo'

export function Header() {
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

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/90 backdrop-blur-lg shadow-md' : 'bg-transparent'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Logo className="h-10 w-10" />
            <span className={`text-2xl font-bold transition-colors ${
              isScrolled ? 'text-coxinha-dark' : 'text-white'
            }`}>
              Vai Coxinha
            </span>
          </Link>

          {/* Cart Icon */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative rounded-full p-2 transition-colors duration-300"
          >
            <ShoppingBag className={`w-7 h-7 transition-colors duration-300 ${
              isScrolled ? 'text-gray-700' : 'text-white'
            }`} />
            {cartItemsCount > 0 && (
              <span className="absolute top-0 right-0 bg-coxinha-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
                {cartItemsCount}
              </span>
            )}
          </button>
        </div>
      </div>
      
      {/* Cart Sidebar */}
      <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </header>
  )
}