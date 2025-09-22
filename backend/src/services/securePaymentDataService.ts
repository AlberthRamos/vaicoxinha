import crypto from 'crypto';
import { CustomerPaymentData, ICustomerPaymentData } from '@/models/CustomerPaymentData';
import { SecurityService } from './securityService';

export interface SecurePaymentData {
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
  };
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    cpf: string;
    phone: string;
  };
  billingAddress: {
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    complement?: string;
  };
  securityMetadata: {
    ipAddress: string;
    userAgent: string;
    sessionId: string;
    deviceId: string;
  };
  complianceData?: {
    consentGiven?: boolean;
    purpose?: string;
    legalBasis?: string;
  };
}

export class SecurePaymentDataService {
  private securityService: SecurityService;
  private encryptionKey: Buffer;

  constructor() {
    this.securityService = new SecurityService();
    this.encryptionKey = Buffer.from(process.env.ENCRYPTION_KEY || 'default-key-32-bytes-long-for-demo', 'utf8');
  }

  /**
   * Criptografa dados sensíveis usando AES-256-CBC
   */
  private encryptData(data: string): string {
    const algorithm = 'aes-256-cbc';
    const iv = crypto.randomBytes(16); // IV único para cada criptografia
    const cipher = crypto.createCipheriv(algorithm, this.encryptionKey, iv);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Retorna IV + dados criptografados (para descriptografia posterior)
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Descriptografa dados sensíveis
   */
  private decryptData(encryptedData: string): string {
    const [ivHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    
    const algorithm = 'aes-256-cbc';
    const decipher = crypto.createDecipheriv(algorithm, this.encryptionKey, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Ofusca dados pessoais para exibição
   */
  private obfuscatePersonalData(data: string, type: 'cpf' | 'email' | 'phone' | 'name'): string {
    switch (type) {
      case 'cpf':
        // Mantém apenas os últimos 3 dígitos: ***.456.789-**
        return '***' + data.slice(3, 6) + '***' + data.slice(-2);
      
      case 'email':
        // j***o@***e.com
        const [local, domain] = data.split('@');
        const domainParts = domain.split('.');
        return local[0] + '***' + local.slice(-1) + '@' + 
               domainParts[0][0] + '***' + domainParts[0].slice(-1) + '.' + domainParts[1];
      
      case 'phone':
        // (11) 9****-9999
        return data.slice(0, 5) + '****' + data.slice(-4);
      
      case 'name':
        // J***o S***a
        const parts = data.split(' ');
        return parts.map(part => part[0] + '***' + part.slice(-1)).join(' ');
      
      default:
        return data;
    }
  }

  /**
   * Gera fingerprint único para a transação
   */
  private generateFingerprint(data: SecurePaymentData): string {
    const fingerprintData = {
      customerId: data.customerId,
      orderId: data.orderId,
      cardToken: data.cardData?.token || 'pix',
      timestamp: Date.now(),
      random: Math.random()
    };
    
    return crypto
      .createHash('sha256')
      .update(JSON.stringify(fingerprintData))
      .digest('hex');
  }

  /**
   * Salva dados de pagamento de forma segura
   */
  async saveSecurePaymentData(data: SecurePaymentData): Promise<ICustomerPaymentData> {
    try {
      // Criptografar dados sensíveis
      const encryptedPersonalData = this.encryptData(JSON.stringify({
        email: data.customerInfo.email,
        cpf: data.customerInfo.cpf,
        phone: data.customerInfo.phone
      }));

      const encryptedAddress = this.encryptData(JSON.stringify(data.billingAddress));
      
      const encryptedMetadata = this.encryptData(JSON.stringify(data.securityMetadata));

      // Preparar dados do cartão se houver
      let cardData = undefined;
      if (data.cardData) {
        const encryptedCardData = this.encryptData(JSON.stringify(data.cardData));
        cardData = {
          ...data.cardData,
          encryptedData: encryptedCardData
        };
      }

      // Gerar fingerprint único
      const fingerprint = this.generateFingerprint(data);

      // Calcular data de expiração (5 anos para fins legais)
      const dataRetentionExpiry = new Date();
      dataRetentionExpiry.setFullYear(dataRetentionExpiry.getFullYear() + 5);

      // Criar registro seguro
      const securePaymentData = new CustomerPaymentData({
        customerId: data.customerId,
        orderId: data.orderId,
        paymentMethod: data.paymentMethod,
        cardData,
        customerInfo: {
          firstName: data.customerInfo.firstName,
          lastName: data.customerInfo.lastName,
          email: this.obfuscatePersonalData(data.customerInfo.email, 'email'),
          cpf: this.obfuscatePersonalData(data.customerInfo.cpf, 'cpf'),
          phone: this.obfuscatePersonalData(data.customerInfo.phone, 'phone'),
          encryptedPersonalData
        },
        billingAddress: {
          ...data.billingAddress,
          encryptedAddress
        },
        securityMetadata: {
          ...data.securityMetadata,
          fingerprint,
          encryptedMetadata
        },
        complianceData: {
          consentGiven: data.complianceData?.consentGiven ?? true,
          consentDate: new Date(),
          dataRetentionExpiry,
          purpose: data.complianceData?.purpose || 'payment_processing',
          legalBasis: data.complianceData?.legalBasis || 'contract_performance'
        },
        status: 'ACTIVE'
      });

      return await securePaymentData.save();
    } catch (error) {
      console.error('Erro ao salvar dados de pagamento:', error);
      throw new Error('Falha ao salvar dados de pagamento');
    }
  }

  /**
   * Recupera dados de pagamento (com descriptografia)
   */
  async getSecurePaymentData(orderId: string, customerId: string): Promise<ICustomerPaymentData | null> {
    try {
      const paymentData = await CustomerPaymentData.findOne({
        orderId,
        customerId,
        status: 'ACTIVE'
      });

      if (!paymentData) {
        return null;
      }

      // Descriptografar dados sensíveis (se necessário)
      // Nota: Em produção, isso deve ser feito com cuidado e logging adequado
      
      return paymentData;
    } catch (error) {
      console.error('Erro ao recuperar dados de pagamento:', error);
      throw new Error('Falha ao recuperar dados de pagamento');
    }
  }

  /**
   * Atualiza status dos dados (para soft delete)
   */
  async updatePaymentDataStatus(orderId: string, customerId: string, status: 'ACTIVE' | 'INACTIVE' | 'DELETED'): Promise<boolean> {
    try {
      const result = await CustomerPaymentData.updateOne(
        { orderId, customerId },
        { 
          status,
          deletedAt: status === 'DELETED' ? new Date() : undefined
        }
      );

      return result.modifiedCount > 0;
    } catch (error) {
      console.error('Erro ao atualizar status dos dados:', error);
      throw new Error('Falha ao atualizar status dos dados');
    }
  }

  /**
   * Remove dados antigos (conformidade LGPD)
   */
  async cleanupExpiredData(): Promise<number> {
    try {
      const result = await CustomerPaymentData.deleteMany({
        'complianceData.dataRetentionExpiry': { $lt: new Date() },
        status: 'DELETED'
      });

      console.log(`Dados expirados removidos: ${result.deletedCount}`);
      return result.deletedCount;
    } catch (error) {
      console.error('Erro ao limpar dados expirados:', error);
      throw new Error('Falha ao limpar dados expirados');
    }
  }

  /**
   * Busca dados por cliente (com paginação)
   */
  async getPaymentDataByCustomer(customerId: string, page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;
      
      const [data, total] = await Promise.all([
        CustomerPaymentData.find({ customerId, status: 'ACTIVE' })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        CustomerPaymentData.countDocuments({ customerId, status: 'ACTIVE' })
      ]);

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Erro ao buscar dados por cliente:', error);
      throw new Error('Falha ao buscar dados por cliente');
    }
  }

  /**
   * Gera relatório de auditoria
   */
  async generateAuditReport(startDate: Date, endDate: Date): Promise<any> {
    try {
      const report = await CustomerPaymentData.aggregate([
        {
          $match: {
            createdAt: {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        {
          $group: {
            _id: {
              paymentMethod: '$paymentMethod',
              status: '$status'
            },
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        },
        {
          $project: {
            paymentMethod: '$_id.paymentMethod',
            status: '$_id.status',
            count: 1,
            totalAmount: 1,
            _id: 0
          }
        }
      ]);

      return report;
    } catch (error) {
      console.error('Erro ao gerar relatório de auditoria:', error);
      throw new Error('Falha ao gerar relatório de auditoria');
    }
  }
}