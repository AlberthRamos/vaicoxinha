import axios, { AxiosInstance } from 'axios'
import { backendConfig, endpoints } from '@/config/backend'

export interface PaymentData {
  orderId: string
  amount: number
  paymentMethod: PaymentMethod
  customerInfo: CustomerInfo
  installments?: number
  cardData?: CardData
  pixData?: PixData
}

export interface CustomerInfo {
  email: string
  firstName: string
  lastName: string
  phone: string
  cpf: string
  address?: Address
}

export interface Address {
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
}

export interface CardData {
  cardNumber: string
  cardholderName: string
  expiryMonth: string
  expiryYear: string
  cvv: string
  identificationType: 'CPF'
  identificationNumber: string
}

export interface PixData {
  expiresIn?: number // Tempo de expiração em segundos (padrão: 3600)
}

export interface PaymentResult {
  id: string
  status: PaymentStatus
  paymentMethod: PaymentMethod
  amount: number
  transactionId?: string
  qrCode?: string
  qrCodeBase64?: string
  ticketUrl?: string
  installments?: number
  processingFee: number
  netAmount: number
  createdAt: Date
  updatedAt: Date
}

export interface PaymentStatusUpdate {
  id: string
  status: PaymentStatus
  transactionId?: string
  processedAt: Date
}

export interface MercadoPagoPreference {
  items: Array<{
    id: string
    title: string
    description?: string
    picture_url?: string
    category_id: string
    quantity: number
    currency_id: 'BRL'
    unit_price: number
  }>
  payer: {
    name: string
    email: string
    phone: {
      area_code: string
      number: string
    }
    identification: {
      type: 'CPF' | 'CNPJ'
      number: string
    }
    address: {
      zip_code: string
      street_name: string
      street_number: string
      neighborhood: string
      city: string
      federal_unit: string
    }
  }
  payment_methods: {
    excluded_payment_types?: Array<{ id: string }>
    installments?: number
    default_installments?: number
  }
  back_urls: {
    success: string
    failure: string
    pending: string
  }
  auto_return?: 'approved'
  notification_url?: string
  statement_descriptor: string
  external_reference?: string
  expires?: boolean
  expiration_date_from?: string
  expiration_date_to?: string
}

export interface MercadoPagoResponse {
  id: string
  init_point: string
  sandbox_init_point: string
  date_created: string
  operation_type: string
  items: Array<{
    id: string
    title: string
    description?: string
    picture_url?: string
    category_id: string
    quantity: number
    currency_id: string
    unit_price: number
  }>
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  PIX = 'pix',
  BOLETO = 'boleto'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
  CHARGEBACK = 'chargeback'
}

export interface MercadoPagoConfig {
  publicKey: string
  accessToken: string
  sandbox: boolean
}

class PaymentService {
  private api: AxiosInstance
  private mercadoPagoPublicKey: string | null = null
  private mercadoPagoInstance: any = null

  constructor() {
    this.api = axios.create({
      baseURL: backendConfig.baseURL,
      timeout: backendConfig.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
    this.initializeMercadoPago()
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

  private async initializeMercadoPago() {
    try {
      // Carrega a configuração do Mercado Pago do backend
      const response = await this.api.get(endpoints.mercadopago.config)
      const config: MercadoPagoConfig = response.data
      
      this.mercadoPagoPublicKey = config.publicKey
      
      // Carrega o SDK do Mercado Pago
      if (typeof window !== 'undefined') {
        await this.loadMercadoPagoSDK()
      }
    } catch (error) {
      console.error('Erro ao inicializar Mercado Pago:', error)
    }
  }

  private async loadMercadoPagoSDK(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (document.getElementById('mercadopago-sdk')) {
        resolve()
        return
      }

      const script = document.createElement('script')
      script.id = 'mercadopago-sdk'
      script.src = 'https://sdk.mercadopago.com/js/v2'
      script.async = true
      script.onload = () => {
        if (window.MercadoPago && this.mercadoPagoPublicKey) {
          this.mercadoPagoInstance = new window.MercadoPago(this.mercadoPagoPublicKey, {
            locale: 'pt-BR'
          })
        }
        resolve()
      }
      script.onerror = () => reject(new Error('Erro ao carregar SDK do Mercado Pago'))
      document.head.appendChild(script)
    })
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

  // Métodos existentes mantidos para compatibilidade
  async createPaymentPreference(preference: MercadoPagoPreference): Promise<MercadoPagoResponse> {
    return this.requestWithRetry(async () => {
      const response = await this.api.post(endpoints.mercadopago.createPreference, preference)
      return response.data
    })
  }

  async processPayment(paymentData: PaymentData): Promise<PaymentResult> {
    return this.requestWithRetry(async () => {
      const response = await this.api.post(endpoints.mercadopago.processPayment, paymentData)
      return response.data
    })
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentResult> {
    return this.requestWithRetry(async () => {
      const response = await this.api.get(endpoints.mercadopago.paymentStatus(paymentId))
      return response.data
    })
  }

  async processNotification(notificationData: any): Promise<any> {
    return this.requestWithRetry(async () => {
      const response = await this.api.post(endpoints.mercadopago.notification, notificationData)
      return response.data
    })
  }

  async getPaymentInfo(paymentId: string): Promise<PaymentResult> {
    return this.requestWithRetry(async () => {
      const response = await this.api.get(endpoints.mercadopago.paymentInfo(paymentId))
      return response.data
    })
  }

  async cancelPayment(paymentId: string, reason?: string): Promise<PaymentResult> {
    return this.requestWithRetry(async () => {
      const response = await this.api.post(endpoints.mercadopago.cancel(paymentId), { reason })
      return response.data
    })
  }

  async refundPayment(paymentId: string, amount?: number): Promise<PaymentResult> {
    return this.requestWithRetry(async () => {
      const response = await this.api.post(endpoints.mercadopago.refund(paymentId), { amount })
      return response.data
    })
  }

  // Métodos auxiliares para validação de dados
  validateCPF(cpf: string): boolean {
    cpf = cpf.replace(/[^\d]/g, '')
    
    if (cpf.length !== 11) return false
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) return false
    
    // Calcula o primeiro dígito verificador
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i)
    }
    let remainder = sum % 11
    let digit1 = remainder < 2 ? 0 : 11 - remainder
    
    // Calcula o segundo dígito verificador
    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i)
    }
    remainder = sum % 11
    let digit2 = remainder < 2 ? 0 : 11 - remainder
    
    return parseInt(cpf.charAt(9)) === digit1 && parseInt(cpf.charAt(10)) === digit2
  }

  validatePhone(phone: string): boolean {
    const cleanPhone = phone.replace(/[^\d]/g, '')
    return cleanPhone.length >= 10 && cleanPhone.length <= 11
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  validateCardNumber(cardNumber: string): boolean {
    const cleanCardNumber = cardNumber.replace(/[^\d]/g, '')
    return cleanCardNumber.length >= 13 && cleanCardNumber.length <= 19
  }

  validateExpiryDate(month: string, year: string): boolean {
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear() % 100
    const currentMonth = currentDate.getMonth() + 1
    
    const expMonth = parseInt(month)
    const expYear = parseInt(year)
    
    if (expMonth < 1 || expMonth > 12) return false
    if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) return false
    
    return true
  }

  validateCVV(cvv: string): boolean {
    const cleanCVV = cvv.replace(/[^\d]/g, '')
    return cleanCVV.length >= 3 && cleanCVV.length <= 4
  }

  // Getters
  get isMercadoPagoLoaded(): boolean {
    return this.mercadoPagoInstance !== null
  }

  get mercadoPagoInstanceRef(): any {
    return this.mercadoPagoInstance
  }
}

export const paymentService = new PaymentService()
export default paymentService