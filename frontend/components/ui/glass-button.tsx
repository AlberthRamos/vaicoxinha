import React from 'react'
import { cn } from '@/lib/utils'

interface GlassButtonProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  onClick,
  className,
  variant = 'primary',
  size = 'md',
  disabled = false,
  type = 'button'
}) => {
  const variants = {
    primary: 'bg-gradient-to-r from-coxinha-primary to-coxinha-secondary text-white',
    secondary: 'bg-white/20 text-coxinha-dark hover:bg-white/30',
    outline: 'bg-transparent border-2 border-coxinha-primary text-coxinha-primary hover:bg-coxinha-primary hover:text-white'
  }

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'rounded-xl font-bold transition-all duration-200',
        'active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
        'backdrop-blur-sm shadow-lg hover:shadow-xl',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </button>
  )
}