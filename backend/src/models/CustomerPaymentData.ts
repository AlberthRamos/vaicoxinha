import mongoose, { Schema, Document } from 'mongoose';
import crypto from 'crypto';

export interface ICustomerPaymentData extends Document {
  customerId: string;
  orderId: string;
  paymentMethod: 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX';
  cardData?: {
    token: string;
    last4Digits: string;
    brand: string;
    expirationMonth: string;
    expirationYear: string;
    holderName: string;
    encryptedData: string;
  };
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    cpf: string;
    phone: string;
    encryptedPersonalData: string;
  };
  billingAddress: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    complement?: string;
    encryptedAddress: string;
  };
  securityMetadata: {
    ipAddress: string;
    userAgent: string;
    fingerprint: string;
    sessionId: string;
    deviceId: string;
    encryptedMetadata: string;
  };
  complianceData: {
    consentGiven: boolean;
    consentDate: Date;
    dataRetentionExpiry: Date;
    purpose: string;
    legalBasis: string;
  };
  status: 'ACTIVE' | 'INACTIVE' | 'DELETED';
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

const CustomerPaymentDataSchema = new Schema<ICustomerPaymentData>({
  customerId: {
    type: String,
    required: true,
    index: true
  },
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  paymentMethod: {
    type: String,
    enum: ['CREDIT_CARD', 'DEBIT_CARD', 'PIX'],
    required: true
  },
  cardData: {
    token: {
      type: String,
      required: function() { return this.paymentMethod !== 'PIX'; }
    },
    last4Digits: {
      type: String,
      required: function() { return this.paymentMethod !== 'PIX'; }
    },
    brand: {
      type: String,
      required: function() { return this.paymentMethod !== 'PIX'; }
    },
    expirationMonth: {
      type: String,
      required: function() { return this.paymentMethod !== 'PIX'; }
    },
    expirationYear: {
      type: String,
      required: function() { return this.paymentMethod !== 'PIX'; }
    },
    holderName: {
      type: String,
      required: function() { return this.paymentMethod !== 'PIX'; }
    },
    encryptedData: {
      type: String,
      required: function() { return this.paymentMethod !== 'PIX'; }
    }
  },
  customerInfo: {
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    cpf: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    encryptedPersonalData: {
      type: String,
      required: true
    }
  },
  billingAddress: {
    street: {
      type: String,
      required: true
    },
    number: {
      type: String,
      required: true
    },
    neighborhood: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    },
    complement: String,
    encryptedAddress: {
      type: String,
      required: true
    }
  },
  securityMetadata: {
    ipAddress: {
      type: String,
      required: true
    },
    userAgent: {
      type: String,
      required: true
    },
    fingerprint: {
      type: String,
      required: true,
      unique: true
    },
    sessionId: {
      type: String,
      required: true
    },
    deviceId: {
      type: String,
      required: true
    },
    encryptedMetadata: {
      type: String,
      required: true
    }
  },
  complianceData: {
    consentGiven: {
      type: Boolean,
      required: true,
      default: true
    },
    consentDate: {
      type: Date,
      required: true,
      default: Date.now
    },
    dataRetentionExpiry: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000) // 5 anos
    },
    purpose: {
      type: String,
      required: true,
      default: 'payment_processing'
    },
    legalBasis: {
      type: String,
      required: true,
      default: 'contract_performance'
    }
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'DELETED'],
    default: 'ACTIVE'
  },
  deletedAt: Date
}, {
  timestamps: true
});

// Índices para otimização de consultas
CustomerPaymentDataSchema.index({ customerId, status: 1 });
CustomerPaymentDataSchema.index({ 'complianceData.dataRetentionExpiry': 1 }, { expireAfterSeconds: 0 });
CustomerPaymentDataSchema.index({ createdAt: 1 });

// Métodos de instância para descriptografia (mock - em produção usar HSM)
CustomerPaymentDataSchema.methods.decryptSensitiveData = function(field: string): string {
  // Em produção, usar Hardware Security Module (HSM) ou AWS KMS
  // Esta é uma implementação mock para demonstração
  const algorithm = 'aes-256-cbc';
  const key = Buffer.from(process.env.ENCRYPTION_KEY || 'default-key-32-bytes-long-for-demo', 'utf8');
  const iv = Buffer.from('1234567890123456'); // Em produção, usar IV único por registro
  
  const encrypted = this[field];
  if (!encrypted) return '';
  
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

// Middleware para log de acessos
CustomerPaymentDataSchema.pre('find', function() {
  console.log(`[AUDIT] Acesso aos dados de pagamento em: ${new Date().toISOString()}`);
});

CustomerPaymentDataSchema.pre('findOne', function() {
  console.log(`[AUDIT] Acesso aos dados de pagamento em: ${new Date().toISOString()}`);
});

export const CustomerPaymentData = mongoose.model<ICustomerPaymentData>('CustomerPaymentData', CustomerPaymentDataSchema);