'use client'

import React, { useState } from 'react'
import { useCart } from '@/contexts/CartContext'
import { RippleButton } from '@/components/ui/ripple-button'
import { BlurFade } from '@/components/ui/blur-fade'
import { ArrowLeft, MapPin, CreditCard, CheckCircle, Copy } from 'lucide-react'
import toast from 'react-hot-toast'

interface CheckoutFlowProps {
  onComplete?: () => void
  onBack?: () => void
}

interface Address {
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  zipCode: string
}

export const CheckoutFlow: React.FC<CheckoutFlowProps> = ({ onComplete, onBack }) => {
  const { items: cartItems, totalPrice, clearCart } = useCart()
  const [currentStep, setCurrentStep] = useState(1)
  const [address, setAddress] = useState<Address>({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: 'São Paulo',
    zipCode: ''
  })
  const [pixCode, setPixCode] = useState('')
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  const generatePixCode = () => {
    // Simular geração de código PIX
    const mockPixCode = `00020126580014BR.GOV.BCB.PIX0136${Math.random().toString(36).substring(2, 15)}52040000530398654${totalPrice.toFixed(2)}5802BR5925Vai Coxinha Delivery6009SAO PAULO62070503***6304`
    return mockPixCode
  }

  const handleNextStep = () => {
    if (currentStep === 1) {
      // Validar endereço
      if (!address.street || !address.number || !address.neighborhood || !address.zipCode) {
        toast.error('Preencha todos os campos obrigatórios do endereço')
        return
      }
      setCurrentStep(2)
    } else if (currentStep === 2) {
      // Gerar código PIX
      const code = generatePixCode()
      setPixCode(code)
      setCurrentStep(3)
    }
  }

  const handlePaymentComplete = async () => {
    setIsProcessingPayment(true)
    
    // Simular processamento do pagamento
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    toast.success('Pagamento confirmado! Seu pedido está sendo preparado.', {
      icon: '🎉',
      duration: 4000,
      style: {
        background: '#22C55E',
        color: '#fff',
        borderRadius: '12px',
      },
    })
    
    clearCart()
    setIsProcessingPayment(false)
    
    if (onComplete) {
      onComplete()
    }
  }

  const copyPixCode = () => {
    navigator.clipboard.writeText(pixCode)
    toast.success('Código PIX copiado!', {
      icon: '📋',
      style: {
        background: '#3B82F6',
        color: '#fff',
        borderRadius: '12px',
      },
    })
  }

  const renderAddressStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MapPin className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Endereço de Entrega</h2>
        <p className="text-gray-600">Onde você quer receber seu pedido?</p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rua/Avenida *
            </label>
            <input
              type="text"
              value={address.street}
              onChange={(e) => setAddress({...address, street: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-coxinha-primary focus:border-transparent transition-all"
              placeholder="Ex: Rua das Flores"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número *
            </label>
            <input
              type="text"
              value={address.number}
              onChange={(e) => setAddress({...address, number: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-coxinha-primary focus:border-transparent transition-all"
              placeholder="123"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Complemento
          </label>
          <input
            type="text"
            value={address.complement}
            onChange={(e) => setAddress({...address, complement: e.target.value})}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-coxinha-primary focus:border-transparent transition-all"
            placeholder="Apto 101, Bloco A"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bairro *
            </label>
            <input
              type="text"
              value={address.neighborhood}
              onChange={(e) => setAddress({...address, neighborhood: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-coxinha-primary focus:border-transparent transition-all"
              placeholder="Centro"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CEP *
            </label>
            <input
              type="text"
              value={address.zipCode}
              onChange={(e) => setAddress({...address, zipCode: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-coxinha-primary focus:border-transparent transition-all"
              placeholder="01234-567"
            />
          </div>
        </div>
      </div>
    </div>
  )

  const renderPaymentStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Pagamento PIX</h2>
        <p className="text-gray-600">Pagamento seguro com Vai Coxinha - confirmação imediata</p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="text-center mb-6">
          <div className="w-48 h-48 bg-gray-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <div className="text-6xl">📱</div>
          </div>
          <h3 className="text-lg font-semibold mb-2">Escaneie o QR Code</h3>
          <p className="text-sm text-gray-600">
            Abra o app do seu banco e escaneie o código QR acima
          </p>
        </div>

        <div className="border-t pt-6">
          <h4 className="font-semibold mb-3">Ou copie o código PIX:</h4>
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <code className="text-xs text-gray-600 break-all flex-1 mr-3">
                {pixCode || 'Gerando código PIX...'}
              </code>
              <RippleButton
                onClick={copyPixCode}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
                disabled={!pixCode}
              >
                <Copy className="w-4 h-4" />
                Copiar
              </RippleButton>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-yellow-800">
            <strong>💡 Dica:</strong> Com PIX seu pedido é confirmado na hora e chega mais rápido!
          </p>
        </div>

        <RippleButton
          onClick={handlePaymentComplete}
          disabled={isProcessingPayment}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl text-lg"
        >
          {isProcessingPayment ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Processando Pagamento...
            </div>
          ) : (
            'Confirmar Pagamento'
          )}
        </RippleButton>
      </div>
    </div>
  )

  const renderSummary = () => (
    <div className="bg-gradient-to-r from-coxinha-primary to-coxinha-secondary text-white p-6 rounded-2xl mb-6">
      <h3 className="text-xl font-bold mb-4">🎯 Resumo do Pedido</h3>
      <div className="space-y-2 text-sm opacity-90">
        <div className="flex justify-between">
          <span>Itens ({cartItems.length}):</span>
          <span>R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
        </div>
        <div className="flex justify-between">
          <span>Entrega:</span>
          <span>GRÁTIS</span>
        </div>
        {currentStep > 1 && (
          <div className="flex justify-between text-xs">
            <span>Endereço:</span>
            <span className="text-right">
              {address.street}, {address.number}<br />
              {address.neighborhood} - {address.city}
            </span>
          </div>
        )}
      </div>
      <div className="border-t border-white/20 pt-2 mt-2 flex justify-between text-xl font-bold">
        <span>Total:</span>
        <span>R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
      </div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-4">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                currentStep >= step 
                  ? 'bg-coxinha-primary text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {currentStep > step ? <CheckCircle className="w-5 h-5" /> : step}
              </div>
              {step < 3 && (
                <div className={`w-16 h-1 mx-2 transition-all ${
                  currentStep > step ? 'bg-coxinha-primary' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Labels */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center space-x-16 text-sm font-medium">
          <span className={currentStep >= 1 ? 'text-coxinha-primary' : 'text-gray-500'}>
            Endereço
          </span>
          <span className={currentStep >= 2 ? 'text-coxinha-primary' : 'text-gray-500'}>
            Pagamento
          </span>
          <span className={currentStep >= 3 ? 'text-coxinha-primary' : 'text-gray-500'}>
            Confirmação
          </span>
        </div>
      </div>

      {/* Content */}
      <BlurFade key={currentStep}>
        {currentStep === 1 && renderAddressStep()}
        {currentStep === 2 && renderPaymentStep()}
      </BlurFade>

      {/* Summary */}
      {renderSummary()}

      {/* Navigation */}
      <div className="flex justify-between">
        <RippleButton
          onClick={currentStep === 1 ? onBack : () => setCurrentStep(currentStep - 1)}
          className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </RippleButton>

        {currentStep < 2 && (
          <RippleButton
            onClick={handleNextStep}
            className="bg-coxinha-primary hover:bg-coxinha-secondary text-white font-semibold px-8 py-3 rounded-full transition-all duration-300 hover:scale-105 shadow-lg"
          >
            Continuar
          </RippleButton>
        )}
      </div>
    </div>
  )
}