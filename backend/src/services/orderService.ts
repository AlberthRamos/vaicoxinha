import { Order, IOrder } from '../models/Order';
import { Customer, ICustomer } from '../models/Customer';
import mongoose from 'mongoose';

interface OrderData {
  userId: string;
  customerInfo: {
    firstName: string;
    lastName: string;
    cpf: string;
    email: string;
    phone: string;
  };
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    notes?: string;
  }>;
  paymentInfo: {
    method: 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' | 'CASH' | 'DIGITAL_WALLET';
    amount: number;
  };
  deliveryInfo: {
    address: {
      street: string;
      number: string;
      complement?: string;
      neighborhood: string;
      city: string;
      state: string;
      zipCode: string;
    };
    deliveryFee: number;
    deliveryInstructions?: string;
  };
  pricing: {
    subtotal: number;
    deliveryFee: number;
    discount: number;
    tax: number;
    total: number;
  };
  leadSource?: string;
  notes?: string;
}

export class OrderService {
  /**
   * Criar um novo pedido com verificação de primeiro pedido
   */
  async createOrder(orderData: OrderData): Promise<IOrder> {
    // Verificar se estamos usando MongoDB em memória (não suporta transações)
    const isInMemoryDB = process.env.MONGODB_URI === 'mongodb://localhost:27017/vai-coxinha-memory';
    
    let session;
    if (!isInMemoryDB) {
      session = await mongoose.startSession();
      session.startTransaction();
    }

    try {
      // Verificar se é o primeiro pedido baseado no CPF
      const isFirstOrder = await Order.isFirstOrderByCPF(orderData.customerInfo.cpf);
      
      // Buscar ou criar cliente
      const customer = await Customer.findOrCreate({
        firstName: orderData.customerInfo.firstName,
        lastName: orderData.customerInfo.lastName,
        cpf: orderData.customerInfo.cpf,
        email: orderData.customerInfo.email,
        phone: orderData.customerInfo.phone,
        leadSource: orderData.leadSource
      });

      // Gerar ID único para o pedido
      const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Criar o pedido
      const order = new Order({
        orderId,
        userId: orderData.userId,
        customerInfo: orderData.customerInfo,
        items: orderData.items,
        paymentInfo: {
          ...orderData.paymentInfo,
          status: 'PENDING'
        },
        deliveryInfo: orderData.deliveryInfo,
        pricing: {
          ...orderData.pricing,
          // Aplicar desconto de frete se for primeiro pedido
          deliveryFee: isFirstOrder ? 0 : orderData.pricing.deliveryFee,
          total: isFirstOrder ? 
            orderData.pricing.total - orderData.pricing.deliveryFee : 
            orderData.pricing.total
        },
        isFirstOrder,
        leadSource: orderData.leadSource,
        notes: orderData.notes
      });

      await order.save(session ? { session } : {});

      // Atualizar estatísticas do cliente (sem transação para MongoDB em memória)
      customer.statistics.totalOrders += 1;
      customer.statistics.totalSpent += order.pricing.total;
      customer.statistics.averageOrderValue = customer.statistics.totalSpent / customer.statistics.totalOrders;
      
      if (!customer.statistics.firstOrderDate) {
        customer.statistics.firstOrderDate = new Date();
      }
      
      customer.statistics.lastOrderDate = new Date();
      
      await customer.save();

      // Adicionar endereço de entrega aos endereços do cliente se for novo
      if (isFirstOrder) {
        await customer.addAddress(orderData.deliveryInfo.address, true);
      }

      if (session) {
        await session.commitTransaction();
      }

      return order;
    } catch (error) {
      if (session) {
        await session.abortTransaction();
      }
      throw error;
    } finally {
      if (session) {
        session.endSession();
      }
    }
  }

  /**
   * Verificar se é o primeiro pedido por diferentes critérios
   */
  async checkFirstOrder(criteria: {
    cpf?: string;
    email?: string;
    userId?: string;
  }): Promise<{
    isFirstOrder: boolean;
    criteria: string;
    customerInfo?: any;
  }> {
    const results = [];

    if (criteria.cpf) {
      const isFirst = await Order.isFirstOrderByCPF(criteria.cpf);
      results.push({ type: 'cpf', value: criteria.cpf, isFirst });
    }

    if (criteria.email) {
      const isFirst = await Order.isFirstOrderByEmail(criteria.email);
      results.push({ type: 'email', value: criteria.email, isFirst });
    }

    if (criteria.userId) {
      const isFirst = await Order.isFirstOrderByUserId(criteria.userId);
      results.push({ type: 'userId', value: criteria.userId, isFirst });
    }

    // Se qualquer um dos critérios indicar que já existe pedido, não é primeiro pedido
    const isFirstOrder = !results.some(r => !r.isFirst);
    const primaryCriteria = results.find(r => !r.isFirst) || results[0];

    // Buscar informações do cliente se existir
    let customerInfo = null;
    if (criteria.cpf) {
      customerInfo = await Customer.findOne({ cpf: criteria.cpf });
    }

    return {
      isFirstOrder,
      criteria: primaryCriteria.type,
      customerInfo
    };
  }

  /**
   * Obter histórico de pedidos de um cliente
   */
  async getCustomerOrderHistory(cpf: string): Promise<IOrder[]> {
    return Order.getCustomerHistory(cpf);
  }

  /**
   * Obter estatísticas gerais de pedidos
   */
  async getOrderStatistics(): Promise<any> {
    return Order.getOrderStats();
  }

  /**
   * Obter pedido por ID
   */
  async getOrderById(orderId: string): Promise<IOrder | null> {
    return Order.findOne({ orderId });
  }

  /**
   * Atualizar status do pedido
   */
  async updateOrderStatus(orderId: string, status: string): Promise<IOrder | null> {
    return Order.findOneAndUpdate(
      { orderId },
      { 
        status,
        updatedAt: new Date()
      },
      { new: true }
    );
  }

  /**
   * Atualizar status do pagamento
   */
  async updatePaymentStatus(orderId: string, paymentStatus: string, transactionId?: string): Promise<IOrder | null> {
    const updateData: any = {
      'paymentInfo.status': paymentStatus,
      updatedAt: new Date()
    };

    if (transactionId) {
      updateData['paymentInfo.transactionId'] = transactionId;
    }

    if (paymentStatus === 'COMPLETED') {
      updateData['paymentInfo.paidAt'] = new Date();
    }

    return Order.findOneAndUpdate(
      { orderId },
      updateData,
      { new: true }
    );
  }

  /**
   * Obter pedidos com filtros
   */
  async getOrders(filters: {
    userId?: string;
    status?: string;
    cpf?: string;
    dateFrom?: Date;
    dateTo?: Date;
    isFirstOrder?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{
    orders: IOrder[];
    total: number;
  }> {
    const query: any = {};

    if (filters.userId) query.userId = filters.userId;
    if (filters.status) query.status = filters.status;
    if (filters.cpf) query['customerInfo.cpf'] = filters.cpf;
    if (filters.isFirstOrder !== undefined) query.isFirstOrder = filters.isFirstOrder;
    
    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) query.createdAt.$gte = filters.dateFrom;
      if (filters.dateTo) query.createdAt.$lte = filters.dateTo;
    }

    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(offset),
      Order.countDocuments(query)
    ]);

    return { orders, total };
  }
}