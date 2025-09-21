'use client'

import React from 'react'
import { Header } from '@/components/header'
import { CheckoutFlow } from '@/components/checkout-flow'
import { useRouter } from 'next/navigation'

export default function CheckoutPage() {
  const router = useRouter()

  const handleCheckoutComplete = () => {
    // Redirecionar para página de acompanhamento
    router.push('/acompanhamento')
  }

  const handleBack = () => {
    router.back()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-coxinha-light via-orange-50 to-white">
      <Header />
      
      <div className="container mx-auto px-4 py-8 pt-24">
        <CheckoutFlow 
          onComplete={handleCheckoutComplete}
          onBack={handleBack}
        />
      </div>
    </div>
  )
}