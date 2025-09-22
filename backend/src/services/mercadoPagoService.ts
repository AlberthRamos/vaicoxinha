import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { getMercadoPagoConfig } from '../config/mercadoPago';
import { SecurityService } from './securityService';
import { QRCodeService } from './qrCodeService';
import { SecurePaymentDataService } from './securePaymentDataService';
import { PaymentData, IPaymentData } from '../models/Payment';
import { IOrder } from '../models/Order';
import { ICustomer } from '../models/Customer';

interface MercadoPagoPaymentRequest {
  transaction_amount: number;
  description: string;
  payment_method_id: string;
  payer: {
    email: string;
    identification: {
      type: string;
      number: string;
    };
    first_name?: string;
    last_name?: string;
  };
  installments?: number;
  token?: string;
  notification_url?: string;
  external_reference?: string;
}

interface MercadoPagoPixRequest {
  transaction_amount: number;
  description: string;
  payment_method_id: 'pix';
  payer: {
    email: string;
    first_name?: string;
    last_name?: string;
    identification: {
      type: string;
      number: string;
    };
  };
  notification_url?: string;
  external_reference?: string;
}

interface MercadoPagoResponse {
  id: string;
  status: string;
  status_detail: string;
  transaction_amount: number;
  payment_method_id: string;
  payment_type_id: string;
  date_created: string;
  date_approved?: string;
  external_reference?: string;
  
  // Para PIX
  point_of_interaction?: {
    transaction_data: {
      qr_code: string;
      qr_code_base64: string;
      ticket_url: string;
    };
  };
  
  // Para cartão
  card?: {
    last_four_digits: string;
    brand: string;
    cardholder: {
      name: string;
    };
  };
}

export class MercadoPagoService {
  private config: MercadoPagoConfig;
  private securityService: SecurityService;
  private qrCodeService: QRCodeService;
  private securePaymentDataService: SecurePaymentDataService;
  private payment: Payment;
  private preference: Preference;

  constructor() {
    const mpConfig = getMercadoPagoConfig();
    this.config = new MercadoPagoConfig({
      accessToken: mpConfig.accessToken,
      options: {
        timeout: 30000,
        idempotencyKey: true,
      },
    });
    this.securityService = new SecurityService();
    this.qrCodeService = new QRCodeService();
    this.securePaymentDataService = new SecurePaymentDataService();
    this.payment = new Payment(this.config);
    this.preference = new Preference(this.config);
  }

  /**
   * Processa pagamento com cartão de crédito/débito
   */
  async processCardPayment(
    order: IOrder,
    customer: ICustomer,
    cardData: {
      token: string;
      paymentMethodId: string;
      installments?: number;
    },
    ipAddress: string,
    userAgent: string
  ): Promise<IPaymentData> {
    try {
      const paymentId = `CARD_${uuidv4()}`;
      
      // Cria requisição de pagamento
      const paymentRequest: MercadoPagoPaymentRequest = {
        transaction_amount: order.pricing.total,
        description: `Pedido #${order.orderNumber}`,
        payment_method_id: cardData.paymentMethodId,
        token: cardData.token,
        installments: cardData.installments || 1,
        payer: {
          email: customer.email,
          first_name: customer.firstName,
          last_name: customer.lastName,
          identification: {
            type: 'CPF',
            number: customer.cpf
          }
        },
        notification_url: this.config.notificationUrl,
        external_reference: paymentId
      };

      // Envia pagamento para Mercado Pago
      const response = await this.client.post('/payments', paymentRequest);
      const mercadoPagoResponse: MercadoPagoResponse = response.data;

      // Cria registro de pagamento com segurança
      const paymentData = new PaymentData({
        paymentId,
        orderId: order._id.toString(),
        customerId: customer._id.toString(),
        customerInfo: {
          firstName: customer.firstName,
          lastName: customer.lastName,
          cpf: SecurityService.maskSensitiveData(customer.cpf, 'cpf'),
          email: SecurityService.maskSensitiveData(customer.email, 'email'),
          phone: SecurityService.maskSensitiveData(customer.phone, 'phone')
        },
        paymentMethod: cardData.paymentMethodId.includes('debit') ? 'DEBIT_CARD' : 'CREDIT_CARD',
        amount: order.pricing.total,
        currency: 'BRL',
        cardInfo: {
          last4Digits: mercadoPagoResponse.card?.last_four_digits || '',
          brand: mercadoPagoResponse.card?.brand || '',
          installments: cardData.installments || 1,
          mercadoPagoPaymentId: mercadoPagoResponse.id.toString(),
          mercadoPagoStatus: mercadoPagoResponse.status
        },
        status: this.mapMercadoPagoStatus(mercadoPagoResponse.status),
        mercadoPagoPaymentId: mercadoPagoResponse.id.toString(),
        mercadoPagoStatus: mercadoPagoResponse.status,
        mercadoPagoTransactionId: mercadoPagoResponse.id.toString(),
        ipAddress,
        userAgent,
        fingerprint: SecurityService.generateFingerprint(userAgent, ipAddress),
        riskAssessment: SecurityService.assessRisk({
          amount: order.pricing.total,
          paymentMethod: 'CREDIT_CARD',
          recentTransactions: 0 // TODO: Implementar contador de transações recentes
        }),
        originData: SecurityService.generateOriginData(
          mercadoPagoResponse.id.toString(),
          'mercado_pago'
        )
      });

      await paymentData.save();

      // Armazenar dados sensíveis de forma segura no MongoDB separado
      if (order.deliveryAddress) {
        await this.securePaymentDataService.saveSecurePaymentData({
          customerId: customer._id.toString(),
          orderId: order._id.toString(),
          paymentMethod: cardData.paymentMethodId.includes('debit') ? 'DEBIT_CARD' : 'CREDIT_CARD',
          cardData: {
            token: cardData.token,
            last4Digits: mercadoPagoResponse.card?.last_four_digits || '',
            brand: mercadoPagoResponse.card?.brand || '',
            expirationMonth: '', // Não disponível na resposta do Mercado Pago
            expirationYear: '', // Não disponível na resposta do Mercado Pago
            holderName: mercadoPagoResponse.card?.cardholder?.name || ''
          },
          customerInfo: {
            firstName: customer.firstName,
            lastName: customer.lastName,
            email: customer.email,
            cpf: customer.cpf,
            phone: customer.phone
          },
          billingAddress: {
            street: order.deliveryAddress.street,
            number: order.deliveryAddress.number,
            neighborhood: order.deliveryAddress.neighborhood,
            city: order.deliveryAddress.city,
            state: order.deliveryAddress.state,
            zipCode: order.deliveryAddress.zipCode,
            complement: order.deliveryAddress.complement
          },
          securityMetadata: {
            ipAddress,
            userAgent,
            sessionId: SecurityService.generateSessionId(),
            deviceId: SecurityService.generateDeviceId(userAgent)
          },
          complianceData: {
            consentGiven: true,
            purpose: 'payment_processing',
            legalBasis: 'contract_performance'
          }
        });
      }

      return paymentData;

    } catch (error) {
      console.error('Erro ao processar pagamento com cartão:', error);
      throw new Error('Falha ao processar pagamento com cartão');
    }
  }

  /**
   * Processa pagamento com PIX
   */
  async processPixPayment(
    order: IOrder,
    customer: ICustomer,
    ipAddress: string,
    userAgent: string
  ): Promise<IPaymentData> {
    try {
      const paymentId = `PIX_${uuidv4()}`;
      
      // Cria requisição de pagamento PIX
      const pixRequest: MercadoPagoPixRequest = {
        transaction_amount: order.pricing.total,
        description: `Pedido #${order.orderNumber} - PIX`,
        payment_method_id: 'pix',
        payer: {
          email: customer.email,
          first_name: customer.firstName,
          last_name: customer.lastName,
          identification: {
            type: 'CPF',
            number: customer.cpf
          }
        },
        notification_url: this.config.notificationUrl,
        external_reference: paymentId
      };

      // Envia pagamento PIX para Mercado Pago
      const response = await this.client.post('/payments', pixRequest);
      const mercadoPagoResponse: MercadoPagoResponse = response.data;

      // Gerar QR Code se não foi fornecido
      let qrCodeBase64 = mercadoPagoResponse.point_of_interaction?.transaction_data?.qr_code_base64 || '';
      if (!qrCodeBase64 && mercadoPagoResponse.point_of_interaction?.transaction_data?.qr_code) {
        qrCodeBase64 = await this.qrCodeService.generateQRCode(
          mercadoPagoResponse.point_of_interaction.transaction_data.qr_code
        );
      }

      // Cria registro de pagamento PIX
      const paymentData = new PaymentData({
        paymentId,
        orderId: order._id.toString(),
        customerId: customer._id.toString(),
        customerInfo: {
          firstName: customer.firstName,
          lastName: customer.lastName,
          cpf: SecurityService.maskSensitiveData(customer.cpf, 'cpf'),
          email: SecurityService.maskSensitiveData(customer.email, 'email'),
          phone: SecurityService.maskSensitiveData(customer.phone, 'phone')
        },
        paymentMethod: 'PIX',
        amount: order.pricing.total,
        currency: 'BRL',
        pixInfo: {
          qrCode: mercadoPagoResponse.point_of_interaction?.transaction_data.qr_code || '',
          qrCodeBase64: qrCodeBase64,
          copiaCola: mercadoPagoResponse.point_of_interaction?.transaction_data.qr_code || '',
          expirationDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
          mercadoPagoPaymentId: mercadoPagoResponse.id.toString()
        },
        status: this.mapMercadoPagoStatus(mercadoPagoResponse.status),
        mercadoPagoPaymentId: mercadoPagoResponse.id.toString(),
        mercadoPagoStatus: mercadoPagoResponse.status,
        mercadoPagoTransactionId: mercadoPagoResponse.id.toString(),
        ipAddress,
        userAgent,
        fingerprint: SecurityService.generateFingerprint(userAgent, ipAddress),
        riskAssessment: SecurityService.assessRisk({
          amount: order.pricing.total,
          paymentMethod: 'PIX',
          recentTransactions: 0
        }),
        originData: SecurityService.generateOriginData(
          mercadoPagoResponse.id.toString(),
          'mercado_pago'
        )
      });

      await paymentData.save();
      return paymentData;

    } catch (error) {
      console.error('Erro ao processar pagamento PIX:', error);
      throw new Error('Falha ao processar pagamento PIX');
    }
  }

  /**
   * Consulta status do pagamento
   */
  async getPaymentStatus(paymentId: string): Promise<string> {
    try {
      const response = await this.client.get(`/payments/${paymentId}`);
      return response.data.status;
    } catch (error) {
      console.error('Erro ao consultar status do pagamento:', error);
      throw new Error('Falha ao consultar status do pagamento');
    }
  }

  /**
   * Processa webhook de notificação
   */
  async processWebhook(notificationData: any): Promise<void> {
    try {
      const paymentId = notificationData.data?.id;
      if (!paymentId) {
        throw new Error('ID do pagamento não fornecido');
      }

      // Consulta status atualizado
      const status = await this.getPaymentStatus(paymentId);
      
      // Atualiza registro local
      const paymentData = await PaymentData.findOne({ mercadoPagoPaymentId: paymentId.toString() });
      if (paymentData) {
        paymentData.status = this.mapMercadoPagoStatus(status);
        paymentData.mercadoPagoStatus = status;
        await paymentData.save();
      }

    } catch (error) {
      console.error('Erro ao processar webhook:', error);
      throw error;
    }
  }

  /**
   * Mapeia status do Mercado Pago para status interno
   */
  private mapMercadoPagoStatus(mercadoPagoStatus: string): 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'REFUNDED' {
    const statusMap: { [key: string]: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'REFUNDED' } = {
      'pending': 'PENDING',
      'approved': 'APPROVED',
      'authorized': 'APPROVED',
      'in_process': 'PENDING',
      'in_mediation': 'PENDING',
      'rejected': 'REJECTED',
      'cancelled': 'CANCELLED',
      'refunded': 'REFUNDED',
      'charged_back': 'REFUNDED'
    };

    return statusMap[mercadoPagoStatus] || 'PENDING';
  }

  /**
   * Valida se o cartão pode ser processado
   */
  async validateCard(cardToken: string): Promise<boolean> {
    try {
      const response = await this.client.get(`/card_tokens/${cardToken}`);
      return response.data.status === 'active';
    } catch (error) {
      console.error('Erro ao validar cartão:', error);
      return false;
    }
  }

  /**
   * Obtém métodos de pagamento disponíveis
   */
  async getPaymentMethods(): Promise<any[]> {
    try {
      const response = await this.client.get('/payment_methods');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter métodos de pagamento:', error);
      throw new Error('Falha ao obter métodos de pagamento');
    }
  }
}