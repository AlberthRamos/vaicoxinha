import mongoose, { Document, Schema } from 'mongoose';

// Interface para o documento do pedido
export interface IOrder extends Document {
  orderId: string;
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
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
    amount: number;
    transactionId?: string;
    paidAt?: Date;
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
    estimatedDeliveryTime?: Date;
    deliveryInstructions?: string;
  };
  pricing: {
    subtotal: number;
    deliveryFee: number;
    discount: number;
    tax: number;
    total: number;
  };
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  isFirstOrder: boolean;
  leadSource?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Schema do pedido
const OrderSchema: Schema = new Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  customerInfo: {
    firstName: { type: String, required: true, index: true },
    lastName: { type: String, required: true, index: true },
    cpf: { type: String, required: true, index: true },
    email: { type: String, required: true, index: true },
    phone: { type: String, required: true }
  },
  items: [{
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
    notes: { type: String, default: '' }
  }],
  paymentInfo: {
    method: { 
      type: String, 
      required: true,
      enum: ['CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'CASH', 'DIGITAL_WALLET']
    },
    status: { 
      type: String, 
      required: true,
      enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED'],
      default: 'PENDING'
    },
    amount: { type: Number, required: true, min: 0 },
    transactionId: { type: String, default: null },
    paidAt: { type: Date, default: null }
  },
  deliveryInfo: {
    address: {
      street: { type: String, required: true },
      number: { type: String, required: true },
      complement: { type: String, default: '' },
      neighborhood: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true }
    },
    deliveryFee: { type: Number, required: true, default: 0 },
    estimatedDeliveryTime: { type: Date, default: null },
    deliveryInstructions: { type: String, default: '' }
  },
  pricing: {
    subtotal: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, required: true, default: 0 },
    discount: { type: Number, required: true, default: 0 },
    tax: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true, min: 0 }
  },
  status: { 
    type: String, 
    required: true,
    enum: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED'],
    default: 'PENDING',
    index: true
  },
  isFirstOrder: { type: Boolean, required: true, default: false, index: true },
  leadSource: { type: String, default: null },
  notes: { type: String, default: '' }
}, {
  timestamps: true,
  collection: 'orders'
});

// Índices compostos para otimizar consultas
OrderSchema.index({ 'customerInfo.cpf': 1, createdAt: -1 });
OrderSchema.index({ 'customerInfo.email': 1, createdAt: -1 });
OrderSchema.index({ userId: 1, status: 1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ 'paymentInfo.status': 1 });
OrderSchema.index({ createdAt: -1 });

// Método estático para verificar se é o primeiro pedido
OrderSchema.statics.isFirstOrderByCPF = async function(cpf: string): Promise<boolean> {
  const count = await this.countDocuments({ 'customerInfo.cpf': cpf });
  return count === 0;
};

// Método estático para verificar se é o primeiro pedido por email
OrderSchema.statics.isFirstOrderByEmail = async function(email: string): Promise<boolean> {
  const count = await this.countDocuments({ 'customerInfo.email': email });
  return count === 0;
};

// Método estático para verificar se é o primeiro pedido por userId
OrderSchema.statics.isFirstOrderByUserId = async function(userId: string): Promise<boolean> {
  const count = await this.countDocuments({ userId });
  return count === 0;
};

// Método para obter histórico de pedidos do cliente
OrderSchema.statics.getCustomerHistory = async function(cpf: string) {
  return this.find({ 'customerInfo.cpf': cpf })
    .sort({ createdAt: -1 })
    .select('orderId status pricing.total items createdAt');
};

// Método para obter estatísticas de pedidos
OrderSchema.statics.getOrderStats = async function() {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$pricing.total' },
        averageOrderValue: { $avg: '$pricing.total' },
        firstTimeCustomers: {
          $sum: { $cond: [{ $eq: ['$isFirstOrder', true] }, 1, 0] }
        }
      }
    }
  ]);
};

export const Order = mongoose.model<IOrder>('Order', OrderSchema);