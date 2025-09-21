'use client'

import React, { useState, useEffect } from 'react'

interface NotificationPermissionProps {
  onPermissionGranted?: () => void
  onPermissionDenied?: () => void
}

export function NotificationPermission({ 
  onPermissionGranted, 
  onPermissionDenied 
}: NotificationPermissionProps) {
  const [showPrompt, setShowPrompt] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission | 'default'>('default')
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    // Verificar se o navegador suporta notificações
    if (!isClient || !('Notification' in window)) {
      console.log('Este navegador não suporta notificações')
      return
    }

    // Verificar permissão atual
    if (Notification.permission === 'default') {
      setShowPrompt(true)
    } else {
      setPermission(Notification.permission)
    }
  }, [isClient])

  const requestPermission = async () => {
    if (!isClient || !('Notification' in window)) {
      setShowPrompt(false)
      onPermissionDenied?.()
      return
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      setShowPrompt(false)
      
      if (result === 'granted') {
        onPermissionGranted?.()
      } else {
        onPermissionDenied?.()
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error)
      setShowPrompt(false)
      onPermissionDenied?.()
    }
  }

  const dismissPrompt = () => {
    setShowPrompt(false)
    onPermissionDenied?.()
  }

  // Fallback para SSR ou quando não é cliente
  if (!isClient || !showPrompt) {
    return null
  }

  return (
    <div
      className="fixed bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-6 z-50 max-w-md mx-auto animate-slide-up"
      style={{
        animation: 'slideUp 0.3s ease-out'
      }}
    >
      <div className="text-center">
        <div className="text-4xl mb-4">🔔</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Ativar Notificações
        </h3>
        <p className="text-gray-600 mb-6">
          Receba atualizações sobre seu pedido e ofertas especiais!
        </p>
        <div className="flex space-x-3">
          <button
            onClick={dismissPrompt}
            className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Agora não
          </button>
          <button
            onClick={requestPermission}
            className="flex-1 px-4 py-2 bg-coxinha-primary text-white rounded-lg hover:bg-coxinha-dark transition-colors"
          >
            Ativar
          </button>
        </div>
      </div>
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(100px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}