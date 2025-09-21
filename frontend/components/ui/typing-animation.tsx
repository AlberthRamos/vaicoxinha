import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface TypingAnimationProps {
  text: string
  duration?: number
  className?: string
}

export const TypingAnimation: React.FC<TypingAnimationProps> = ({
  text,
  duration = 200,
  className,
}) => {
  const [displayText, setDisplayText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, duration)

      return () => clearTimeout(timeout)
    }
  }, [currentIndex, duration, text])

  return (
    <div className={cn(className)}>
      {displayText}
      <span className="animate-pulse">|</span>
    </div>
  )
}