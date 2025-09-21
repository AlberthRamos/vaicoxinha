'use client'

import React, { useState, useEffect } from 'react'

// Interfaces para os componentes
interface CoxinhaAnimationProps {
  size?: 'small' | 'medium' | 'large'
  className?: string
}

interface CoxinhaLoadingProps {
  count?: number
}

export function CoxinhaAnimation({ size = 'medium', className = '' }: CoxinhaAnimationProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-16 h-16',
    large: 'w-24 h-24'
  }

  // Fallback para SSR
  if (!isClient) {
    return (
      <div className={`relative ${sizeClasses[size]} ${className}`}>
        <div className="w-full h-full bg-yellow-600 rounded-full animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <style jsx>{`
        .coxinha-bounce {
          animation: coxinhaBounce 2s ease-in-out infinite;
        }
        @keyframes coxinhaBounce {
          0%, 100% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(5deg) scale(1.05); }
          50% { transform: rotate(-5deg) scale(1.1); }
          75% { transform: rotate(3deg) scale(1.05); }
        }
        .sparkle {
          animation: sparkle 1.5s ease-in-out infinite;
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
      `}</style>
      {/* Coxinha principal */}
      <div className="absolute inset-0 coxinha-bounce">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Corpo da coxinha */}
          <path
            d="M50 15 C70 15, 85 30, 85 50 C85 70, 70 85, 50 85 C30 85, 15 70, 15 50 C15 30, 30 15, 50 15 Z"
            fill="#D2691E"
            stroke="#8B4513"
            strokeWidth="2"
          />
          
          {/* Recheio saindo */}
          <path
            d="M35 45 Q50 35, 65 45 Q50 55, 35 45 Z"
            fill="#FFF8DC"
            stroke="#F5DEB3"
            strokeWidth="1"
          />
          
          {/* Detalhes de fritura */}
          <circle cx="30" cy="35" r="2" fill="#8B4513" opacity="0.6" />
          <circle cx="70" cy="40" r="1.5" fill="#8B4513" opacity="0.6" />
          <circle cx="65" cy="65" r="2" fill="#8B4513" opacity="0.6" />
          <circle cx="35" cy="70" r="1" fill="#8B4513" opacity="0.6" />
        </svg>
      </div>

      {/* Partículas de brilho */}
      <div className="absolute inset-0 sparkle">
        <div className="absolute top-2 left-2 w-2 h-2 bg-yellow-300 rounded-full opacity-70" />
        <div className="absolute bottom-4 right-3 w-1 h-1 bg-yellow-200 rounded-full opacity-60" />
        <div className="absolute top-1/2 left-1 w-1 h-1 bg-yellow-400 rounded-full opacity-80" />
      </div>
    </div>
  )
}

// Componente de loading com múltiplas coxinhas
export function CoxinhaLoading({ count = 3 }: CoxinhaLoadingProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Fallback para SSR
  if (!isClient) {
    return (
      <div className="flex items-center justify-center gap-4">
        {[...Array(count)].map((_, i) => (
          <div key={i} className="w-8 h-8 bg-yellow-600 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center gap-4">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="animate-bounce"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.8s' }}
        >
          <CoxinhaAnimation size="small" />
        </div>
      ))}
    </div>
  )
}