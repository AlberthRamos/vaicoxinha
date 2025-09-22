'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, Phone, User, Menu } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';

export function MobileBottomNav() {
  const pathname = usePathname();
  const { state } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { name: 'Início', href: '/', icon: Home },
    { name: 'Cardápio', href: '/cardapio', icon: ShoppingBag },
    { name: 'Perfil', href: '/perfil', icon: User },
  ];

  const cartItemsCount = state.itemCount;

  return (
    <>
      {/* Navegação Inferior Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 lg:hidden">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <div
                key={item.name}
                className="relative"
              >
                <Link
                  href={item.href}
                  className={`flex flex-col items-center justify-center w-16 h-16 space-y-1 ${
                    isActive
                      ? 'text-orange-600'
                      : 'text-gray-600 hover:text-orange-600'
                  }`}
                  aria-label={item.name}
                  title={item.name}
                >
                  <div className="relative">
                    <item.icon className="w-5 h-5" />
                    {item.name === 'Cardápio' && state.itemCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                        {state.itemCount > 99 ? '99+' : state.itemCount}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium">{item.name}</span>
                </Link>
              </div>
            );
          })}
        </div>
      </nav>

      {/* Espaçador para não sobrepor o conteúdo */}
      <div className="h-16 lg:hidden" />
    </>
  );
}