import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentCard {
  cardId: string;
  customerId: string;
  orderId: string;
  
  // Dados ofuscados do cartão
  cardLast4Digits: string;
  cardBrand: string;
  cardholderName: string;
  expirationMonth: string;
  expirationYear: string;
  
  // Dados do Mercado Pago
  mercadoPagoCardId?: string;
  mercadoPagoCustomerId?: string;
  token?: string;
  
  // Status e segurança
  isActive: boolean;
  isValid: boolean;
  validationDate?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface IPaymentData {
  paymentId: string;
  orderId: string;
  customerId: string;
  customerInfo: {
    firstName: string;
    lastName: string;
    cpf: string;
    email: string;
    phone: string;
  };
  
  // Dados do pagamento
  paymentMethod: 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' | 'CASH' | 'DIGITAL_WALLET';
  amount: number;
  currency: string;
  
  // Dados específicos por método
  cardInfo?: {
    last4Digits: string;
    brand: string;
    installments: number;
    mercadoPagoPaymentId?: string;
    mercadoPagoStatus?: string;
  };
  
  pixInfo?: {
    qrCode: string;
    qrCodeBase64: string;
    copiaCola: string;
    expirationDate: Date;
    mercadoPagoPaymentId?: string;
  };
  
  // Status do pagamento
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'REFUNDED';
  mercadoPagoPaymentId?: string;
  mercadoPagoStatus?: string;
  mercadoPagoTransactionId?: string;
  
  // Dados de segurança e auditoria
  ipAddress: string;
  userAgent: string;
  fingerprint?: string;
  riskAssessment?: {
    score: number;
    level: 'LOW' | 'MEDIUM' | 'HIGH';
    factors: string[];
  };
  
  // Dados de origem para ofuscação
  originData: {
    accountId: string;
    source: string;
    timestamp: Date;
    hash: string; // Hash para validação de integridade
  };
  
  createdAt: Date;
  updatedAt: Date;
}

// Schema para cartões de crédito/débito
const PaymentCardSchema: Schema = new Schema({
  cardId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  customerId: {
    type: String,
    required: true,
    index: true
  },
  orderId: {
    type: String,
    required: true,
    index: true
  },
  
  // Dados ofuscados do cartão
  cardLast4Digits: {
    type: String,
    required: true
  },
  cardBrand: {
    type: String,
    required: true,
    enum: ['VISA', 'MASTERCARD', 'AMEX', 'ELO', 'HIPERCARD', 'OTHER']
  },
  cardholderName: {
    type: String,
    required: true
  },
  expirationMonth: {
    type: String,
    required: true
  },
  expirationYear: {
    type: String,
    required: true
  },
  
  // Dados do Mercado Pago
  mercadoPagoCardId: String,
  mercadoPagoCustomerId: String,
  token: String,
  
  // Status e segurança
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isValid: {
    type: Boolean,
    default: true
  },
  validationDate: Date
}, {
  timestamps: true,
  collection: 'payment_cards'
});

// Schema para dados de pagamento
const PaymentDataSchema: Schema = new Schema({
  paymentId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  orderId: {
    type: String,
    required: true,
    index: true
  },
  customerId: {
    type: String,
    required: true,
    index: true
  },
  customerInfo: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    cpf: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true }
  },
  
  // Dados do pagamento
  paymentMethod: {
    type: String,
    required: true,
    enum: ['CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'CASH', 'DIGITAL_WALLET'],
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'BRL'
  },
  
  // Dados específicos por método
  cardInfo: {
    last4Digits: String,
    brand: String,
    installments: Number,
    mercadoPagoPaymentId: String,
    mercadoPagoStatus: String
  },
  
  pixInfo: {
    qrCode: String,
    qrCodeBase64: String,
    copiaCola: String,
    expirationDate: Date,
    mercadoPagoPaymentId: String
  },
  
  // Status do pagamento
  status: {
    type: String,
    required: true,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'REFUNDED'],
    default: 'PENDING',
    index: true
  },
  mercadoPagoPaymentId: String,
  mercadoPagoStatus: String,
  mercadoPagoTransactionId: String,
  
  // Dados de segurança e auditoria
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    required: true
  },
  fingerprint: String,
  riskAssessment: {
    score: Number,
    level: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'] },
    factors: [String]
  },
  
  // Dados de origem para ofuscação
  originData: {
    accountId: { type: String, required: true },
    source: { type: String, required: true },
    timestamp: { type: Date, required: true },
    hash: { type: String, required: true }
  }
}, {
  timestamps: true,
  collection: 'payment_data'
});

// Índices para otimização
PaymentDataSchema.index({ status: 1, createdAt: -1 });
PaymentDataSchema.index({ paymentMethod: 1, status: 1 });
PaymentDataSchema.index({ 'customerInfo.cpf': 1, createdAt: -1 });
PaymentDataSchema.index({ mercadoPagoPaymentId: 1 });

// Métodos estáticos para busca segura
PaymentDataSchema.statics.findByPaymentId = function(paymentId: string) {
  return this.findOne({ paymentId }).select('-originData');
};

PaymentDataSchema.statics.findByOrderId = function(orderId: string) {
  return this.findOne({ orderId }).select('-originData');
};

PaymentDataSchema.statics.findByCustomerCPF = function(cpf: string) {
  return this.find({ 'customerInfo.cpf': cpf }).select('-originData');
};

export const PaymentCard = mongoose.model<IPaymentCard>('PaymentCard', PaymentCardSchema);
export const PaymentData = mongoose.model<IPaymentData>('PaymentData', PaymentDataSchema);