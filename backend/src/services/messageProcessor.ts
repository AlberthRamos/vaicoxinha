import { RabbitMQService } from '@/services/rabbitmqService';
import { logger } from '@/utils/logger';
import { prisma } from '@/database/prisma';
import { AppError } from '@/utils/AppError';

export interface MessageHandler {
  handle(message: any): Promise<void>;
}

export class OrderMessageHandler implements MessageHandler {
  async handle(message: any): Promise<void> {
    try {
      const { type, data } = message;

      switch (type) {
        case 'order.created':
          await this.handleOrderCreated(data);
          break;
        case 'order.updated':
          await this.handleOrderUpdated(data);
          break;
        case 'order.cancelled':
          await this.handleOrderCancelled(data);
          break;
        default:
          logger.warn('Tipo de mensagem desconhecido', { type });
      }
    } catch (error) {
      logger.error('Erro ao processar mensagem de pedido', { message, error });
      throw error;
    }
  }

  private async handleOrderCreated(data: any): Promise<void> {
    logger.info('Processando pedido criado', { orderId: data.orderId });

    try {
      // Atualizar estoque
      await this.updateInventory(data.items);

      // Enviar notificação de confirmação
      await this.sendOrderConfirmation(data);

      // Registrar log de auditoria
      await this.createAuditLog({
        entityType: 'ORDER',
        entityId: data.orderId,
        action: 'CREATED',
        userId: data.userId,
        metadata: data,
      });

      logger.info('Pedido criado processado com sucesso', { orderId: data.orderId });
    } catch (error) {
      logger.error('Erro ao processar pedido criado', { orderId: data.orderId, error });
      throw error;
    }
  }

  private async handleOrderUpdated(data: any): Promise<void> {
    logger.info('Processando pedido atualizado', { orderId: data.orderId });

    try {
      // Verificar mudanças de status
      if (data.previousStatus !== data.newStatus) {
        await this.handleStatusChange(data);
      }

      // Registrar log de auditoria
      await this.createAuditLog({
        entityType: 'ORDER',
        entityId: data.orderId,
        action: 'UPDATED',
        userId: data.userId,
        metadata: data,
      });

      logger.info('Pedido atualizado processado com sucesso', { orderId: data.orderId });
    } catch (error) {
      logger.error('Erro ao processar pedido atualizado', { orderId: data.orderId, error });
      throw error;
    }
  }

  private async handleOrderCancelled(data: any): Promise<void> {
    logger.info('Processando pedido cancelado', { orderId: data.orderId });

    try {
      // Restaurar estoque
      await this.restoreInventory(data.items);

      // Processar reembolso se necessário
      if (data.paymentStatus === 'COMPLETED') {
        await this.processRefund(data.orderId);
      }

      // Enviar notificação de cancelamento
      await this.sendOrderCancellation(data);

      // Registrar log de auditoria
      await this.createAuditLog({
        entityType: 'ORDER',
        entityId: data.orderId,
        action: 'CANCELLED',
        userId: data.userId,
        metadata: data,
      });

      logger.info('Pedido cancelado processado com sucesso', { orderId: data.orderId });
    } catch (error) {
      logger.error('Erro ao processar pedido cancelado', { orderId: data.orderId, error });
      throw error;
    }
  }

  private async updateInventory(items: any[]): Promise<void> {
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }
  }

  private async restoreInventory(items: any[]): Promise<void> {
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            increment: item.quantity,
          },
        },
      });
    }
  }

  private async handleStatusChange(data: any): Promise<void> {
    // Enviar notificações baseadas no novo status
    switch (data.newStatus) {
      case 'PAID':
        await this.sendPaymentConfirmation(data);
        break;
      case 'SHIPPED':
        await this.sendShippingNotification(data);
        break;
      case 'DELIVERED':
        await this.sendDeliveryConfirmation(data);
        break;
      case 'CANCELLED':
        await this.sendOrderCancellation(data);
        break;
    }
  }

  private async sendOrderConfirmation(data: any): Promise<void> {
    // Publicar mensagem para notificação
    await this.publishNotification({
      type: 'ORDER_CONFIRMATION',
      userId: data.userId,
      orderId: data.orderId,
      email: data.userEmail,
      items: data.items,
      total: data.total,
    });
  }

  private async sendPaymentConfirmation(data: any): Promise<void> {
    await this.publishNotification({
      type: 'PAYMENT_CONFIRMATION',
      userId: data.userId,
      orderId: data.orderId,
      email: data.userEmail,
      amount: data.amount,
    });
  }

  private async sendShippingNotification(data: any): Promise<void> {
    await this.publishNotification({
      type: 'SHIPPING_NOTIFICATION',
      userId: data.userId,
      orderId: data.orderId,
      email: data.userEmail,
      trackingCode: data.trackingCode,
    });
  }

  private async sendDeliveryConfirmation(data: any): Promise<void> {
    await this.publishNotification({
      type: 'DELIVERY_CONFIRMATION',
      userId: data.userId,
      orderId: data.orderId,
      email: data.userEmail,
    });
  }

  private async sendOrderCancellation(data: any): Promise<void> {
    await this.publishNotification({
      type: 'ORDER_CANCELLATION',
      userId: data.userId,
      orderId: data.orderId,
      email: data.userEmail,
      reason: data.cancellationReason,
    });
  }

  private async processRefund(orderId: string): Promise<void> {
    // Implementar lógica de reembolso
    logger.info('Processando reembolso', { orderId });
  }

  private async createAuditLog(data: any): Promise<void> {
    await prisma.auditLog.create({
      data,
    });
  }

  private async publishNotification(data: any): Promise<void> {
    // Implementar publicação na fila de notificações
    logger.info('Publicando notificação', data);
  }
}

export class PaymentMessageHandler implements MessageHandler {
  async handle(message: any): Promise<void> {
    try {
      const { type, data } = message;

      switch (type) {
        case 'payment.completed':
          await this.handlePaymentCompleted(data);
          break;
        case 'payment.failed':
          await this.handlePaymentFailed(data);
          break;
        case 'payment.refunded':
          await this.handlePaymentRefunded(data);
          break;
        default:
          logger.warn('Tipo de mensagem de pagamento desconhecido', { type });
      }
    } catch (error) {
      logger.error('Erro ao processar mensagem de pagamento', { message, error });
      throw error;
    }
  }

  private async handlePaymentCompleted(data: any): Promise<void> {
    logger.info('Processando pagamento completado', { paymentId: data.paymentId, orderId: data.orderId });

    try {
      // Atualizar status do pedido
      await prisma.order.update({
        where: { id: data.orderId },
        data: {
          status: 'PAID',
          paymentStatus: 'COMPLETED',
          paidAt: new Date(),
        },
      });

      // Enviar notificação de pagamento confirmado
      await this.publishNotification({
        type: 'PAYMENT_CONFIRMED',
        userId: data.userId,
        orderId: data.orderId,
        paymentId: data.paymentId,
        amount: data.amount,
      });

      logger.info('Pagamento completado processado com sucesso', { paymentId: data.paymentId });
    } catch (error) {
      logger.error('Erro ao processar pagamento completado', { paymentId: data.paymentId, error });
      throw error;
    }
  }

  private async handlePaymentFailed(data: any): Promise<void> {
    logger.info('Processando pagamento falhado', { paymentId: data.paymentId, orderId: data.orderId });

    try {
      // Atualizar status do pedido
      await prisma.order.update({
        where: { id: data.orderId },
        data: {
          status: 'PAYMENT_FAILED',
          paymentStatus: 'FAILED',
        },
      });

      // Restaurar estoque
      await this.restoreInventory(data.orderId);

      // Enviar notificação de pagamento falhado
      await this.publishNotification({
        type: 'PAYMENT_FAILED',
        userId: data.userId,
        orderId: data.orderId,
        paymentId: data.paymentId,
        reason: data.failureReason,
      });

      logger.info('Pagamento falhado processado com sucesso', { paymentId: data.paymentId });
    } catch (error) {
      logger.error('Erro ao processar pagamento falhado', { paymentId: data.paymentId, error });
      throw error;
    }
  }

  private async handlePaymentRefunded(data: any): Promise<void> {
    logger.info('Processando reembolso', { paymentId: data.paymentId, orderId: data.orderId });

    try {
      // Atualizar status do pedido
      await prisma.order.update({
        where: { id: data.orderId },
        data: {
          status: 'REFUNDED',
          paymentStatus: 'REFUNDED',
        },
      });

      // Restaurar estoque
      await this.restoreInventory(data.orderId);

      // Enviar notificação de reembolso
      await this.publishNotification({
        type: 'PAYMENT_REFUNDED',
        userId: data.userId,
        orderId: data.orderId,
        paymentId: data.paymentId,
        refundAmount: data.refundAmount,
      });

      logger.info('Reembolso processado com sucesso', { paymentId: data.paymentId });
    } catch (error) {
      logger.error('Erro ao processar reembolso', { paymentId: data.paymentId, error });
      throw error;
    }
  }

  private async restoreInventory(orderId: string): Promise<void> {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (order) {
      for (const item of order.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        });
      }
    }
  }

  private async publishNotification(data: any): Promise<void> {
    logger.info('Publicando notificação de pagamento', data);
  }
}

export class NotificationMessageHandler implements MessageHandler {
  async handle(message: any): Promise<void> {
    try {
      const { type, data } = message;

      switch (type) {
        case 'email':
          await this.handleEmail(data);
          break;
        case 'sms':
          await this.handleSMS(data);
          break;
        case 'push':
          await this.handlePush(data);
          break;
        default:
          logger.warn('Tipo de notificação desconhecido', { type });
      }
    } catch (error) {
      logger.error('Erro ao processar mensagem de notificação', { message, error });
      throw error;
    }
  }

  private async handleEmail(data: any): Promise<void> {
    logger.info('Processando notificação por email', { to: data.to, type: data.type });

    try {
      // Implementar envio de email
      // Por enquanto, apenas registrar
      logger.info('Email enviado com sucesso', { to: data.to, type: data.type });
    } catch (error) {
      logger.error('Erro ao enviar email', { to: data.to, error });
      throw error;
    }
  }

  private async handleSMS(data: any): Promise<void> {
    logger.info('Processando notificação por SMS', { phone: data.phone, type: data.type });

    try {
      // Implementar envio de SMS
      logger.info('SMS enviado com sucesso', { phone: data.phone, type: data.type });
    } catch (error) {
      logger.error('Erro ao enviar SMS', { phone: data.phone, error });
      throw error;
    }
  }

  private async handlePush(data: any): Promise<void> {
    logger.info('Processando notificação push', { userId: data.userId, type: data.type });

    try {
      // Implementar envio de notificação push
      logger.info('Notificação push enviada com sucesso', { userId: data.userId, type: data.type });
    } catch (error) {
      logger.error('Erro ao enviar notificação push', { userId: data.userId, error });
      throw error;
    }
  }
}

export class MessageProcessor {
  private rabbitMQService: RabbitMQService;
  private handlers: Map<string, MessageHandler> = new Map();

  constructor(rabbitMQService: RabbitMQService) {
    this.rabbitMQService = rabbitMQService;
    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.handlers.set('orders.created', new OrderMessageHandler());
    this.handlers.set('orders.updated', new OrderMessageHandler());
    this.handlers.set('orders.cancelled', new OrderMessageHandler());
    this.handlers.set('payments.completed', new PaymentMessageHandler());
    this.handlers.set('payments.failed', new PaymentMessageHandler());
    this.handlers.set('payments.refunded', new PaymentMessageHandler());
    this.handlers.set('notifications.email', new NotificationMessageHandler());
    this.handlers.set('notifications.sms', new NotificationMessageHandler());
    this.handlers.set('notifications.push', new NotificationMessageHandler());
  }

  async startProcessing(): Promise<void> {
    const queues = [
      'orders.created',
      'orders.updated',
      'payments.processed',
      'notifications.email',
      'notifications.sms',
    ];

    for (const queue of queues) {
      await this.rabbitMQService.consumeMessage(queue, async (msg) => {
        const content = JSON.parse(msg.content.toString());
        const handler = this.handlers.get(content.type);

        if (handler) {
          await handler.handle(content);
        } else {
          logger.warn('Handler não encontrado', { type: content.type });
        }
      });
    }

    logger.info('Processamento de mensagens iniciado');
  }
}