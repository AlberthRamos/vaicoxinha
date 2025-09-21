'use client'

import React, { useState } from 'react'
import { GlassCard } from '@/components/ui/glass-card'
import { GlassButton } from '@/components/ui/glass-button'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { BlurFade, ShimmerButton, NumberTicker } from '@/components/ui/magic-ui'

interface PixPaymentProps {
  total: number
  orderId: string
  onPaymentComplete: () => void
}

export default function PixPayment({ total, orderId, onPaymentComplete }: PixPaymentProps) {
  const [selectedMethod, setSelectedMethod] = useState<'qr' | 'copy'>('qr')
  const [isProcessing, setIsProcessing] = useState(false)
  const [pixCode] = useState('00020126580014BR.GOV.BCB.PIX013612345678-1234-1234-1234-1234567890125204000053039865406100.005802BR5914VAI COXINHA LTDA6008BRASILIA62070503***6304AAAA')

  const handlePayment = async () => {
    setIsProcessing(true)
    
    // Simular processamento do pagamento
    setTimeout(() => {
      setIsProcessing(false)
      toast.success('Pagamento confirmado com sucesso!')
      onPaymentComplete()
    }, 3000)
  }

  const copyPixCode = async () => {
    try {
      await navigator.clipboard.writeText(pixCode)
      toast.success('Código Pix copiado!')
    } catch (error) {
      toast.error('Erro ao copiar código')
    }
  }

  return (
    <BlurFade>
      <GlassCard className="p-6">
        <h3 className="text-xl font-bold text-coxinha-dark mb-6">Pagamento via Pix</h3>
      
      {/* Métodos de Pagamento */}
      <div className="space-y-4 mb-6">
        <GlassCard
          variant={selectedMethod === 'qr' ? 'elevated' : 'default'}
          className="cursor-pointer p-4"
          onClick={() => setSelectedMethod('qr')}
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-coxinha-primary rounded-full flex items-center justify-center">
              <span className="text-white font-bold">QR</span>
            </div>
            <div>
              <h4 className="font-semibold text-coxinha-dark">Pix QR Code</h4>
              <p className="text-sm text-gray-600">Escaneie o código com seu app bancário</p>
            </div>
          </div>
        </GlassCard>
        
        <GlassCard
          variant={selectedMethod === 'copy' ? 'elevated' : 'default'}
          className="cursor-pointer p-4"
          onClick={() => setSelectedMethod('copy')}
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-coxinha-secondary rounded-full flex items-center justify-center">
              <span className="text-white font-bold">CC</span>
            </div>
            <div>
              <h4 className="font-semibold text-coxinha-dark">Pix Copia e Cola</h4>
              <p className="text-sm text-gray-600">Copie o código e cole no seu app bancário</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Conteúdo baseado na seleção */}
      {selectedMethod === 'qr' && (
        <BlurFade className="text-center mb-6">
          <div className="bg-white p-6 rounded-lg inline-block mb-4">
            {/* QR Code Placeholder */}
            <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="w-32 h-32 border-4 border-gray-300 border-dashed rounded-lg mb-2"></div>
                <p className="text-xs text-gray-500">QR Code</p>
              </div>
            </div>
          </div>
   <p className="text-sm text-gray-600">
              Escaneie este código com o app do seu banco
            </p>
          </BlurFade>
        )}

      {selectedMethod === 'copy' && (
        <BlurFade className="mb-6">
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="text-xs text-gray-600 mb-2">Código Pix:</p>
            <p className="text-xs font-mono bg-white p-2 rounded border break-all">
              {pixCode}
            </p>
          </div>
          <ShimmerButton
            onClick={copyPixCode}
            className="w-full"
          >
            📋 Copiar Código
          </ShimmerButton>
        </BlurFade>
      )}

      {/* Total e Confirmação */}
      <div className="border-t pt-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <span className="font-semibold text-coxinha-dark">Total a pagar:</span>
          <span className="text-2xl font-bold text-coxinha-primary">
            R$ <NumberTicker value={parseFloat(total.toFixed(2))} />
          </span>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-green-600">✅</span>
            <span className="text-sm text-green-700">
              Pagamento seguro via Pix - VAI COXINHA LTDA
            </span>
          </div>
        </div>
      </div>

      {/* Botão de Confirmação */}
      <ShimmerButton
        onClick={handlePayment}
        disabled={isProcessing}
        className="w-full"
      >
        {isProcessing ? (
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Processando...</span>
          </div>
        ) : (
          '✅ Confirmar Pagamento'
        )}
      </ShimmerButton>

      {/* Informações Adicionais */}
      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500 mb-2">
          💳 Pagamento processado por VAI COXINHA LTDA
        </p>
        <p className="text-xs text-gray-400">
          Seu pedido será confirmado assim que o pagamento for aprovado
        </p>
      </div>
      </GlassCard>
    </BlurFade>
  )
}