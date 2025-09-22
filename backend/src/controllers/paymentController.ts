import { Request, Response } from 'express';
import { MercadoPagoService } from '../services/mercadoPagoService';
import { OrderService } from '../services/orderService';
import { CustomerService } from '../services/customerService';
import { SecurityService } from '../services/securityService';
import { PaymentData } from '../models/Payment';
import { Order } from '../models/Order';
import { Customer } from '../models/Customer';

export class PaymentController {
  private mercadoPagoService: MercadoPagoService;
  private orderService: OrderService;
  private customerService: CustomerService;

  constructor() {
    this.mercadoPagoService = new MercadoPagoService();
    this.orderService = new OrderService();
    this.customerService = new CustomerService();
  }

  /**
   * Processa pagamento com cartão de crédito/débito
   */
  async processCardPayment(req: Request, res: Response): Promise<void> {
    try {
      const { orderId, cardToken, paymentMethodId, installments = 1 } = req.body;
      
      // Valida dados de entrada
      if (!orderId || !cardToken || !paymentMethodId) {
        res.status(400).json({ 
          success: false, 
          message: 'Dados de pagamento incompletos' 
        });
        return;
      }

      // Obtém pedido
      const order = await Order.findById(orderId);
      if (!order) {
        res.status(404).json({ 
          success: false, 
          message: 'Pedido não encontrado' 
        });
        return;
      }

      // Obtém cliente
      const customer = await Customer.findById(order.customerId);
      if (!customer) {
        res.status(404).json({ 
          success: false, 
          message: 'Cliente não encontrado' 
        });
        return;
      }

      // Valida CPF do cliente
      if (!SecurityService.validateCPF(customer.cpf)) {
        res.status(400).json({ 
          success: false, 
          message: 'CPF inválido' 
        });
        return;
      }

      // Obtém IP e User Agent
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';

      // Processa pagamento
      const paymentData = await this.mercadoPagoService.processCardPayment(
        order,
        customer,
        {
          token: cardToken,
          paymentMethodId,
          installments
        },
        ipAddress,
        userAgent
      );

      // Atualiza status do pedido
      await this.orderService.updateOrderStatus(orderId, 'payment_pending');

      res.json({
        success: true,
        paymentId: paymentData.paymentId,
        status: paymentData.status,
        message: 'Pagamento processado com sucesso',
        data: {
          paymentMethod: paymentData.paymentMethod,
          amount: paymentData.amount,
          cardInfo: paymentData.cardInfo,
          riskAssessment: paymentData.riskAssessment
        }
      });

    } catch (error) {
      console.error('Erro ao processar pagamento com cartão:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao processar pagamento',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Processa pagamento com PIX
   */
  async processPixPayment(req: Request, res: Response): Promise<void> {
    try {
      const { orderId } = req.body;
      
      // Valida dados de entrada
      if (!orderId) {
        res.status(400).json({ 
          success: false, 
          message: 'ID do pedido é obrigatório' 
        });
        return;
      }

      // Obtém pedido
      const order = await Order.findById(orderId);
      if (!order) {
        res.status(404).json({ 
          success: false, 
          message: 'Pedido não encontrado' 
        });
        return;
      }

      // Obtém cliente
      const customer = await Customer.findById(order.customerId);
      if (!customer) {
        res.status(404).json({ 
          success: false, 
          message: 'Cliente não encontrado' 
        });
        return;
      }

      // Valida CPF do cliente
      if (!SecurityService.validateCPF(customer.cpf)) {
        res.status(400).json({ 
          success: false, 
          message: 'CPF inválido' 
        });
        return;
      }

      // Obtém IP e User Agent
      const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';

      // Processa pagamento PIX
      const paymentData = await this.mercadoPagoService.processPixPayment(
        order,
        customer,
        ipAddress,
        userAgent
      );

      // Atualiza status do pedido
      await this.orderService.updateOrderStatus(orderId, 'payment_pending');

      res.json({
        success: true,
        paymentId: paymentData.paymentId,
        status: paymentData.status,
        message: 'PIX gerado com sucesso',
        data: {
          paymentMethod: 'PIX',
          amount: paymentData.amount,
          pixInfo: paymentData.pixInfo,
          riskAssessment: paymentData.riskAssessment
        }
      });

    } catch (error) {
      console.error('Erro ao processar pagamento PIX:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao processar pagamento PIX',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Consulta status do pagamento
   */
  async getPaymentStatus(req: Request, res: Response): Promise<void> {
    try {
      const { paymentId } = req.params;
      
      if (!paymentId) {
        res.status(400).json({ 
          success: false, 
          message: 'ID do pagamento é obrigatório' 
        });
        return;
      }

      // Busca pagamento no banco local
      const paymentData = await PaymentData.findOne({ paymentId }).select('-originData');
      if (!paymentData) {
        res.status(404).json({ 
          success: false, 
          message: 'Pagamento não encontrado' 
        });
        return;
      }

      // Atualiza status com Mercado Pago
      if (paymentData.mercadoPagoPaymentId) {
        try {
          const mercadoPagoStatus = await this.mercadoPagoService.getPaymentStatus(
            paymentData.mercadoPagoPaymentId
          );
          
          if (paymentData.mercadoPagoStatus !== mercadoPagoStatus) {
            paymentData.status = this.mercadoPagoService['mapMercadoPagoStatus'](mercadoPagoStatus);
            paymentData.mercadoPagoStatus = mercadoPagoStatus;
            await paymentData.save();
          }
        } catch (error) {
          console.error('Erro ao atualizar status com Mercado Pago:', error);
        }
      }

      res.json({
        success: true,
        payment: {
          paymentId: paymentData.paymentId,
          orderId: paymentData.orderId,
          status: paymentData.status,
          paymentMethod: paymentData.paymentMethod,
          amount: paymentData.amount,
          createdAt: paymentData.createdAt,
          pixInfo: paymentData.pixInfo,
          cardInfo: paymentData.cardInfo,
          mercadoPagoStatus: paymentData.mercadoPagoStatus
        }
      });

    } catch (error) {
      console.error('Erro ao consultar status do pagamento:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao consultar status do pagamento',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Processa webhook de notificação
   */
  async processWebhook(req: Request, res: Response): Promise<void> {
    try {
      const notificationData = req.body;
      
      console.log('Webhook recebido:', JSON.stringify(notificationData, null, 2));

      // Processa notificação
      await this.mercadoPagoService.processWebhook(notificationData);

      res.status(200).json({ 
        success: true, 
        message: 'Webhook processado com sucesso' 
      });

    } catch (error) {
      console.error('Erro ao processar webhook:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao processar webhook' 
      });
    }
  }

  /**
   * Obtém métodos de pagamento disponíveis
   */
  async getPaymentMethods(req: Request, res: Response): Promise<void> {
    try {
      const paymentMethods = await this.mercadoPagoService.getPaymentMethods();
      
      // Filtra métodos relevantes para o negócio
      const allowedMethods = paymentMethods.filter(method => {
        const allowedTypes = ['credit_card', 'debit_card', 'pix', 'ticket'];
        return allowedTypes.includes(method.payment_type_id);
      });

      res.json({
        success: true,
        paymentMethods: allowedMethods.map(method => ({
          id: method.id,
          name: method.name,
          type: method.payment_type_id,
          thumbnail: method.thumbnail,
          secure_thumbnail: method.secure_thumbnail
        }))
      });

    } catch (error) {
      console.error('Erro ao obter métodos de pagamento:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao obter métodos de pagamento',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Valida token de cartão
   */
  async validateCardToken(req: Request, res: Response): Promise<void> {
    try {
      const { cardToken } = req.body;
      
      if (!cardToken) {
        res.status(400).json({ 
          success: false, 
          message: 'Token do cartão é obrigatório' 
        });
        return;
      }

      const isValid = await this.mercadoPagoService.validateCard(cardToken);

      res.json({
        success: true,
        valid: isValid,
        message: isValid ? 'Cartão válido' : 'Cartão inválido'
      });

    } catch (error) {
      console.error('Erro ao validar cartão:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erro ao validar cartão',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}