import axios, { AxiosInstance, AxiosRequestConfig } from 'axios'
import { backendConfig, endpoints } from '@/config/backend'

export interface Product {
  id: string
  name: string
  description: string
  price: number
  originalPrice?: number
  image: string
  category: string
  featured: boolean
  isNew?: boolean
  available: boolean
  preparationTime: number
  rating?: number
  reviewCount?: number
  isVegan?: boolean
  nutritionalInfo?: {
    calories: number
    protein: number
    carbs: number
    fat: number
  }
}

export interface ProductFilters {
  category?: string
  featured?: boolean
  isNew?: boolean
  minPrice?: number
  maxPrice?: number
  available?: boolean
  search?: string
}

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedProductsResult {
  products: Product[]
  total: number
  page: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

class ProductsService {
  private api: AxiosInstance

  constructor() {
    this.api = axios.create({
      baseURL: backendConfig.baseURL,
      timeout: backendConfig.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          localStorage.removeItem('token')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    )
  }

  private async requestWithRetry<T>(
    requestFn: () => Promise<T>,
    attempts = backendConfig.retryAttempts
  ): Promise<T> {
    try {
      return await requestFn()
    } catch (error) {
      if (attempts > 1) {
        await new Promise(resolve => setTimeout(resolve, backendConfig.retryDelay))
        return this.requestWithRetry(requestFn, attempts - 1)
      }
      throw error
    }
  }

  async getProducts(filters?: ProductFilters, pagination?: PaginationParams): Promise<PaginatedProductsResult> {
    return this.requestWithRetry(async () => {
      const params = new URLSearchParams()
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value))
          }
        })
      }
      
      if (pagination) {
        Object.entries(pagination).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value))
          }
        })
      }

      const response = await this.api.get(endpoints.products.list, { params })
      return response.data
    })
  }

  async getProductById(id: string): Promise<Product> {
    return this.requestWithRetry(async () => {
      const response = await this.api.get(endpoints.products.byId(id))
      return response.data
    })
  }

  async getProductsByCategory(category: string, pagination?: PaginationParams): Promise<PaginatedProductsResult> {
    return this.requestWithRetry(async () => {
      const params = new URLSearchParams()
      
      if (pagination) {
        Object.entries(pagination).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, String(value))
          }
        })
      }

      const response = await this.api.get(endpoints.products.byCategory(category), { params })
      return response.data
    })
  }

  async getFeaturedProducts(limit?: number): Promise<Product[]> {
    return this.requestWithRetry(async () => {
      const params = limit ? { limit } : {}
      const response = await this.api.get(endpoints.products.featured, { params })
      return response.data
    })
  }

  async getTopRatedProducts(limit?: number): Promise<Product[]> {
    return this.requestWithRetry(async () => {
      const params = limit ? { limit } : {}
      const response = await this.api.get(endpoints.products.topRated, { params })
      return response.data
    })
  }


}

export const productsService = new ProductsService()
export default productsService