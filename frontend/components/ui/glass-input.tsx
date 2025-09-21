import React from 'react'
import { cn } from '@/lib/utils'

interface GlassInputProps {
  type?: string
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  className?: string
  disabled?: boolean
  required?: boolean
}

export const GlassInput: React.FC<GlassInputProps> = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  className,
  disabled = false,
  required = false
}) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      required={required}
      className={cn(
        'w-full px-4 py-3 rounded-xl',
        'bg-white/10 backdrop-blur-sm border border-white/20',
        'text-coxinha-dark placeholder:text-gray-500',
        'focus:outline-none focus:ring-2 focus:ring-coxinha-primary focus:border-transparent',
        'transition-all duration-200',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    />
  )
}