import axios from 'axios';
import crypto from 'crypto';
import { AppError } from '@/utils/AppError';
import { logger } from '@/utils/logger';
import { prisma } from '@/database/prisma';

interface MercadoPagoConfig {
  accessToken: string;
  publicKey: string;
  baseURL: string;
  webhookURL: string;
}

interface PixPaymentRequest {
  orderId: string;
  amount: number;
  description: string;
  payer: {
    email: string;
    firstName: string;
    lastName: string;
    identification: {
      type: string;
      number: string;
    };
  };
  expiresIn?: number;
}

interface PixPaymentResponse {
  id: string;
  qrCode: string;
  qrCodeBase64: string;
  ticketUrl: string;
  expiresAt: Date;
  status: string;
}

interface WebhookPayload {
  id: string;
  type: string;
  data: {
    id: string;
  };
  date_created: string;
  user_id: string;
  api_version: string;
  action: string;
}

export class PaymentService {
  private config: MercadoPagoConfig;

  constructor() {
    this.config = {
      accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || '',
      publicKey: process.env.MERCADO_PAGO_PUBLIC_KEY || '',
      baseURL: 'https://api.mercadopago.com',
      webhookURL: `${process.env.API_URL}/api/payments/webhook`,
    };

    if (!this.config.accessToken) {
      throw new Error('Mercado Pago access token não configurado');
    }
  }

  private generateExternalReference(orderId: string): string {
    const timestamp = Date.now().toString();
    const hash = crypto.createHash('sha256')
      .update(`${orderId}-${timestamp}-${process.env.PAYMENT_SECRET}`)
      .digest('hex');
    return `${orderId}-${hash.substring(0, 8)}`;
  }

  private validatePaymentData(data: any): void {
    const requiredFields = ['amount', 'description', 'payer'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      throw new AppError(`Campos obrigatórios ausentes: ${missingFields.join(', ')}`, 400);
    }

    if (data.amount <= 0) {
      throw new AppError('Valor do pagamento deve ser maior que zero', 400);
    }

    if (data.amount > 100000) { // Limite de R$ 100.000,00
      throw new AppError('Valor do pagamento excede o limite permitido', 400);
    }
  }

  async createPixPayment(paymentData: PixPaymentRequest): Promise<PixPaymentResponse> {
    try {
      this.validatePaymentData(paymentData);

      const externalReference = this.generateExternalReference(paymentData.orderId);
      const expiresIn = paymentData.expiresIn || 3600; // 1 hora padrão

      const payload = {
        transaction_amount: paymentData.amount,
        description: paymentData.description,
        payment_method_id: 'pix',
        payer: {
          email: paymentData.payer.email,
          first_name: paymentData.payer.firstName,
          last_name: paymentData.payer.lastName,
          identification: paymentData.payer.identification,
        },
        external_reference: externalReference,
        date_of_expiration: new Date(Date.now() + expiresIn * 1000).toISOString(),
        notification_url: this.config.webhookURL,
        additional_info: {
          items: [
            {
              id: paymentData.orderId,
              title: paymentData.description,
              quantity: 1,
              unit_price: paymentData.amount,
            },
          ],
        },
      };

      logger.info('Criando pagamento PIX', {
        orderId: paymentData.orderId,
        amount: paymentData.amount,
        externalReference,
      });

      const response = await axios.post(
        `${this.config.baseURL}/v1/payments`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json',
            'X-Idempotency-Key': externalReference,
          },
          timeout: 30000,
        }
      );

      const payment = response.data;

      if (!payment.point_of_interaction?.transaction_data?.qr_code) {
        throw new AppError('Erro ao gerar QR Code do PIX', 500);
      }

      // Registrar pagamento no banco de dados
      await prisma.payment.create({
        data: {
          orderId: paymentData.orderId,
          externalId: payment.id,
          externalReference,
          amount: paymentData.amount,
          method: 'PIX',
          status: 'PENDING',
          qrCode: payment.point_of_interaction.transaction_data.qr_code,
          qrCodeBase64: payment.point_of_interaction.transaction_data.qr_code_base64,
          ticketUrl: payment.point_of_interaction.transaction_data.ticket_url,
          expiresAt: new Date(Date.now() + expiresIn * 1000),
          metadata: JSON.stringify(payment),
        },
      });

      logger.info('Pagamento PIX criado com sucesso', {
        orderId: paymentData.orderId,
        paymentId: payment.id,
        externalReference,
      });

      return {
        id: payment.id,
        qrCode: payment.point_of_interaction.transaction_data.qr_code,
        qrCodeBase64: payment.point_of_interaction.transaction_data.qr_code_base64,
        ticketUrl: payment.point_of_interaction.transaction_data.ticket_url,
        expiresAt: new Date(Date.now() + expiresIn * 1000),
        status: payment.status,
      };

    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error('Erro na API do Mercado Pago', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });

        if (error.response?.status === 401) {
          throw new AppError('Credenciais do Mercado Pago inválidas', 500);
        } else if (error.response?.status === 400) {
          throw new AppError('Dados de pagamento inválidos', 400);
        } else if (error.response?.status === 429) {
          throw new AppError('Limite de requisições excedido', 429);
        }
      }

      logger.error('Erro ao criar pagamento PIX', error);
      throw new AppError('Erro ao processar pagamento', 500);
    }
  }

  async processWebhook(payload: WebhookPayload): Promise<void> {
    try {
      logger.info('Processando webhook do Mercado Pago', {
        paymentId: payload.data.id,
        type: payload.type,
        action: payload.action,
      });

      // Verificar se é uma notificação de pagamento
      if (payload.type !== 'payment' || payload.action !== 'payment.updated') {
        logger.info('Webhook não é de pagamento, ignorando', { type: payload.type, action: payload.action });
        return;
      }

      // Buscar detalhes do pagamento
      const paymentResponse = await axios.get(
        `${this.config.baseURL}/v1/payments/${payload.data.id}`,
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
          },
          timeout: 10000,
        }
      );

      const payment = paymentResponse.data;
      const externalReference = payment.external_reference;

      if (!externalReference) {
        logger.warn('Pagamento sem referência externa', { paymentId: payload.data.id });
        return;
      }

      // Extrair orderId da referência externa
      const orderId = externalReference.split('-')[0];

      // Atualizar status do pagamento
      const updatedPayment = await prisma.payment.update({
        where: { externalReference },
        data: {
          status: this.mapPaymentStatus(payment.status),
          paidAt: payment.status === 'approved' ? new Date() : null,
          metadata: JSON.stringify(payment),
        },
      });

      // Atualizar status do pedido
      if (payment.status === 'approved') {
        await this.updateOrderStatus(orderId, 'PAID', payment.id);
        logger.info('Pagamento aprovado, pedido atualizado', {
          orderId,
          paymentId: payload.data.id,
          amount: payment.transaction_amount,
        });
      } else if (payment.status === 'rejected') {
        await this.updateOrderStatus(orderId, 'PAYMENT_FAILED', payment.id);
        logger.warn('Pagamento rejeitado', {
          orderId,
          paymentId: payload.data.id,
          reason: payment.status_detail,
        });
      } else if (payment.status === 'cancelled') {
        await this.updateOrderStatus(orderId, 'CANCELLED', payment.id);
        logger.info('Pagamento cancelado', {
          orderId,
          paymentId: payload.data.id,
        });
      }

    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error('Erro ao buscar detalhes do pagamento', {
          paymentId: payload.data.id,
          status: error.response?.status,
          message: error.message,
        });
      } else {
        logger.error('Erro ao processar webhook', error);
      }
      throw error;
    }
  }

  private mapPaymentStatus(mpStatus: string): string {
    const statusMap: Record<string, string> = {
      'approved': 'COMPLETED',
      'rejected': 'FAILED',
      'in_process': 'PROCESSING',
      'pending': 'PENDING',
      'cancelled': 'CANCELLED',
      'refunded': 'REFUNDED',
      'charged_back': 'CHARGED_BACK',
    };

    return statusMap[mpStatus] || 'UNKNOWN';
  }

  private async updateOrderStatus(orderId: string, status: string, paymentId: string): Promise<void> {
    try {
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status,
          paymentStatus: status === 'PAID' ? 'COMPLETED' : 'FAILED',
          updatedAt: new Date(),
        },
      });

      // Publicar evento para fila
      await this.publishPaymentEvent({
        orderId,
        paymentId,
        status,
        timestamp: new Date(),
      });

    } catch (error) {
      logger.error('Erro ao atualizar status do pedido', {
        orderId,
        status,
        error,
      });
      throw error;
    }
  }

  private async publishPaymentEvent(event: any): Promise<void> {
    // Implementar publicação na fila do RabbitMQ
    // Será implementado na próxima etapa
    logger.info('Evento de pagamento publicado', event);
  }

  async getPaymentStatus(paymentId: string): Promise<any> {
    try {
      const payment = await prisma.payment.findUnique({
        where: { externalId: paymentId },
      });

      if (!payment) {
        throw new AppError('Pagamento não encontrado', 404);
      }

      return payment;
    } catch (error) {
      logger.error('Erro ao buscar status do pagamento', { paymentId, error });
      throw error;
    }
  }

  async refundPayment(paymentId: string, amount?: number): Promise<void> {
    try {
      const payment = await prisma.payment.findUnique({
        where: { externalId: paymentId },
      });

      if (!payment) {
        throw new AppError('Pagamento não encontrado', 404);
      }

      if (payment.status !== 'COMPLETED') {
        throw new AppError('Apenas pagamentos concluídos podem ser estornados', 400);
      }

      const refundAmount = amount || payment.amount;

      if (refundAmount > payment.amount) {
        throw new AppError('Valor do estorno excede o valor do pagamento', 400);
      }

      const response = await axios.post(
        `${this.config.baseURL}/v1/payments/${paymentId}/refunds`,
        { amount: refundAmount },
        {
          headers: {
            'Authorization': `Bearer ${this.config.accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      await prisma.payment.update({
        where: { externalId: paymentId },
        data: {
          status: 'REFUNDED',
          refundedAmount: refundAmount,
          refundedAt: new Date(),
        },
      });

      logger.info('Pagamento estornado com sucesso', {
        paymentId,
        refundAmount,
        refundId: response.data.id,
      });

    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error('Erro ao processar estorno', {
          paymentId,
          status: error.response?.status,
          message: error.message,
        });
      } else {
        logger.error('Erro ao processar estorno', { paymentId, error });
      }
      throw error;
    }
  }
}