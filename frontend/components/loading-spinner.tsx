'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { CoxinhaAnimation } from './coxinha-animation'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'secondary' | 'white'
  text?: string
  useCoxinha?: boolean
}

export default function LoadingSpinner({ size = 'md', color = 'primary', text, useCoxinha = false }: LoadingSpinnerProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }

  const colorClasses = {
    primary: 'border-coxinha-primary',
    secondary: 'border-coxinha-secondary',
    white: 'border-white'
  }

  // Fallback para SSR
  if (!isClient) {
    return (
      <div className="flex flex-col items-center justify-center space-y-3">
        <div className={`${sizeClasses[size]} ${colorClasses[color]} border-4 border-t-transparent rounded-full`}></div>
        {text && <p className="text-sm text-gray-600">{text}</p>}
      </div>
    )
  }

  // Se useCoxinha for true, usar a animação de coxinha
  if (useCoxinha) {
    return <CoxinhaAnimation size={size} />
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-3">
      <motion.div
        className={`${sizeClasses[size]} ${colorClasses[color]} border-4 border-t-transparent rounded-full`}
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      {text && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-gray-600"
        >
          {text}
        </motion.p>
      )}
    </div>
  )
}