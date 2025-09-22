'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingCart, User, Menu, X, Heart, MapPin } from 'lucide-react'
import { useCart } from '@/contexts/CartContext';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { LocationCapture } from '@/components/LocationCapture';
import Image from 'next/image';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const pathname = usePathname();
  const { state } = useCart();
  
  const cartItemsCount = state.items.reduce((total, item) => total + item.quantity, 0);
  
  useKeyboardNavigation({
    'Escape': () => {
      setIsMenuOpen(false);
    },
  });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigation = [
    { name: 'Início', href: '/', current: pathname === '/' },
    { name: 'Cardápio', href: '/cardapio', current: pathname === '/cardapio' },
    { name: 'Rastreamento', href: '/rastreamento', current: pathname === '/rastreamento' },
  ];

  return (
    <>
      <header 
        className={`sticky top-0 z-50 ${
          isScrolled 
            ? 'bg-white shadow-lg backdrop-blur-sm bg-opacity-95' 
            : 'bg-white'
        }`}
        role="banner"
        aria-label="Cabeçalho principal"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <div className="flex justify-start">
              <Link 
                href="/" 
                className="flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-orange-500 rounded-lg"
                aria-label="Vai Coxinha - Página inicial"
              >
                <div className="w-16 h-16 lg:w-24 lg:h-24 relative">
                  <Image
                    src="/Logo.png"
                    alt="Vai Coxinha Logo"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </Link>
            </div>

            {/* Navegação Desktop */}
            <nav className="hidden lg:flex items-center space-x-6 flex-1 justify-center" role="navigation">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    item.current
                      ? 'text-orange-600 bg-orange-50'
                      : 'text-gray-700 hover:text-orange-600 hover:bg-orange-50'
                  }`}
                  aria-current={item.current ? 'page' : undefined}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Ações */}
            <div className="flex items-center space-x-2 lg:space-x-4">
              {/* Location Indicator */}
              <LocationCapture compact={true} className="hidden lg:flex" />

              {/* Carrinho */}
              <Link
                href="/carrinho"
                className="relative p-2 text-gray-600 hover:text-orange-600 rounded-lg hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                aria-label={`Carrinho de compras (${cartItemsCount} itens)`}
                title={`Carrinho de compras (${cartItemsCount} itens)`}
              >
                <ShoppingCart className="w-5 h-5" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {cartItemsCount > 99 ? '99+' : cartItemsCount}
                  </span>
                )}
              </Link>

              {/* Perfil */}
              <Link
                href="/perfil"
                className="p-2 text-gray-600 hover:text-orange-600 rounded-lg hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                aria-label="Ver perfil"
                title="Ver perfil"
              >
                <User className="w-5 h-5" />
              </Link>

              {/* Menu Mobile */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2 text-gray-600 hover:text-orange-600 rounded-lg hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
                aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
                aria-expanded={isMenuOpen}
                aria-controls="mobile-menu"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Menu Mobile */}
        {isMenuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    item.current
                      ? 'text-orange-600 bg-orange-50'
                      : 'text-gray-700 hover:text-orange-600 hover:bg-orange-50'
                  }`}
                  aria-current={item.current ? 'page' : undefined}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>
    </>
  );
}