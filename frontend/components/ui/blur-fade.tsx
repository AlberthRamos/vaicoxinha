import React, { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface BlurFadeProps {
  children: React.ReactNode
  className?: string
  delay?: number
  duration?: number
  offset?: number
  direction?: 'up' | 'down' | 'left' | 'right'
}

export const BlurFade: React.FC<BlurFadeProps> = ({
  children,
  className,
  delay = 0,
  duration = 0.5,
  offset = 20,
  direction = 'up',
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      {
        threshold: 0.1,
      }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [])

  const getTransform = () => {
    if (!isVisible) {
      switch (direction) {
        case 'up':
          return `translateY(${offset}px)`
        case 'down':
          return `translateY(-${offset}px)`
        case 'left':
          return `translateX(${offset}px)`
        case 'right':
          return `translateX(-${offset}px)`
        default:
          return `translateY(${offset}px)`
      }
    }
    return 'translate(0)'
  }

  return (
    <div
      ref={ref}
      className={cn(className)}
      style={{
        transform: getTransform(),
        opacity: isVisible ? 1 : 0,
        filter: isVisible ? 'blur(0px)' : 'blur(4px)',
        transition: `all ${duration}s ease-out ${delay}s`,
      }}
    >
      {children}
    </div>
  )
}