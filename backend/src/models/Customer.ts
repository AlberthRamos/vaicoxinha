import mongoose, { Document, Schema } from 'mongoose';

// Interface para o documento do cliente
export interface ICustomer extends Document {
  customerId: string;
  firstName: string;
  lastName: string;
  cpf: string;
  email: string;
  phone: string;
  addresses: Array<{
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    isDefault: boolean;
  }>;
  preferences: {
    favoriteProducts: string[];
    dietaryRestrictions: string[];
    preferredPaymentMethod?: string;
  };
  statistics: {
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    firstOrderDate?: Date;
    lastOrderDate?: Date;
  };
  leadSource?: string;
  leadStatus?: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'LOST';
  leadInfo?: {
    source: string;
    campaign?: string;
    medium?: string;
    content?: string;
    term?: string;
    referrer?: string;
    landingPage?: string;
    userAgent?: string;
    ipAddress?: string;
    firstContactAt: Date;
    firstOrderId?: string;
    firstOrderValue?: number;
    conversionSource?: 'ORDER' | 'MANUAL' | 'SYSTEM';
  };
  convertedAt?: Date;
  conversionEvent?: string;
  conversionValue?: number;
  firstOrderAt?: Date;
  lastOrderAt?: Date;
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Schema do cliente
const CustomerSchema: Schema = new Schema({
  customerId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  firstName: {
    type: String,
    required: true,
    index: true
  },
  lastName: {
    type: String,
    required: true,
    index: true
  },
  cpf: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  phone: {
    type: String,
    required: true,
    index: true
  },
  addresses: [{
    street: { type: String, required: true },
    number: { type: String, required: true },
    complement: { type: String, default: '' },
    neighborhood: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    isDefault: { type: Boolean, default: false }
  }],
  preferences: {
    favoriteProducts: [{ type: String, default: [] }],
    dietaryRestrictions: [{ type: String, default: [] }],
    preferredPaymentMethod: { type: String, default: null }
  },
  statistics: {
    totalOrders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    averageOrderValue: { type: Number, default: 0 },
    firstOrderDate: { type: Date, default: null },
    lastOrderDate: { type: Date, default: null }
  },
  leadSource: { type: String, default: null },
  leadStatus: { 
    type: String, 
    enum: ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'],
    default: null,
    index: true 
  },
  leadInfo: {
    source: { type: String, default: null },
    campaign: { type: String, default: null },
    medium: { type: String, default: null },
    content: { type: String, default: null },
    term: { type: String, default: null },
    referrer: { type: String, default: null },
    landingPage: { type: String, default: null },
    userAgent: { type: String, default: null },
    ipAddress: { type: String, default: null },
    firstContactAt: { type: Date, default: null },
    firstOrderId: { type: String, default: null },
    firstOrderValue: { type: Number, default: null },
    conversionSource: { type: String, enum: ['ORDER', 'MANUAL', 'SYSTEM'], default: null }
  },
  convertedAt: { type: Date, default: null },
  conversionEvent: { type: String, default: null },
  conversionValue: { type: Number, default: null },
  firstOrderAt: { type: Date, default: null },
  lastOrderAt: { type: Date, default: null },
  tags: [{ type: String, default: [] }],
  isActive: { type: Boolean, default: true, index: true }
}, {
  timestamps: true,
  collection: 'customers'
});

// Índices compostos para otimizar consultas
CustomerSchema.index({ cpf: 1, email: 1 });
CustomerSchema.index({ phone: 1, isActive: 1 });
CustomerSchema.index({ 'statistics.totalOrders': -1 });
CustomerSchema.index({ 'statistics.totalSpent': -1 });
CustomerSchema.index({ createdAt: -1 });

// Método estático para verificar se é um novo cliente
CustomerSchema.statics.isNewCustomer = async function(cpf: string): Promise<boolean> {
  const count = await this.countDocuments({ cpf });
  return count === 0;
};

// Método estático para buscar ou criar cliente
CustomerSchema.statics.findOrCreate = async function(customerData: any) {
  let customer = await this.findOne({ cpf: customerData.cpf });
  
  if (!customer) {
    customer = new this({
      customerId: new mongoose.Types.ObjectId().toString(),
      ...customerData,
      statistics: {
        totalOrders: 0,
        totalSpent: 0,
        averageOrderValue: 0
      }
    });
    await customer.save();
  }
  
  return customer;
};

// Método para atualizar estatísticas após pedido
CustomerSchema.methods.updateStatistics = async function(orderAmount: number) {
  this.statistics.totalOrders += 1;
  this.statistics.totalSpent += orderAmount;
  this.statistics.averageOrderValue = this.statistics.totalSpent / this.statistics.totalOrders;
  
  if (!this.statistics.firstOrderDate) {
    this.statistics.firstOrderDate = new Date();
  }
  
  this.statistics.lastOrderDate = new Date();
  
  await this.save();
};

// Método para adicionar endereço
CustomerSchema.methods.addAddress = async function(address: any, isDefault: boolean = false) {
  if (isDefault) {
    this.addresses.forEach(addr => addr.isDefault = false);
  }
  
  this.addresses.push({
    ...address,
    isDefault: isDefault || this.addresses.length === 0
  });
  
  await this.save();
};

// Método estático para obter clientes mais valiosos
CustomerSchema.statics.getTopCustomers = async function(limit: number = 10) {
  return this.find({ isActive: true })
    .sort({ 'statistics.totalSpent': -1 })
    .limit(limit)
    .select('firstName lastName cpf email statistics');
};

// Método estático para obter clientes inativos
CustomerSchema.statics.getInactiveCustomers = async function(daysWithoutOrder: number = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysWithoutOrder);
  
  return this.find({
    isActive: true,
    $or: [
      { 'statistics.lastOrderDate': { $lt: cutoffDate } },
      { 'statistics.lastOrderDate': null }
    ]
  });
};

export const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema);