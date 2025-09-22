export const backendConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
}

export const endpoints = {
  products: {
    list: '/api/products',
    byId: (id: string) => `/api/products/${id}`,
    byCategory: (category: string) => `/api/products/category/${category}`,
    featured: '/api/products/featured',
    topRated: '/api/products/top-rated',
  },
  categories: {
    list: '/api/categories',
  },
  orders: {
    create: '/api/orders',
    byId: (id: string) => `/api/orders/${id}`,
    byUser: (userId: string) => `/api/orders/user/${userId}`,
  },
  payments: {
    createPreference: '/api/payments/create-preference',
    getStatus: (paymentId: string) => `/api/payments/status/${paymentId}`,
    webhook: '/api/payments/webhook',
  },
  auth: {
    login: '/api/auth/login',
    register: '/api/auth/register',
    profile: '/api/auth/profile',
    refresh: '/api/auth/refresh',
  },
}

export const mercadoPagoConfig = {
  publicKey: process.env.NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY || 'TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  preferenceId: process.env.NEXT_PUBLIC_MERCADO_PAGO_PREFERENCE_ID,
}