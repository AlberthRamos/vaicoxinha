'use client'

import { cn } from '@/lib/utils'
import { 
  AnimatedCircularProgressBar, 
  FlickeringGrid, 
  GridPattern, 
  RetroGrid, 
  Ripple 
} from './index'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showProgress?: boolean
  progress?: number
}

export function LoadingSpinner({ 
  size = 'md', 
  className, 
  showProgress = false, 
  progress = 0 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  }

  if (showProgress) {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <AnimatedCircularProgressBar
          value={progress}
          max={100}
          className={sizeClasses[size]}
        />
      </div>
    )
  }

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-2 border-gray-300 border-t-red-600',
          sizeClasses[size]
        )}
      />
    </div>
  )
}

interface LoadingScreenProps {
  message?: string
  showGrid?: boolean
  gridType?: 'flickering' | 'retro' | 'pattern'
}

export function LoadingScreen({ 
  message = 'Carregando...', 
  showGrid = true,
  gridType = 'flickering' 
}: LoadingScreenProps) {
  return (
    <div className="relative flex h-screen w-full items-center justify-center overflow-hidden bg-gradient-to-br from-red-50 to-orange-50">
      {showGrid && (
        <div className="absolute inset-0">
          {gridType === 'flickering' && (
            <FlickeringGrid
              className="absolute inset-0 z-0"
              squareSize={4}
              gridGap={6}
              color="#dc2626"
              maxOpacity={0.1}
              flickerChance={0.3}
            />
          )}
          {gridType === 'retro' && (
            <RetroGrid className="absolute inset-0 z-0" />
          )}
          {gridType === 'pattern' && (
            <GridPattern
              className="absolute inset-0 z-0"
              width={32}
              height={32}
              x={-1}
              y={-1}
              strokeDasharray={0}
              fill="#dc2626"
              stroke="#dc2626"
            />
          )}
        </div>
      )}
      
      <div className="relative z-10 text-center">
        <Ripple />
        <div className="mb-4 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
        <p className="text-lg font-medium text-gray-700">{message}</p>
      </div>
    </div>
  )
}

interface SkeletonProps {
  className?: string
  lines?: number
  animated?: boolean
}

export function Skeleton({ className, lines = 3, animated = true }: SkeletonProps) {
  return (
    <div className={cn('w-full space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-4 w-full rounded bg-gray-200',
            animated && 'animate-pulse'
          )}
          style={{
            width: i === lines - 1 ? '75%' : '100%',
          }}
        />
      ))}
    </div>
  )
}

interface LoadingCardProps {
  count?: number
  className?: string
}

export function LoadingCard({ count = 3, className }: LoadingCardProps) {
  return (
    <div className={cn('grid gap-4', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 animate-pulse rounded-full bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

interface ProgressBarProps {
  value: number
  max?: number
  showLabel?: boolean
  className?: string
  color?: 'red' | 'orange' | 'green' | 'blue'
}

export function ProgressBar({ 
  value, 
  max = 100, 
  showLabel = false, 
  className,
  color = 'red'
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100)
  
  const colorClasses = {
    red: 'bg-red-600',
    orange: 'bg-orange-600',
    green: 'bg-green-600',
    blue: 'bg-blue-600',
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={cn(
            'h-full transition-all duration-300 ease-out',
            colorClasses[color]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="mt-1 text-right text-sm text-gray-600">
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  )
}