import axios, { AxiosInstance } from 'axios'
import { backendConfig, endpoints } from '@/config/backend'
import { Product } from './productsService'

export interface OrderItem {
  productId: string
  product: Product
  quantity: number
  price: number
  subtotal: number
  notes?: string
}

export interface Order {
  id: string
  userId: string
  items: OrderItem[]
  totalAmount: number
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod
  customerInfo: CustomerInfo
  deliveryInfo?: DeliveryInfo
  notes?: string
  createdAt: Date
  updatedAt: Date
  estimatedDeliveryTime?: Date
  trackingCode?: string
}

export interface CustomerInfo {
  name: string
  email: string
  phone: string
  cpf?: string
}

export interface DeliveryInfo {
  address: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
  deliveryFee: number
}

export interface CreateOrderData {
  items: Omit<OrderItem, 'subtotal' | 'product'>[]
  customerInfo: CustomerInfo
  deliveryInfo?: DeliveryInfo
  paymentMethod: PaymentMethod
  notes?: string
  estimatedDeliveryTime?: Date
}

export interface UpdateOrderData {
  status?: OrderStatus
  paymentStatus?: PaymentStatus
  notes?: string
  estimatedDeliveryTime?: Date
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  REFUNDED = 'refunded'
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  PIX = 'pix',
  CASH = 'cash'
}

export interface PaginatedOrdersResult {
  orders: Order[]
  total: number
  page: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface OrderFilters {
  status?: OrderStatus
  paymentStatus?: PaymentStatus
  userId?: string
  dateFrom?: Date
  dateTo?: Date
  minAmount?: number
  maxAmount?: number
}

class OrdersService {
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

  async createOrder(orderData: CreateOrderData): Promise<Order> {
    return this.requestWithRetry(async () => {
      const response = await this.api.post(endpoints.orders.create, orderData)
      return response.data
    })
  }

  async getOrders(filters?: OrderFilters, pagination?: PaginationParams): Promise<PaginatedOrdersResult> {
    return this.requestWithRetry(async () => {
      const params = new URLSearchParams()
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (value instanceof Date) {
              params.append(key, value.toISOString())
            } else {
              params.append(key, String(value))
            }
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

      const response = await this.api.get(endpoints.orders.list, { params })
      return response.data
    })
  }

  async getOrderById(id: string): Promise<Order> {
    return this.requestWithRetry(async () => {
      const response = await this.api.get(endpoints.orders.byId(id))
      return response.data
    })
  }

  async updateOrder(id: string, updateData: UpdateOrderData): Promise<Order> {
    return this.requestWithRetry(async () => {
      const response = await this.api.patch(endpoints.orders.update(id), updateData)
      return response.data
    })
  }

  async cancelOrder(id: string, reason?: string): Promise<Order> {
    return this.requestWithRetry(async () => {
      const response = await this.api.post(endpoints.orders.cancel(id), { reason })
      return response.data
    })
  }

  async getOrderStatus(id: string): Promise<{ status: OrderStatus; estimatedDeliveryTime?: Date }> {
    return this.requestWithRetry(async () => {
      const response = await this.api.get(endpoints.orders.status(id))
      return response.data
    })
  }

  async getMyOrders(filters?: OrderFilters, pagination?: PaginationParams): Promise<PaginatedOrdersResult> {
    return this.requestWithRetry(async () => {
      const params = new URLSearchParams()
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (value instanceof Date) {
              params.append(key, value.toISOString())
            } else {
              params.append(key, String(value))
            }
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

      const response = await this.api.get(endpoints.orders.myOrders, { params })
      return response.data
    })
  }
}

export const ordersService = new OrdersService()
export default ordersService