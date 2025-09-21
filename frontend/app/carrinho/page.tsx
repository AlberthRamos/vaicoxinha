'use client'

import React, { useState } from 'react'
import { Header } from '@/components/header'
import { useCart } from '@/contexts/CartContext'
import { ShimmerButton } from '@/components/ui/shimmer-button'
import { BlurFade } from '@/components/ui/blur-fade'
import { ArrowLeft, Plus, Minus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function CarrinhoPage() {
  const { items: cartItems, updateQuantity, removeFromCart, totalPrice } = useCart()
  const [step, setStep] = useState(1) // 1: Carrinho, 2: Endereço, 3: Pagamento
  const [address, setAddress] = useState({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: 'São Paulo',
    zipCode: ''
  })
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const router = useRouter()

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity === 0) {
      removeFromCart(id)
      toast.success('Item removido do carrinho')
    } else {
      updateQuantity(id, newQuantity)
    }
  }

  const deliveryFee = 8.90
  const totalWithDelivery = totalPrice + deliveryFee

  const handleNextStep = () => {
    if (step === 1 && cartItems.length === 0) {
      toast.error('Adicione itens ao carrinho primeiro!')
      return
    }
    
    if (step === 2) {
      // Validar endereço
      if (!address.street || !address.number || !address.neighborhood || !address.zipCode) {
        toast.error('Preencha todos os campos obrigatórios do endereço')
        return
      }
    }
    
    if (step < 3) {
      setStep(step + 1)
    } else {
      // Finalizar pedido
      router.push('/checkout')
    }
  }

  const handleGetLocation = () => {
    setIsLoadingLocation(true)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          // Simular busca de endereço por geolocalização
          setTimeout(() => {
            setAddress({
              street: 'Rua Exemplo',
              number: '123',
              complement: '',
              neighborhood: 'Centro',
              city: 'São Paulo',
              zipCode: '01000-000'
            })
            setIsLoadingLocation(false)
            toast.success('Endereço encontrado!')
          }, 2000)
        },
        (error) => {
          setIsLoadingLocation(false)
          toast.error('Não foi possível obter sua localização')
        }
      )
    } else {
      setIsLoadingLocation(false)
      toast.error('Geolocalização não suportada')
    }
  }

  const handleFinalizarPedido = () => {
    toast.success('Pedido realizado com sucesso!')
    
    // Salvar pedido ativo no localStorage
    const orderId = 'CX' + Date.now().toString().slice(-6)
    const activeOrder = {
      id: orderId,
      items: cartItems,
      total: totalWithDelivery,
      address: address,
      status: {
        status: 'confirmed' as const,
        estimatedTime: 30,
        lastUpdate: new Date()
      }
    }
    localStorage.setItem('activeOrder', JSON.stringify(activeOrder))
    
    // Disparar evento para atualizar status
    window.dispatchEvent(new Event('storage'))
    
    // Redirecionar para página de acompanhamento
    setTimeout(() => {
      window.location.href = '/acompanhamento'
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-coxinha-light to-orange-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Progress Steps */}
        <BlurFade>
          <GlassCard className="mb-8">
            <div className="flex items-center justify-between">
              {[
                { number: 1, label: 'Carrinho' },
                { number: 2, label: 'Endereço' },
                { number: 3, label: 'Pagamento' }
              ].map((item) => (
                <div key={item.number} className="flex items-center">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center font-bold',
                    step >= item.number ? 'bg-coxinha-primary text-white' : 'bg-gray-200 text-gray-500'
                  )}>
                    {item.number}
                  </div>
                  <span className={cn('ml-2 font-medium', step >= item.number ? 'text-coxinha-dark' : 'text-gray-500')}>
                    {item.label}
                  </span>
                  {item.number < 3 && <div className="w-8 h-0.5 bg-gray-300 mx-4" />}
                </div>
              ))}
            </div>
          </GlassCard>
        </BlurFade>

        <AnimatePresence mode="wait">
          {/* Step 1: Carrinho */}
          {step === 1 && (
            <motion.div
              key="carrinho"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <GlassCard className="mb-6">
                <h2 className="text-2xl font-bold text-coxinha-dark mb-6">Seu Carrinho</h2>
                
                {cartItems.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">Seu carrinho está vazio!</p>
                    <GlassButton variant="secondary" onClick={() => window.location.href = '/'}>
                      Ver Produtos
                    </GlassButton>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-4 glass-card">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                          <div>
                            <h3 className="font-semibold text-coxinha-dark">{item.name}</h3>
                            <p className="text-sm text-gray-600">Quantidade: {item.quantity}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-coxinha-primary">
                            R$ {(item.price * item.quantity).toFixed(2).replace('.', ',')}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Taxa de entrega:</span>
                        <span>R$ {deliveryFee.toFixed(2).replace('.', ',')}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Total:</span>
                        <span className="text-coxinha-primary">
                          R$ <NumberTicker value={parseFloat(totalWithDelivery.toFixed(2))} />
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </GlassCard>
              
              {cartItems.length > 0 && (
                <ShimmerButton onClick={handleNextStep} className="w-full">
                  Continuar para Endereço →
                </ShimmerButton>
              )}
            </motion.div>
          )}

          {/* Step 2: Endereço */}
          {step === 2 && (
            <motion.div
              key="endereco"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <GlassCard className="mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-coxinha-dark">Endereço de Entrega</h2>
                  <ShimmerButton
                    variant="secondary"
                    size="sm"
                    onClick={handleGetLocation}
                    disabled={isLoadingLocation}
                  >
                    {isLoadingLocation ? '📍 Buscando...' : '📍 Usar minha localização'}
                  </ShimmerButton>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <GlassInput
                    placeholder="Rua"
                    value={address.street}
                    onChange={(e) => setAddress({...address, street: e.target.value})}
                    required
                  />
                  <GlassInput
                    placeholder="Número"
                    value={address.number}
                    onChange={(e) => setAddress({...address, number: e.target.value})}
                    required
                  />
                  <GlassInput
                    placeholder="Complemento (opcional)"
                    value={address.complement}
                    onChange={(e) => setAddress({...address, complement: e.target.value})}
                  />
                  <GlassInput
                    placeholder="Bairro"
                    value={address.neighborhood}
                    onChange={(e) => setAddress({...address, neighborhood: e.target.value})}
                    required
                  />
                  <GlassInput
                    placeholder="Cidade"
                    value={address.city}
                    onChange={(e) => setAddress({...address, city: e.target.value})}
                    required
                  />
                  <GlassInput
                    placeholder="CEP"
                    value={address.zipCode}
                    onChange={(e) => setAddress({...address, zipCode: e.target.value})}
                    required
                  />
                </div>
              </GlassCard>
              
              <div className="flex space-x-4">
                <ShimmerButton
                  variant="secondary"
                  onClick={() => setStep(step - 1)}
                  className="flex-1"
                >
                  ← Voltar
                </ShimmerButton>
                <ShimmerButton
                  onClick={handleNextStep}
                  className="flex-1"
                >
                  Continuar para Pagamento →
                </ShimmerButton>
              </div>
            </motion.div>
          )}

          {/* Step 3: Pagamento */}
          {step === 3 && (
            <motion.div
              key="pagamento"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <PixPayment
                total={totalWithDelivery}
                orderId="12345"
                onPaymentComplete={handleFinalizarPedido}
              />
              
              <div className="flex space-x-4 mt-6">
                <GlassButton
                  variant="secondary"
                  onClick={() => setStep(step - 1)}
                  className="flex-1"
                >
                  ← Voltar
                </GlassButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}