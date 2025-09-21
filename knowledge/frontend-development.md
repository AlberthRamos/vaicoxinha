# Frontend Development Guide - Vai Coxinha PWA

## Overview
This guide covers the frontend development practices, architecture, and implementation details for the Vai Coxinha Progressive Web Application (PWA).

## Technology Stack

### Core Technologies
- **Framework**: Next.js 14.x (App Router)
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS 3.x
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form + Zod
- **PWA**: next-pwa

### UI/UX Libraries
- **Component Library**: Custom components with Magic UI
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Loading**: React Loading Skeleton
- **Notifications**: React Hot Toast

### Development Tools
- **Package Manager**: npm/yarn
- **Code Quality**: ESLint + Prettier
- **Testing**: Jest + React Testing Library
- **Build Analysis**: @next/bundle-analyzer

## Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── (main)/             # Main application routes
│   ├── admin/              # Admin dashboard
│   ├── api/                # API routes
│   └── globals.css
├── components/             # React components
│   ├── ui/                 # Base UI components
│   ├── forms/              # Form components
│   ├── layout/             # Layout components
│   └── features/           # Feature-specific components
├── lib/                    # Utilities and configurations
│   ├── api/                # API utilities
│   ├── hooks/              # Custom hooks
│   ├── utils/              # Utility functions
│   └── validations/        # Zod schemas
├── store/                  # Zustand stores
├── types/                  # TypeScript types
├── public/                 # Static assets
│   ├── images/             # Images and icons
│   └── manifest.json       # PWA manifest
└── tests/                  # Test files
```

## Component Architecture

### Base UI Components
Located in `components/ui/`, these are reusable, atomic components:

```typescript
// components/ui/button.tsx
import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          {
            'bg-primary text-white hover:bg-primary/90': variant === 'primary',
            'bg-secondary text-secondary-foreground hover:bg-secondary/90': variant === 'secondary',
            'border border-input hover:bg-accent hover:text-accent-foreground': variant === 'outline',
            'hover:bg-accent hover:text-accent-foreground': variant === 'ghost',
          },
          {
            'h-8 px-3 text-sm': size === 'sm',
            'h-10 px-4': size === 'md',
            'h-12 px-6': size === 'lg',
          },
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <LoadingSpinner className="mr-2 h-4 w-4" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

### Feature Components
Located in `components/features/`, these are domain-specific components:

```typescript
// components/features/product-card.tsx
import { Product } from '@/types/product';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: string) => void;
  isLoading?: boolean;
}

export function ProductCard({ product, onAddToCart, isLoading }: ProductCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-square relative">
        <img
          src={product.image}
          alt={product.name}
          className="object-cover w-full h-full"
          loading="lazy"
        />
        {product.isFeatured && (
          <Badge className="absolute top-2 left-2">Destaque</Badge>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description}</p>
        
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-primary">
            {formatCurrency(product.price)}
          </span>
          
          <Button
            onClick={() => onAddToCart(product.id)}
            disabled={!product.isAvailable || isLoading}
            size="sm"
          >
            {isLoading ? 'Adicionando...' : 'Adicionar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

## State Management

### Zustand Store Pattern
```typescript
// store/auth-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isLoading: false,
      
      setUser: (user) => set({ user }),
      setAccessToken: (accessToken) => set({ accessToken }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ user: null, accessToken: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
      }),
    }
  )
);
```

### Cart Store with Persistence
```typescript
// store/cart-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  observations?: string;
}

interface CartState {
  items: CartItem[];
  isLoading: boolean;
  
  // Computed
  total: number;
  itemCount: number;
  
  // Actions
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  syncWithServer: () => Promise<void>;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      
      get total() {
        return get().items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      },
      
      get itemCount() {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
      
      addItem: (item) => {
        const existingItem = get().items.find(i => i.productId === item.productId);
        
        if (existingItem) {
          set({
            items: get().items.map(i =>
              i.productId === item.productId
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            )
          });
        } else {
          set({ items: [...get().items, { ...item, id: generateId() }] });
        }
      },
      
      removeItem: (id) => {
        set({ items: get().items.filter(item => item.id !== id) });
      },
      
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        
        set({
          items: get().items.map(item =>
            item.id === id ? { ...item, quantity } : item
          )
        });
      },
      
      clearCart: () => set({ items: [] }),
      
      syncWithServer: async () => {
        set({ isLoading: true });
        try {
          // Sync cart with server
          await cartApi.sync(get().items);
        } catch (error) {
          console.error('Failed to sync cart:', error);
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
```

## API Integration

### API Client Setup
```typescript
// lib/api/client.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { useAuthStore } from '@/store/auth-store';

class ApiClient {
  private client: AxiosInstance;
  
  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    this.setupInterceptors();
  }
  
  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = useAuthStore.getState().accessToken;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Handle token refresh or logout
          useAuthStore.getState().logout();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }
  
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }
  
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }
  
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }
  
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
```

### API Hooks
```typescript
// lib/hooks/use-products.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Product } from '@/types/product';

const PRODUCT_KEYS = {
  all: ['products'] as const,
  lists: () => [...PRODUCT_KEYS.all, 'list'] as const,
  list: (filters: any) => [...PRODUCT_KEYS.lists(), filters] as const,
  details: () => [...PRODUCT_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...PRODUCT_KEYS.details(), id] as const,
};

export function useProducts(filters?: any) {
  return useQuery({
    queryKey: PRODUCT_KEYS.list(filters),
    queryFn: () => apiClient.get<Product[]>('/products', { params: filters }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: PRODUCT_KEYS.detail(id),
    queryFn: () => apiClient.get<Product>(`/products/${id}`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (orderData: any) => apiClient.post('/orders', orderData),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries(PRODUCT_KEYS.all);
      queryClient.invalidateQueries(['orders']);
    },
  });
}
```

## Form Handling

### Form Validation with Zod
```typescript
// lib/validations/auth.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().regex(/^\+?\d{10,15}$/, 'Telefone inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
```

### Form Component
```typescript
// components/forms/login-form.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginInput } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/hooks/use-auth';

export function LoginForm() {
  const { login, isLoading } = useAuth();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });
  
  const onSubmit = async (data: LoginInput) => {
    try {
      await login(data);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Input
          {...register('email')}
          type="email"
          placeholder="Email"
          error={errors.email?.message}
        />
      </div>
      
      <div>
        <Input
          {...register('password')}
          type="password"
          placeholder="Senha"
          error={errors.password?.message}
        />
      </div>
      
      <Button type="submit" isLoading={isLoading} className="w-full">
        Entrar
      </Button>
    </form>
  );
}
```

## PWA Implementation

### Service Worker Configuration
```typescript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  
  // Runtime caching strategies
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/api\.vai-coxinha\.com\/api\/products/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'products-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24, // 24 hours
        },
      },
    },
    {
      urlPattern: /^https:\/\/vai-coxinha\.s3\.amazonaws\.com/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
  ],
});
```

### Offline Support
```typescript
// lib/hooks/use-offline.ts
import { useState, useEffect } from 'react';

export function useOffline() {
  const [isOffline, setIsOffline] = useState(false);
  
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial state
    setIsOffline(!navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return { isOffline };
}
```

### Install Prompt
```typescript
// components/pwa/install-prompt.tsx
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
  
  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };
  
  if (!showPrompt) return null;
  
  return (
    <div className="fixed bottom-4 left-4 right-4 bg-background border rounded-lg p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Instalar Vai Coxinha</h3>
          <p className="text-sm text-muted-foreground">
            Adicione nosso app à tela inicial para um acesso rápido
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPrompt(false)}>
            Agora não
          </Button>
          <Button onClick={handleInstall}>
            Instalar
          </Button>
        </div>
      </div>
    </div>
  );
}
```

## Performance Optimization

### Image Optimization
```typescript
// components/ui/optimized-image.tsx
import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  fill = false,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  
  return (
    <div className={cn('relative overflow-hidden', className)}>
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        className={cn(
          'object-cover transition-all duration-300',
          isLoading ? 'blur-sm scale-105' : 'blur-0 scale-100'
        )}
        onLoadingComplete={() => setIsLoading(false)}
        placeholder="blur"
        blurDataURL="data:image/jpeg;base64,..." // Base64 placeholder
      />
      
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
    </div>
  );
}
```

### Code Splitting
```typescript
// app/(main)/products/page.tsx
import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Lazy load heavy components
const ProductGrid = lazy(() => import('@/components/features/product-grid'));
const ProductFilters = lazy(() => import('@/components/features/product-filters'));

export default function ProductsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex gap-8">
        <Suspense fallback={<LoadingSpinner />}>
          <ProductFilters />
        </Suspense>
        
        <Suspense fallback={<LoadingSpinner />}>
          <ProductGrid />
        </Suspense>
      </div>
    </div>
  );
}
```

## Testing Strategy

### Component Testing
```typescript
// components/ui/__tests__/button.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../button';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });
  
  it('handles click events', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    await user.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  it('shows loading state', () => {
    render(<Button isLoading>Submit</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});
```

### Integration Testing
```typescript
// __tests__/integration/product-flow.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProductsPage } from '@/app/(main)/products/page';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
  },
});

describe('Product Flow', () => {
  it('allows users to browse and add products to cart', async () => {
    const user = userEvent.setup();
    
    render(
      <QueryClientProvider client={queryClient}>
        <ProductsPage />
      </QueryClientProvider>
    );
    
    // Wait for products to load
    await waitFor(() => {
      expect(screen.getByText('Coxinha de Frango')).toBeInTheDocument();
    });
    
    // Add product to cart
    const addButton = screen.getByRole('button', { name: /adicionar/i });
    await user.click(addButton);
    
    // Verify cart updated
    expect(screen.getByTestId('cart-count')).toHaveTextContent('1');
  });
});
```

## Deployment Configuration

### Environment Variables
```bash
# .env.local
NEXT_PUBLIC_API_URL=https://api.vai-coxinha.com
NEXT_PUBLIC_APP_URL=https://vai-coxinha.com
NEXTAUTH_URL=https://vai-coxinha.com
NEXTAUTH_SECRET=your-secret-key

# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_HOTJAR_ID=1234567

# PWA
NEXT_PUBLIC_PWA_ENABLED=true
```

### Build Optimization
```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  images: {
    domains: ['vai-coxinha.s3.amazonaws.com'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Bundle optimization
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },
  
  // Webpack configuration
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    
    return config;
  },
  
  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

This comprehensive frontend development guide provides the foundation for building a robust, performant, and user-friendly PWA for Vai Coxinha. Follow these patterns and practices to ensure consistent, maintainable code that delivers an excellent user experience.