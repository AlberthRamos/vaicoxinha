'use client'

import { 
  BlurFade,
  TextAnimate,
  TypingAnimation,
  NumberTicker,
  WordRotate,
  MorphingText,
  HyperText,
  SparklesText,
  ScrollBasedVelocity,
  BoxReveal
} from './index'

interface AnimatedTitleProps {
  text: string
  className?: string
  delay?: number
  duration?: number
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

export function AnimatedTitle({ 
  text, 
  className, 
  delay = 0.2, 
  duration = 0.8,
  as = 'h1'
}: AnimatedTitleProps) {
  const Component = as
  
  return (
    <BlurFade delay={delay} duration={duration}>
      <Component className={className}>
        {text}
      </Component>
    </BlurFade>
  )
}

interface AnimatedTextProps {
  text: string
  className?: string
  delay?: number
  type?: 'fadeIn' | 'fadeInUp' | 'fadeInDown' | 'blurIn'
}

export function AnimatedText({ 
  text, 
  className, 
  delay = 0.4,
  type = 'fadeIn'
}: AnimatedTextProps) {
  return (
    <TextAnimate
      text={text}
      className={className}
      delay={delay}
      type={type}
    />
  )
}

interface TypingTextProps {
  text: string
  className?: string
  duration?: number
  delay?: number
}

export function TypingText({ 
  text, 
  className, 
  duration = 200,
  delay = 0
}: TypingTextProps) {
  return (
    <TypingAnimation
      text={text}
      className={className}
      duration={duration}
      delay={delay}
    />
  )
}

interface AnimatedCounterProps {
  value: number
  className?: string
  duration?: number
  delay?: number
  prefix?: string
  suffix?: string
}

export function AnimatedCounter({ 
  value, 
  className, 
  duration = 2000,
  delay = 0,
  prefix = '',
  suffix = ''
}: AnimatedCounterProps) {
  return (
    <div className={className}>
      {prefix}
      <NumberTicker value={value} duration={duration} delay={delay} />
      {suffix}
    </div>
  )
}

interface RotatingTextProps {
  words: string[]
  className?: string
  duration?: number
}

export function RotatingText({ 
  words, 
  className, 
  duration = 3000
}: RotatingTextProps) {
  return (
    <WordRotate
      words={words}
      className={className}
      duration={duration}
    />
  )
}

interface MorphingTextProps {
  texts: string[]
  className?: string
  duration?: number
}

export function MorphingText({ 
  texts, 
  className, 
  duration = 2000
}: MorphingTextProps) {
  return (
    <MorphingText
      texts={texts}
      className={className}
      duration={duration}
    />
  )
}

interface HyperTextProps {
  text: string
  className?: string
  duration?: number
  delay?: number
}

export function HyperText({ 
  text, 
  className, 
  duration = 800,
  delay = 0
}: HyperTextProps) {
  return (
    <HyperText
      text={text}
      className={className}
      duration={duration}
      delay={delay}
    />
  )
}

interface SparklesTextProps {
  text: string
  className?: string
  colors?: { first: string; second: string }
}

export function SparklesText({ 
  text, 
  className, 
  colors = { first: '#dc2626', second: '#ea580c' }
}: SparklesTextProps) {
  return (
    <SparklesText
      text={text}
      className={className}
      colors={colors}
    />
  )
}

interface VelocityScrollProps {
  text: string
  className?: string
  velocity?: number
}

export function VelocityScroll({ 
  text, 
  className, 
  velocity = 5
}: VelocityScrollProps) {
  return (
    <ScrollBasedVelocity
      text={text}
      className={className}
      velocity={velocity}
    />
  )
}

interface RevealBoxProps {
  children: React.ReactNode
  className?: string
  delay?: number
  direction?: 'top' | 'bottom' | 'left' | 'right'
}

export function RevealBox({ 
  children, 
  className, 
  delay = 0.2,
  direction = 'bottom'
}: RevealBoxProps) {
  return (
    <BoxReveal
      className={className}
      delay={delay}
      direction={direction}
    >
      {children}
    </BoxReveal>
  )
}

// Custom animation variants for common use cases
export const animationVariants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  fadeInDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
  },
  slideInLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  slideInRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
}

// Animation presets for different components
export const animationPresets = {
  hero: {
    title: { delay: 0.2, duration: 0.8 },
    subtitle: { delay: 0.4, duration: 0.8 },
    cta: { delay: 0.6, duration: 0.8 },
  },
  card: {
    default: { delay: 0.2, duration: 0.6 },
    stagger: { delay: 0.1, duration: 0.5 },
  },
  button: {
    default: { delay: 0, duration: 0.3 },
    hover: { delay: 0, duration: 0.2 },
  },
  text: {
    default: { delay: 0.3, duration: 0.6 },
    fast: { delay: 0.1, duration: 0.4 },
    slow: { delay: 0.5, duration: 1.0 },
  },
}