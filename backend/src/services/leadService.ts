import { Customer, ICustomer } from '../models/Customer';
import { Order, IOrder } from '../models/Order';
import mongoose from 'mongoose';

interface LeadData {
  source: string;
  campaign?: string;
  medium?: string;
  content?: string;
  term?: string;
  referrer?: string;
  landingPage?: string;
  userAgent?: string;
  ipAddress?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
}

interface LeadConversionData {
  leadId: string;
  customerInfo: {
    firstName: string;
    lastName: string;
    cpf: string;
    email: string;
    phone: string;
  };
  conversionEvent: 'ORDER_PLACED' | 'ACCOUNT_CREATED' | 'NEWSLETTER_SIGNUP' | 'CONTACT_FORM';
  orderId?: string;
  conversionValue?: number;
}

export class LeadService {
  /**
   * Criar ou atualizar lead com base nos dados de origem
   */
  async processLeadSource(customerData: {
    firstName: string;
    lastName: string;
    cpf: string;
    email: string;
    phone: string;
  }, leadData: LeadData): Promise<ICustomer> {
    
    // Buscar cliente existente
    let customer = await Customer.findOne({ cpf: customerData.cpf });
    
    if (customer) {
      // Atualizar informações do lead se o cliente já existe
      const leadInfo = {
        source: leadData.source,
        campaign: leadData.campaign || leadData.utmCampaign,
        medium: leadData.medium || leadData.utmMedium,
        content: leadData.content || leadData.utmContent,
        term: leadData.term || leadData.utmTerm,
        referrer: leadData.referrer,
        landingPage: leadData.landingPage,
        userAgent: leadData.userAgent,
        ipAddress: leadData.ipAddress,
        firstContactAt: new Date()
      };

      // Se for um lead novo (sem source anterior), atualizar
      if (!customer.leadSource) {
        customer.leadSource = leadInfo.source;
        customer.leadInfo = leadInfo;
        customer.leadStatus = 'NEW';
      }
      
      await customer.save();
    } else {
      // Criar novo cliente com informações do lead
      customer = new Customer({
        customerId: new mongoose.Types.ObjectId().toString(),
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        cpf: customerData.cpf,
        email: customerData.email,
        phone: customerData.phone,
        leadSource: leadData.source,
        leadInfo: {
          source: leadData.source,
          campaign: leadData.campaign || leadData.utmCampaign,
          medium: leadData.medium || leadData.utmMedium,
          content: leadData.content || leadData.utmContent,
          term: leadData.term || leadData.utmTerm,
          referrer: leadData.referrer,
          landingPage: leadData.landingPage,
          userAgent: leadData.userAgent,
          ipAddress: leadData.ipAddress,
          firstContactAt: new Date()
        },
        leadStatus: 'NEW',
        statistics: {
          totalOrders: 0,
          totalSpent: 0,
          averageOrderValue: 0
        },
        addresses: []
      });

      await customer.save();
    }

    return customer;
  }

  /**
   * Registrar conversão de lead (pedido realizado)
   */
  async registerLeadConversion(conversionData: LeadConversionData): Promise<{
    customer: ICustomer;
    order?: IOrder;
    isFirstOrder: boolean;
  }> {
    try {
      // Buscar cliente
      const customer = await Customer.findOne({ cpf: conversionData.customerInfo.cpf });
      if (!customer) {
        throw new Error('Cliente não encontrado');
      }

      // Buscar pedido se fornecido
      let order: IOrder | null = null;
      if (conversionData.orderId) {
        order = await Order.findOne({ orderId: conversionData.orderId });
      }

      // Verificar se é primeiro pedido
      const isFirstOrder = await Order.isFirstOrderByCPF(conversionData.customerInfo.cpf);

      // Atualizar status do lead
      customer.leadStatus = 'CONVERTED';
      customer.convertedAt = new Date();
      customer.conversionEvent = conversionData.conversionEvent;
      customer.conversionValue = conversionData.conversionValue;

      // Se for conversão por pedido, atualizar informações adicionais
      if (order && conversionData.conversionEvent === 'ORDER_PLACED') {
        customer.firstOrderAt = customer.firstOrderAt || new Date();
        customer.lastOrderAt = new Date();
        
        // Atualizar lead info com informações do pedido
        if (!customer.leadInfo) {
          customer.leadInfo = {};
        }
        customer.leadInfo.firstOrderId = order.orderId;
        customer.leadInfo.firstOrderValue = order.pricing.total;
        customer.leadInfo.conversionSource = 'ORDER';
      }

      await customer.save();

      return {
        customer,
        order: order || undefined,
        isFirstOrder
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Obter análise de performance de leads por fonte
   */
  async getLeadAnalytics(filters: {
    dateFrom?: Date;
    dateTo?: Date;
    source?: string;
  }): Promise<{
    totalLeads: number;
    convertedLeads: number;
    conversionRate: number;
    averageOrderValue: number;
    totalRevenue: number;
    bySource: Array<{
      source: string;
      totalLeads: number;
      convertedLeads: number;
      conversionRate: number;
      totalRevenue: number;
      averageOrderValue: number;
    }>;
    byCampaign: Array<{
      campaign: string;
      source: string;
      totalLeads: number;
      convertedLeads: number;
      conversionRate: number;
      totalRevenue: number;
    }>;
  }> {
    const matchStage: any = {};
    
    if (filters.dateFrom || filters.dateTo) {
      matchStage.createdAt = {};
      if (filters.dateFrom) matchStage.createdAt.$gte = filters.dateFrom;
      if (filters.dateTo) matchStage.createdAt.$lte = filters.dateTo;
    }

    if (filters.source) {
      matchStage.leadSource = filters.source;
    }

    // Agregação para análise por fonte
    const sourceAggregation = await Customer.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$leadSource',
          totalLeads: { $sum: 1 },
          convertedLeads: {
            $sum: {
              $cond: [{ $eq: ['$leadStatus', 'CONVERTED'] }, 1, 0]
            }
          },
          totalRevenue: { $sum: '$totalSpent' },
          averageOrderValue: { $avg: '$totalSpent' }
        }
      },
      {
        $project: {
          source: '$_id',
          totalLeads: 1,
          convertedLeads: 1,
          conversionRate: {
            $cond: [
              { $gt: ['$totalLeads', 0] },
              { $divide: ['$convertedLeads', '$totalLeads'] },
              0
            ]
          },
          totalRevenue: 1,
          averageOrderValue: 1,
          _id: 0
        }
      },
      { $sort: { totalLeads: -1 } }
    ]);

    // Agregação para análise por campanha
    const campaignAggregation = await Customer.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            campaign: '$leadInfo.campaign',
            source: '$leadSource'
          },
          totalLeads: { $sum: 1 },
          convertedLeads: {
            $sum: {
              $cond: [{ $eq: ['$leadStatus', 'CONVERTED'] }, 1, 0]
            }
          },
          totalRevenue: { $sum: '$totalSpent' }
        }
      },
      {
        $project: {
          campaign: '$_id.campaign',
          source: '$_id.source',
          totalLeads: 1,
          convertedLeads: 1,
          conversionRate: {
            $cond: [
              { $gt: ['$totalLeads', 0] },
              { $divide: ['$convertedLeads', '$totalLeads'] },
              0
            ]
          },
          totalRevenue: 1,
          _id: 0
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    // Totais gerais
    const totals = await Customer.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalLeads: { $sum: 1 },
          convertedLeads: {
            $sum: {
              $cond: [{ $eq: ['$leadStatus', 'CONVERTED'] }, 1, 0]
            }
          },
          totalRevenue: { $sum: '$totalSpent' }
        }
      },
      {
        $project: {
          totalLeads: 1,
          convertedLeads: 1,
          conversionRate: {
            $cond: [
              { $gt: ['$totalLeads', 0] },
              { $divide: ['$convertedLeads', '$totalLeads'] },
              0
            ]
          },
          totalRevenue: 1,
          averageOrderValue: {
            $cond: [
              { $gt: ['$convertedLeads', 0] },
              { $divide: ['$totalRevenue', '$convertedLeads'] },
              0
            ]
          },
          _id: 0
        }
      }
    ]);

    const totalsData = totals[0] || {
      totalLeads: 0,
      convertedLeads: 0,
      conversionRate: 0,
      totalRevenue: 0,
      averageOrderValue: 0
    };

    return {
      ...totalsData,
      bySource: sourceAggregation,
      byCampaign: campaignAggregation
    };
  }

  /**
   * Obter leads por status
   */
  async getLeadsByStatus(status?: string): Promise<{
    leads: ICustomer[];
    total: number;
  }> {
    const query: any = {};
    
    if (status) {
      query.leadStatus = status;
    } else {
      // Se não especificado, pegar todos os leads (com leadSource)
      query.leadSource = { $exists: true, $ne: null };
    }

    const [leads, total] = await Promise.all([
      Customer.find(query)
        .sort({ createdAt: -1 })
        .limit(100),
      Customer.countDocuments(query)
    ]);

    return { leads, total };
  }
}