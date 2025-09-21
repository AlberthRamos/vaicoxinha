import React from 'react'
import { cn } from '@/lib/utils'

interface GlassCardProps {
  children: React.ReactNode
  className?: string
  variant?: 'default' | 'elevated' | 'flat'
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className, 
  variant = 'default' 
}) => {
  const variants = {
    default: 'bg-white/10 backdrop-blur-sm border border-white/20',
    elevated: 'bg-white/20 backdrop-blur-md border border-white/30 shadow-xl',
    flat: 'bg-white/5 backdrop-blur-sm border border-white/10'
  }

  return (
    <div className={cn(
      'rounded-2xl p-6 transition-all duration-300',
      variants[variant],
      className
    )}>
      {children}
    </div>
  )
}