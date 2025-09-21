'use client'

import React, { useState, useEffect } from 'react'
import { Header } from '@/components/header'
import { BlurFade } from '@/components/ui/blur-fade'
import { RippleButton } from '@/components/ui/ripple-button'
import { CheckCircle, Clock, Truck, ChefHat, Home } from 'lucide-react'
import Link from 'next/link'

interface OrderStatus {
  id: string
  status: 'received' | 'preparing' | 'out_for_delivery' | 'delivered'
  timestamp: Date
  estimatedTime: number // em minutos
}

const statusConfig = {
  received: {
    icon: CheckCircle,
    title: 'Pedido Recebido',
    description: 'Seu pedido foi confirmado e está na fila de preparo',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  preparing: {
    icon: ChefHat,
    title: 'Em Preparo',
    description: 'Nossas coxinhas estão sendo preparadas com carinho',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100'
  },
  out_for_delivery: {
    icon: Truck,
    title: 'Saiu para Entrega',
    description: 'Seu pedido está a caminho! Chegando em breve',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  delivered: {
    icon: Home,
    title: 'Entregue',
    description: 'Pedido entregue com sucesso! Bom apetite! 🍗',
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  }
}

export default function AcompanhamentoPage() {
  const [currentOrder, setCurrentOrder] = useState<OrderStatus>({
    id: `VCX${Date.now().toString().slice(-6)}`,
    status: 'received',
    timestamp: new Date(),
    estimatedTime: 25
  })

  const [timeRemaining, setTimeRemaining] = useState(25)

  useEffect(() => {
    // Simular progressão do pedido
    const progressOrder = () => {
      setTimeout(() => {
        setCurrentOrder(prev => ({ ...prev, status: 'preparing' }))
        setTimeRemaining(20)
      }, 3000)

      setTimeout(() => {
        setCurrentOrder(prev => ({ ...prev, status: 'out_for_delivery' }))
        setTimeRemaining(10)
      }, 8000)

      setTimeout(() => {
        setCurrentOrder(prev => ({ ...prev, status: 'delivered' }))
        setTimeRemaining(0)
      }, 15000)
    }

    progressOrder()

    // Countdown timer
    const timer = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1))
    }, 60000) // Atualizar a cada minuto

    return () => clearInterval(timer)
  }, [])

  const getStatusIndex = (status: string) => {
    const statuses = ['received', 'preparing', 'out_for_delivery', 'delivered']
    return statuses.indexOf(status)
  }

  const currentStatusIndex = getStatusIndex(currentOrder.status)
  const currentStatusConfig = statusConfig[currentOrder.status]
  const StatusIcon = currentStatusConfig.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-coxinha-light via-orange-50 to-white">
      <Header />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <div className="max-w-2xl mx-auto">
          {/* Header do Pedido */}
          <BlurFade>
            <div className="text-center mb-8">
              <div className={`w-20 h-20 ${currentStatusConfig.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <StatusIcon className={`w-10 h-10 ${currentStatusConfig.color}`} />
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {currentStatusConfig.title}
              </h1>
              <p className="text-gray-600 mb-4">
                {currentStatusConfig.description}
              </p>
              <div className="bg-white rounded-2xl p-4 shadow-lg inline-block">
                <p className="text-sm text-gray-500">Pedido</p>
                <p className="text-xl font-bold text-coxinha-primary">#{currentOrder.id}</p>
              </div>
            </div>
          </BlurFade>

          {/* Tempo Estimado */}
          {timeRemaining > 0 && (
            <BlurFade delay={0.2}>
              <div className="bg-gradient-to-r from-coxinha-primary to-coxinha-secondary text-white rounded-2xl p-6 mb-8 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="w-6 h-6" />
                  <h3 className="text-xl font-bold">Tempo Estimado</h3>
                </div>
                <div className="text-4xl font-bold mb-2">
                  {timeRemaining} min
                </div>
                <p className="opacity-90">
                  Seu pedido chegará em aproximadamente {timeRemaining} minutos
                </p>
              </div>
            </BlurFade>
          )}

          {/* Timeline do Pedido */}
          <BlurFade delay={0.4}>
            <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Status do Pedido</h3>
              
              <div className="space-y-6">
                {Object.entries(statusConfig).map(([status, config], index) => {
                  const Icon = config.icon
                  const isCompleted = index <= currentStatusIndex
                  const isCurrent = index === currentStatusIndex
                  
                  return (
                    <div key={status} className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        isCompleted 
                          ? `${config.bgColor} ${config.color}` 
                          : 'bg-gray-100 text-gray-400'
                      } ${isCurrent ? 'ring-4 ring-offset-2 ring-coxinha-primary/30' : ''}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      
                      <div className="flex-1">
                        <h4 className={`font-semibold ${isCompleted ? 'text-gray-800' : 'text-gray-400'}`}>
                          {config.title}
                        </h4>
                        <p className={`text-sm ${isCompleted ? 'text-gray-600' : 'text-gray-400'}`}>
                          {config.description}
                        </p>
                        {isCurrent && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-coxinha-primary h-2 rounded-full animate-pulse" style={{width: '60%'}}></div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {isCompleted && (
                        <div className="text-green-500">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </BlurFade>

          {/* Informações do Pedido */}
          <BlurFade delay={0.6}>
            <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Detalhes da Entrega</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Endereço:</span>
                  <span className="font-semibold text-right">
                    Rua das Flores, 123<br />
                    Centro - São Paulo
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Forma de Pagamento:</span>
                  <span className="font-semibold">PIX</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-bold text-coxinha-primary text-lg">R$ 45,90</span>
                </div>
              </div>
            </div>
          </BlurFade>

          {/* Ações */}
          <BlurFade delay={0.8}>
            <div className="space-y-4">
              {currentOrder.status === 'delivered' ? (
                <div className="text-center space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
                    <h3 className="text-xl font-bold text-green-800 mb-2">
                      🎉 Pedido Entregue!
                    </h3>
                    <p className="text-green-700">
                      Esperamos que você tenha gostado das nossas coxinhas!
                    </p>
                  </div>
                  
                  <Link href="/">
                    <RippleButton className="w-full bg-coxinha-primary hover:bg-coxinha-secondary text-white font-bold py-4 rounded-2xl text-lg">
                      Fazer Novo Pedido
                    </RippleButton>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <RippleButton className="bg-gray-100 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-200 transition-colors">
                    Entrar em Contato
                  </RippleButton>
                  
                  <Link href="/">
                    <RippleButton className="w-full bg-coxinha-primary hover:bg-coxinha-secondary text-white font-semibold py-3 rounded-xl">
                      Fazer Novo Pedido
                    </RippleButton>
                  </Link>
                </div>
              )}
            </div>
          </BlurFade>
        </div>
      </div>
    </div>
  )
}