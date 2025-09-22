import { Request, Response } from 'express';
import { OrderService } from '../services/orderService';
import { LeadService } from '../services/leadService';

const orderService = new OrderService();
const leadService = new LeadService();

/**
 * Criar novo pedido
 */
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const orderData = req.body;
    
    // Processar lead se houver informações de origem
    if (orderData.leadSource) {
      await leadService.processLeadSource(orderData.customerInfo, {
        source: orderData.leadSource,
        campaign: orderData.campaign,
        medium: orderData.medium,
        content: orderData.content,
        term: orderData.term,
        referrer: orderData.referrer,
        landingPage: orderData.landingPage,
        utmSource: orderData.utmSource,
        utmMedium: orderData.utmMedium,
        utmCampaign: orderData.utmCampaign,
        utmContent: orderData.utmContent,
        utmTerm: orderData.utmTerm
      });
    }

    // Criar pedido
    const order = await orderService.createOrder(orderData);

    // Registrar conversão se for um pedido com lead
    if (orderData.leadSource) {
      await leadService.registerLeadConversion({
        leadId: order.orderId,
        customerInfo: orderData.customerInfo,
        conversionEvent: 'ORDER_PLACED',
        orderId: order.orderId,
        conversionValue: order.pricing.total
      });
    }

    res.status(201).json({
      success: true,
      data: {
        order,
        isFirstOrder: order.isFirstOrder,
        message: order.isFirstOrder ? 'Primeiro pedido realizado com sucesso!' : 'Pedido realizado com sucesso!'
      }
    });
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar pedido',
      message: error.message
    });
  }
};

/**
 * Verificar se é o primeiro pedido
 */
/**
 * Verificar se é o primeiro pedido (versão POST para customers)
 */
export const checkCustomerFirstOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, cpf } = req.body;

    if (!cpf) {
      res.status(400).json({
        success: false,
        error: 'CPF é obrigatório'
      });
      return;
    }

    const result = await orderService.checkFirstOrder({ cpf });

    res.json({
      success: true,
      data: {
        isFirstOrder: result.isFirstOrder,
        customerInfo: result.customerInfo
      }
    });
  } catch (error) {
    console.error('Erro ao verificar primeiro pedido:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao verificar primeiro pedido',
      message: error.message
    });
  }
};

/**
 * Verificar se é o primeiro pedido
 */
export const checkFirstOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cpf, email, userId } = req.query;

    if (!cpf && !email && !userId) {
      res.status(400).json({
        success: false,
        error: 'Forneça pelo menos um critério: cpf, email ou userId'
      });
      return;
    }

    const result = await orderService.checkFirstOrder({ cpf, email, userId });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Erro ao verificar primeiro pedido:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao verificar primeiro pedido',
      message: error.message
    });
  }
};

/**
 * Obter histórico de pedidos de um cliente
 */
export const getCustomerHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cpf } = req.params;
    
    if (!cpf) {
      res.status(400).json({
        success: false,
        error: 'CPF é obrigatório'
      });
      return;
    }

    const orders = await orderService.getCustomerOrderHistory(cpf);

    res.json({
      success: true,
      data: {
        orders,
        total: orders.length
      }
    });
  } catch (error) {
    console.error('Erro ao obter histórico:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter histórico',
      message: error.message
    });
  }
};

/**
 * Obter pedido por ID
 */
export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
      res.status(400).json({
        success: false,
        error: 'ID do pedido é obrigatório'
      });
      return;
    }

    const order = await orderService.getOrderById(orderId);

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Pedido não encontrado'
      });
      return;
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Erro ao obter pedido:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter pedido',
      message: error.message
    });
  }
};

/**
 * Listar pedidos com filtros
 */
export const getOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      userId,
      status,
      cpf,
      dateFrom,
      dateTo,
      isFirstOrder,
      limit,
      offset
    } = req.query;

    const filters: any = {};
    
    if (userId) filters.userId = userId;
    if (status) filters.status = status;
    if (cpf) filters.cpf = cpf;
    if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
    if (dateTo) filters.dateTo = new Date(dateTo as string);
    if (isFirstOrder !== undefined) filters.isFirstOrder = isFirstOrder === 'true';
    if (limit) filters.limit = parseInt(limit as string);
    if (offset) filters.offset = parseInt(offset as string);

    const result = await orderService.getOrders(filters);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao listar pedidos',
      message: error.message
    });
  }
};

/**
 * Atualizar status do pedido
 */
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!orderId || !status) {
      res.status(400).json({
        success: false,
        error: 'ID do pedido e status são obrigatórios'
      });
      return;
    }

    const order = await orderService.updateOrderStatus(orderId, status);

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Pedido não encontrado'
      });
      return;
    }

    res.json({
      success: true,
      data: order,
      message: 'Status do pedido atualizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar status',
      message: error.message
    });
  }
};

/**
 * Atualizar status do pagamento
 */
export const updatePaymentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { status, transactionId } = req.body;

    if (!orderId || !status) {
      res.status(400).json({
        success: false,
        error: 'ID do pedido e status do pagamento são obrigatórios'
      });
      return;
    }

    const order = await orderService.updatePaymentStatus(orderId, status, transactionId);

    if (!order) {
      res.status(404).json({
        success: false,
        error: 'Pedido não encontrado'
      });
      return;
    }

    res.json({
      success: true,
      data: order,
      message: 'Status do pagamento atualizado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar status do pagamento:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar status do pagamento',
      message: error.message
    });
  }
};

/**
 * Obter estatísticas de pedidos
 */
export const getOrderStatistics = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await orderService.getOrderStatistics();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter estatísticas',
      message: error.message
    });
  }
};