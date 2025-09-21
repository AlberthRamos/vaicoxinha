import React, { useEffect, useState } from 'react'

interface ConfettiProps {
  duration?: number
  particleCount?: number
}

export const Confetti: React.FC<ConfettiProps> = ({
  duration = 3000,
  particleCount = 100,
}) => {
  const [particles, setParticles] = useState<Array<{
    id: number
    x: number
    y: number
    color: string
    size: number
    delay: number
    duration: number
  }>>([])

  useEffect(() => {
    const colors = ['#FF6B35', '#F7931E', '#FFD23F', '#06FFA5', '#118AB2']
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * -100 - 50,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      delay: Math.random() * 0.5,
      duration: Math.random() * 1 + 0.5,
    }))

    setParticles(newParticles)

    const timer = setTimeout(() => {
      setParticles([])
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, particleCount])

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute animate-bounce"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            backgroundColor: particle.color,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            borderRadius: '50%',
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
            transform: `rotate(${Math.random() * 360}deg)`,
            boxShadow: `0 0 ${particle.size}px ${particle.color}40`,
          }}
        />
      ))}
    </div>
  )
}