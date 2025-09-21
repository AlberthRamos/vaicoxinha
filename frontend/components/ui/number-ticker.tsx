import React, { useEffect, useRef } from 'react'

interface NumberTickerProps {
  value: number
  duration?: number
  className?: string
}

export const NumberTicker: React.FC<NumberTickerProps> = ({
  value,
  duration = 1000,
  className,
}) => {
  const ref = useRef<HTMLSpanElement>(null)
  const frameRef = useRef<number>()
  const startValueRef = useRef(0)
  const startTimeRef = useRef<number>()

  useEffect(() => {
    const animate = (currentTime: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = currentTime
        startValueRef.current = parseInt(ref.current?.textContent || '0')
      }

      const elapsed = currentTime - startTimeRef.current
      const progress = Math.min(elapsed / duration, 1)

      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      const currentValue = Math.floor(startValueRef.current + (value - startValueRef.current) * easeOutQuart)

      if (ref.current) {
        ref.current.textContent = currentValue.toString()
      }

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate)
      }
    }

    frameRef.current = requestAnimationFrame(animate)

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [value, duration])

  return <span ref={ref} className={className}>{value}</span>
}