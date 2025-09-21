'use client'

import React, { useState, useEffect } from 'react'

// Import dinâmico para evitar erros de SSR
const Link = typeof window !== 'undefined' ? require('next/link').default : null
const motion = typeof window !== 'undefined' ? require('framer-motion').motion : null

// Tipos para o status do pedido
type OrderStatusType = 'pending' | 'confirmed' | 'preparing' | 'out-for-delivery' | 'delivered'

interface OrderStatusProps {
  orderId?: string
}

interface OrderStatus {
  status: 'pending' | 'confirmed' | 'preparing' | 'out-for-delivery' | 'delivered'
  estimatedTime: number
  lastUpdate: Date
}

export function OrderStatus({ orderId }: OrderStatusProps) {
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Verificar se existe um pedido ativo no localStorage
    const activeOrder = localStorage.getItem('activeOrder')
    if (activeOrder) {
      const orderData = JSON.parse(activeOrder)
      setOrderStatus(orderData)
      setIsVisible(true)
    }

    // Escutar mudanças no status do pedido
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'activeOrder' && e.newValue) {
        const orderData = JSON.parse(e.newValue)
        setOrderStatus(orderData)
        setIsVisible(true)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  if (!isVisible || !orderStatus || !Link || !motion) return null

  const statusConfig = {
    pending: { icon: '⏳', text: 'Pedido Pendente', color: 'bg-yellow-500' },
    confirmed: { icon: '✅', text: 'Pedido Confirmado', color: 'bg-green-500' },
    preparing: { icon: '👨‍🍳', text: 'Preparando', color: 'bg-blue-500' },
    'out-for-delivery': { icon: '🚚', text: 'Saiu para Entrega', color: 'bg-purple-500' },
    delivered: { icon: '📦', text: 'Entregue', color: 'bg-gray-500' }
  }

  const config = statusConfig[orderStatus.status]

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-20 right-4 z-50"
    >
      <Link
        href="/acompanhamento"
        className={`${config.color} text-white rounded-lg shadow-lg px-4 py-2 flex items-center gap-2 hover:opacity-90 transition-opacity`}
      >
        <span className="text-lg">{config.icon}</span>
        <div className="text-sm">
          <div className="font-semibold">{config.text}</div>
          <div className="text-xs opacity-90">
            {orderStatus.estimatedTime} min
          </div>
        </div>
      </Link>
    </motion.div>
  )
}