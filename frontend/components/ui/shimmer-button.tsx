import React from 'react'
import { cn } from '@/lib/utils'

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string
  duration?: string
  borderRadius?: string
}

export const ShimmerButton: React.FC<ShimmerButtonProps> = ({
  children,
  className,
  shimmerColor = '#ffffff',
  duration = '3s',
  borderRadius = '8px',
  ...props
}) => {
  return (
    <button
      className={cn(
        'relative inline-flex items-center justify-center rounded-xl font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 overflow-hidden',
        className
      )}
      style={{
        borderRadius,
      }}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-r opacity-0 hover:opacity-20 transition-opacity duration-300"
        style={{
          background: `linear-gradient(90deg, transparent, ${shimmerColor}, transparent)`,
          animation: `shimmer ${duration} infinite linear`,
        }}
      />
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </button>
  )
}