'use client'

import React from 'react'
import { useCart } from '@/contexts/CartContext'
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react'
import { RippleButton } from '@/components/ui/ripple-button'
import { BlurFade } from '@/components/ui/blur-fade'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface CartSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export const CartSidebar: React.FC<CartSidebarProps> = ({ isOpen, onClose }) => {
  const { items: cartItems, updateQuantity, removeFromCart, totalPrice, totalItems } = useCart()

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeFromCart(id)
      toast.success('Item removido do carrinho')
    } else {
      updateQuantity(id, newQuantity)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl transform transition-transform">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-coxinha-primary to-coxinha-secondary text-white">
            <div className="flex items-center gap-3">
              <ShoppingBag className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-bold">Seu Carrinho</h2>
                <p className="text-sm opacity-90">{totalItems} {totalItems === 1 ? 'item' : 'itens'}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {cartItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <ShoppingBag className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  Carrinho vazio
                </h3>
                <p className="text-gray-500 mb-6">
                  Adicione algumas coxinhas deliciosas!
                </p>
                <RippleButton
                  onClick={onClose}
                  className="bg-coxinha-primary text-white px-6 py-3 rounded-full font-semibold"
                >
                  Ver Cardápio
                </RippleButton>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {cartItems.map((item, index) => (
                  <BlurFade key={item.id} delay={index * 0.1}>
                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                      <div className="flex items-start gap-3">
                        <div className="w-16 h-16 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <span className="text-2xl">🍗</span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-800 text-sm line-clamp-1">
                            {item.name}
                          </h3>
                          <p className="text-lg font-bold text-coxinha-primary">
                            R$ {item.price.toFixed(2).replace('.', ',')}
                          </p>
                          
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-3 mt-2">
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            
                            <span className="w-8 text-center font-semibold text-sm">
                              {item.quantity}
                            </span>
                            
                            <button
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              className="w-8 h-8 rounded-full bg-coxinha-primary text-white flex items-center justify-center hover:bg-coxinha-secondary transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition-colors ml-auto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </BlurFade>
                ))}
                
                {/* Ofertas Especiais */}
                {totalPrice >= 25 && (
                  <BlurFade delay={0.3}>
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-green-600 text-lg">🎉</span>
                        <h4 className="font-semibold text-green-800">Parabéns!</h4>
                      </div>
                      <p className="text-sm text-green-700">
                        Você ganhou <strong>frete grátis</strong> neste pedido!
                      </p>
                    </div>
                  </BlurFade>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {cartItems.length > 0 && (
            <div className="border-t border-gray-200 p-4 space-y-4">
              {/* Resumo */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Entrega:</span>
                  <span className="text-green-600 font-semibold">GRÁTIS</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-lg font-bold text-coxinha-primary">
                  <span>Total:</span>
                  <span>R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
                </div>
              </div>
              
              {/* Botão de Checkout */}
              <Link href="/carrinho" onClick={onClose}>
                <RippleButton className="w-full bg-coxinha-primary hover:bg-coxinha-secondary text-white font-bold py-4 rounded-2xl text-lg shadow-lg">
                  Finalizar Pedido
                </RippleButton>
              </Link>
              
              <p className="text-xs text-gray-500 text-center">
                Pagamento seguro com PIX • Entrega em até 30 minutos
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}