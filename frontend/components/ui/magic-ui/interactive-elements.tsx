'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { 
  InteractiveHoverButton,
  RainbowButton,
  ShimmerButton,
  ShinyButton,
  PulsatingButton,
  RippleButton,
  MagicCard,
  NeonGradientCard,
  AnimatedList
} from './index'

interface InteractiveButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'rainbow' | 'shimmer' | 'shiny' | 'pulsating' | 'ripple' | 'hover'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  disabled?: boolean
  loading?: boolean
}

export function InteractiveButton({
  children,
  onClick,
  variant = 'hover',
  size = 'md',
  className,
  disabled = false,
  loading = false,
}: InteractiveButtonProps) {
  const [isHovered, setIsHovered] = useState(false)

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  const handleClick = () => {
    if (!disabled && !loading && onClick) {
      onClick()
    }
  }

  if (loading) {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-lg bg-gray-100 text-gray-400',
          sizeClasses[size],
          className
        )}
        disabled
      >
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-red-600" />
        Carregando...
      </button>
    )
  }

  switch (variant) {
    case 'rainbow':
      return (
        <RainbowButton
          onClick={handleClick}
          disabled={disabled}
          className={className}
        >
          {children}
        </RainbowButton>
      )
    case 'shimmer':
      return (
        <ShimmerButton
          onClick={handleClick}
          disabled={disabled}
          className={className}
        >
          {children}
        </ShimmerButton>
      )
    case 'shiny':
      return (
        <ShinyButton
          onClick={handleClick}
          disabled={disabled}
          className={className}
        >
          {children}
        </ShinyButton>
      )
    case 'pulsating':
      return (
        <PulsatingButton
          onClick={handleClick}
          disabled={disabled}
          className={className}
        >
          {children}
        </PulsatingButton>
      )
    case 'ripple':
      return (
        <RippleButton
          onClick={handleClick}
          disabled={disabled}
          className={className}
        >
          {children}
        </RippleButton>
      )
    case 'hover':
    default:
      return (
        <InteractiveHoverButton
          onClick={handleClick}
          disabled={disabled}
          className={className}
        >
          {children}
        </InteractiveHoverButton>
      )
  }
}

interface InteractiveCardProps {
  children: React.ReactNode
  variant?: 'magic' | 'neon' | 'gradient'
  className?: string
  gradientColors?: string[]
  onClick?: () => void
}

export function InteractiveCard({
  children,
  variant = 'magic',
  className,
  gradientColors = ['#dc2626', '#ea580c', '#f59e0b'],
  onClick,
}: InteractiveCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const handleClick = () => {
    if (onClick) {
      onClick()
    }
  }

  switch (variant) {
    case 'neon':
      return (
        <NeonGradientCard
          className={className}
          onClick={handleClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {children}
        </NeonGradientCard>
      )
    case 'gradient':
      return (
        <div
          className={cn(
            'relative overflow-hidden rounded-lg border bg-gradient-to-br p-6 transition-all duration-300 hover:scale-105',
            className
          )}
          style={{
            background: `linear-gradient(135deg, ${gradientColors.join(', ')})`,
          }}
          onClick={handleClick}
        >
          {children}
        </div>
      )
    case 'magic':
    default:
      return (
        <MagicCard
          className={className}
          gradientColor={gradientColors[0]}
          onClick={handleClick}
        >
          {children}
        </MagicCard>
      )
  }
}

interface AnimatedListItemProps {
  title: string
  description?: string
  icon?: React.ReactNode
  badge?: string
  time?: string
  className?: string
}

export function AnimatedListItem({
  title,
  description,
  icon,
  badge,
  time,
  className,
}: AnimatedListItemProps) {
  return (
    <div className={cn('flex items-start space-x-3 p-3', className)}>
      {icon && (
        <div className="flex-shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
            {icon}
          </div>
        </div>
      )}
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-900">{title}</h4>
          {time && (
            <span className="text-xs text-gray-500">{time}</span>
          )}
        </div>
        {description && (
          <p className="mt-1 text-sm text-gray-600">{description}</p>
        )}
        {badge && (
          <span className="mt-1 inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
            {badge}
          </span>
        )}
      </div>
    </div>
  )
}

interface AnimatedListDemoProps {
  items: AnimatedListItemProps[]
  className?: string
  maxVisible?: number
}

export function AnimatedListDemo({
  items,
  className,
  maxVisible = 5,
}: AnimatedListDemoProps) {
  return (
    <AnimatedList className={className} maxVisible={maxVisible}>
      {items.map((item, index) => (
        <AnimatedListItem key={index} {...item} />
      ))}
    </AnimatedList>
  )
}

interface HoverCardProps {
  children: React.ReactNode
  title: string
  description: string
  image?: string
  className?: string
}

export function HoverCard({
  children,
  title,
  description,
  image,
  className,
}: HoverCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-lg border bg-white shadow-lg transition-all duration-300 hover:shadow-xl',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {image && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={image}
            alt={title}
            className={cn(
              'h-full w-full object-cover transition-transform duration-300',
              isHovered && 'scale-110'
            )}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      )}
      <div className="p-6">
        <h3 className="mb-2 text-xl font-bold text-gray-900 group-hover:text-red-600 transition-colors">
          {title}
        </h3>
        <p className="text-gray-600">{description}</p>
        {children}
      </div>
    </div>
  )
}

// Utility functions for creating interactive elements
export const interactiveUtils = {
  createRippleEffect: (event: React.MouseEvent<HTMLElement>) => {
    const button = event.currentTarget
    const circle = document.createElement('span')
    const diameter = Math.max(button.clientWidth, button.clientHeight)
    const radius = diameter / 2

    circle.style.width = circle.style.height = `${diameter}px`
    circle.style.left = `${event.clientX - button.offsetLeft - radius}px`
    circle.style.top = `${event.clientY - button.offsetTop - radius}px`
    circle.classList.add('ripple')

    const ripple = button.getElementsByClassName('ripple')[0]
    if (ripple) {
      ripple.remove()
    }

    button.appendChild(circle)
  },

  addHoverSound: () => {
    // Add subtle hover sound effect
    const audio = new Audio('/sounds/hover.mp3')
    audio.volume = 0.1
    audio.play().catch(() => {
      // Ignore audio errors (autoplay restrictions)
    })
  },

  vibrateDevice: (duration = 50) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(duration)
    }
  },
}