# Magic UI Components Integration Guide

## Overview
This directory contains Magic UI components integrated specifically for the Vai Coxinha PWA. These components provide beautiful animations, interactive elements, and visual feedback that enhance the user experience.

## Available Components

### Loading States
- **LoadingSpinner**: Animated loading spinner with progress bar option
- **LoadingScreen**: Full-screen loading component with background effects
- **Skeleton**: Placeholder loading skeleton
- **LoadingCard**: Card-based loading component
- **ProgressBar**: Animated progress bar with customizable colors

### Animations
- **AnimatedTitle**: Animated heading with blur-fade effect
- **AnimatedText**: Text animations (fadeIn, fadeInUp, fadeInDown, blurIn)
- **TypingText**: Typewriter effect for text
- **AnimatedCounter**: Animated number counter
- **RotatingText**: Rotating text animation
- **MorphingText**: Text morphing animation
- **HyperText**: Hyperactive text animation
- **SparklesText**: Text with sparkle effects
- **VelocityScroll**: Scroll-based velocity text
- **RevealBox**: Box reveal animation

### Interactive Elements
- **InteractiveButton**: Various button styles (rainbow, shimmer, shiny, pulsating, ripple, hover)
- **InteractiveCard**: Interactive cards (magic, neon, gradient)
- **AnimatedList**: Animated list component
- **HoverCard**: Hover effect card

## Usage Examples

### Loading States
```tsx
import { LoadingSpinner, LoadingScreen, Skeleton } from '@/components/ui/magic-ui/loading-states'

// Simple loading spinner
<LoadingSpinner size="lg" />

// Loading with progress
<LoadingSpinner showProgress progress={75} />

// Full screen loading
<LoadingScreen 
  message="Carregando seus pedidos..."
  showGrid={true}
  gridType="flickering"
/>

// Skeleton loading
<Skeleton lines={4} animated={true} />
```

### Animations
```tsx
import { AnimatedTitle, TypingText, AnimatedCounter } from '@/components/ui/magic-ui/animations'

// Animated title
<AnimatedTitle 
  text="Bem-vindo à Vai Coxinha!"
  as="h1"
  className="text-4xl font-bold text-red-600"
  delay={0.3}
/>

// Typing text effect
<TypingText 
  text="Sua coxinha favorita está chegando..."
  duration={100}
  className="text-lg text-gray-700"
/>

// Animated counter
<AnimatedCounter 
  value={42}
  prefix="R$ "
  suffix=" reais"
  duration={2000}
/>
```

### Interactive Elements
```tsx
import { InteractiveButton, InteractiveCard, AnimatedListDemo } from '@/components/ui/magic-ui/interactive-elements'

// Interactive button
<InteractiveButton 
  variant="rainbow"
  size="lg"
  onClick={() => console.log('Clicked!')}
>
  Comprar Agora
</InteractiveButton>

// Interactive card
<InteractiveCard 
  variant="magic"
  gradientColors={['#dc2626', '#ea580c']}
  onClick={() => console.log('Card clicked!')}
>
  <h3>Coxinha de Frango</h3>
  <p>A melhor coxinha da cidade!</p>
</InteractiveCard>

// Animated list
<AnimatedListDemo 
  items={[
    {
      title: "Pedido Confirmado",
      description: "Seu pedido foi recebido com sucesso",
      time: "2 min atrás",
      badge: "Novo"
    },
    // ... more items
  ]}
/>
```

## Integration with Existing Components

### Product Card Enhancement
```tsx
// Enhanced ProductCard with Magic UI
import { InteractiveCard, AnimatedCounter } from '@/components/ui/magic-ui'

export function ProductCard({ product }) {
  return (
    <InteractiveCard 
      variant="magic"
      gradientColors={['#dc2626', '#f59e0b']}
      className="h-full"
    >
      <img src={product.image} alt={product.name} />
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <div className="flex items-center justify-between">
        <AnimatedCounter 
          value={product.price}
          prefix="R$ "
          duration={1000}
        />
        <InteractiveButton variant="shimmer" size="sm">
          Adicionar
        </InteractiveButton>
      </div>
    </InteractiveCard>
  )
}
```

### Order Status Enhancement
```tsx
// Enhanced OrderStatus with Magic UI
import { LoadingScreen, ProgressBar, TypingText } from '@/components/ui/magic-ui'

export function OrderStatus({ order }) {
  if (order.status === 'loading') {
    return (
      <LoadingScreen 
        message="Preparando seu pedido..."
        showGrid={true}
        gridType="retro"
      />
    )
  }

  return (
    <div className="space-y-4">
      <TypingText 
        text={`Status do pedido: ${order.status}`}
        className="text-lg font-medium"
      />
      <ProgressBar 
        value={getOrderProgress(order.status)}
        showLabel={true}
        color="red"
      />
    </div>
  )
}
```

### Cart Sidebar Enhancement
```tsx
// Enhanced CartSidebar with Magic UI
import { AnimatedListDemo, InteractiveButton } from '@/components/ui/magic-ui'

export function CartSidebar({ items }) {
  return (
    <div className="space-y-4">
      <AnimatedListDemo 
        items={items.map(item => ({
          title: item.name,
          description: `Quantidade: ${item.quantity}`,
          badge: `R$ ${item.total}`,
          icon: <ShoppingCartIcon className="h-5 w-5" />
        }))}
      />
      <InteractiveButton variant="rainbow" size="lg" className="w-full">
        Finalizar Pedido
      </InteractiveButton>
    </div>
  )
}
```

## Customization

### Theme Integration
```tsx
// Tailwind CSS integration
const theme = {
  colors: {
    primary: {
      50: '#fef2f2',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
    },
    secondary: {
      50: '#fff7ed',
      500: '#f97316',
      600: '#ea580c',
      700: '#c2410c',
    }
  }
}

// Usage with Magic UI components
<InteractiveCard 
  variant="magic"
  gradientColors={[theme.colors.primary[600], theme.colors.secondary[600]]}
>
  Content
</InteractiveCard>
```

### Animation Presets
```tsx
import { animationPresets } from '@/components/ui/magic-ui/animations'

// Use predefined animation presets
<AnimatedTitle 
  text="Vai Coxinha"
  delay={animationPresets.hero.title.delay}
  duration={animationPresets.hero.title.duration}
/>
```

## Performance Considerations

### Lazy Loading
```tsx
import dynamic from 'next/dynamic'

const MagicUIComponents = dynamic(
  () => import('@/components/ui/magic-ui'),
  { 
    loading: () => <LoadingSpinner />,
    ssr: false 
  }
)
```

### Conditional Rendering
```tsx
// Only animate on client-side
const [isClient, setIsClient] = useState(false)

useEffect(() => {
  setIsClient(true)
}, [])

return (
  <div>
    {isClient && (
      <AnimatedTitle text="Vai Coxinha" />
    )}
  </div>
)
```

## Mobile Optimization

### Touch Interactions
```tsx
// Enhanced touch interactions for mobile
<InteractiveButton 
  variant="ripple"
  onTouchStart={() => {
    // Add haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(50)
    }
  }}
>
  Adicionar ao Carrinho
</InteractiveButton>
```

### Responsive Animations
```tsx
// Different animations for mobile/desktop
const isMobile = useMediaQuery('(max-width: 768px)')

<AnimatedTitle 
  text="Vai Coxinha"
  duration={isMobile ? 0.6 : 0.8}
  delay={isMobile ? 0.1 : 0.3}
/>
```

## Accessibility

### ARIA Labels
```tsx
<InteractiveButton 
  variant="rainbow"
  aria-label="Adicionar coxinha de frango ao carrinho"
  aria-describedby="product-price"
>
  Adicionar
</InteractiveButton>
```

### Reduced Motion
```tsx
// Respect user preference for reduced motion
const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

<AnimatedTitle 
  text="Vai Coxinha"
  duration={prefersReducedMotion ? 0.1 : 0.8}
/>
```

## Testing

### Component Testing
```tsx
// Test Magic UI components
import { render, screen } from '@testing-library/react'
import { InteractiveButton } from '@/components/ui/magic-ui/interactive-elements'

test('InteractiveButton renders correctly', () => {
  render(
    <InteractiveButton variant="rainbow">
      Test Button
    </InteractiveButton>
  )
  
  expect(screen.getByText('Test Button')).toBeInTheDocument()
})
```

### Animation Testing
```tsx
// Test animations
import { AnimatedTitle } from '@/components/ui/magic-ui/animations'

test('AnimatedTitle applies correct delay', () => {
  const { container } = render(
    <AnimatedTitle text="Test" delay={0.5} />
  )
  
  expect(container.firstChild).toHaveStyle('animation-delay: 0.5s')
})
```

## Troubleshooting

### Common Issues

1. **Animations not working**: Check if framer-motion is installed
2. **Performance issues**: Use lazy loading and conditional rendering
3. **Mobile performance**: Reduce animation complexity on mobile
4. **Build errors**: Ensure all dependencies are installed

### Performance Tips
- Use `React.memo` for expensive components
- Implement virtual scrolling for long lists
- Use CSS animations instead of JavaScript when possible
- Optimize images and assets

## Resources

- [Magic UI Documentation](https://magicui.design/docs)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Documentation](https://react.dev/)