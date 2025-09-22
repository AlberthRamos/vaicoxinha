import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { app } from '@/server';
import { Customer } from '@/models/Customer';
import { Order } from '@/models/Order';
import { Product } from '@/models/Product';
import { PaymentData } from '@/models/Payment';
import { SecurityService } from '@/services/securityService';
import bcrypt from 'bcryptjs';

// Mock do Mercado Pago
jest.mock('@/services/mercadoPagoService', () => ({
  MercadoPagoService: jest.fn().mockImplementation(() => ({
    processCreditCardPayment: jest.fn().mockResolvedValue({
      id: 'test_payment_id',
      status: 'PENDING',
      paymentMethod: 'CREDIT_CARD',
      amount: 100,
      cardInfo: {
        last4Digits: '1234',
        brand: 'visa',
        installments: 1
      },
      pixData: null,
      securityData: {
        encryptedData: 'encrypted_data',
        fingerprint: 'fingerprint',
        origin: 'origin'
      }
    })),
    processPixPayment: jest.fn().mockResolvedValue({
      id: 'test_pix_payment_id',
      status: 'PENDING',
      paymentMethod: 'PIX',
      amount: 100,
      cardInfo: null,
      pixData: {
        qrCode: 'test_qr_code',
        qrCodeBase64: 'base64_qr_code',
        ticketUrl: 'https://test.com/ticket',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      },
      securityData: {
        encryptedData: 'encrypted_data',
        fingerprint: 'fingerprint',
        origin: 'origin'
      }
    }),
    getPaymentStatus: jest.fn().mockResolvedValue('approved'),
    processWebhook: jest.fn().mockResolvedValue(undefined)
  }))
}));

describe('Fluxo de Pedidos - Testes Funcionais', () => {
  let mongoServer: MongoMemoryServer;
  let authToken: string;
  let customerId: string;
  let productId: string;
  let orderId: string;

  beforeAll(async () => {
    // Iniciar MongoDB em memória
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Limpar dados antes de cada teste
    await Customer.deleteMany({});
    await Order.deleteMany({});
    await Product.deleteMany({});
    await PaymentData.deleteMany({});

    // Criar cliente de teste
    const hashedPassword = await bcrypt.hash('Test@123', 10);
    const customer = await Customer.create({
      firstName: 'João',
      lastName: 'Silva',
      email: 'joao.silva@teste.com',
      cpf: '12345678901',
      phone: '11999999999',
      password: hashedPassword,
      address: {
        street: 'Rua Teste',
        number: '123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234567',
        complement: 'Apto 101'
      }
    });
    customerId = customer._id.toString();

    // Criar produto de teste
    const product = await Product.create({
      name: 'Coxinha Tradicional',
      description: 'Coxinha de frango tradicional',
      price: 5.50,
      category: 'Salgados',
      imageUrl: 'https://example.com/coxinha.jpg',
      isActive: true,
      stock: 100
    });
    productId = product._id.toString();

    // Fazer login para obter token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'joao.silva@teste.com',
        password: 'Test@123'
      });

    authToken = loginResponse.body.data.token;
  });

  describe('Criação de Pedido', () => {
    it('deve criar um pedido com sucesso', async () => {
      const orderData = {
        items: [
          {
            productId,
            quantity: 2,
            unitPrice: 5.50,
            totalPrice: 11.00
          }
        ],
        pricing: {
          subtotal: 11.00,
          deliveryFee: 10.00,
          total: 21.00
        },
        deliveryAddress: {
          street: 'Rua Entrega',
          number: '456',
          neighborhood: 'Jardim',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234567',
          complement: 'Casa'
        },
        deliveryMethod: 'DELIVERY',
        paymentMethod: 'CREDIT_CARD',
        scheduledTime: null,
        notes: 'Deixar na portaria'
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('orderId');
      expect(response.body.data).toHaveProperty('orderNumber');
      expect(response.body.data.status).toBe('PENDING');
      expect(response.body.data.totalAmount).toBe(21.00);

      orderId = response.body.data.orderId;
    });

    it('deve validar dados obrigatórios do pedido', async () => {
      const invalidOrderData = {
        items: [], // Array vazio
        pricing: {
          subtotal: 0,
          deliveryFee: 0,
          total: 0
        }
      };

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidOrderData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Pagamento com Cartão de Crédito', () => {
    it('deve processar pagamento com cartão de crédito', async () => {
      // Primeiro criar o pedido
      const orderData = {
        items: [
          {
            productId,
            quantity: 2,
            unitPrice: 5.50,
            totalPrice: 11.00
          }
        ],
        pricing: {
          subtotal: 11.00,
          deliveryFee: 10.00,
          total: 21.00
        },
        deliveryAddress: {
          street: 'Rua Entrega',
          number: '456',
          neighborhood: 'Jardim',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234567',
          complement: 'Casa'
        },
        deliveryMethod: 'DELIVERY',
        paymentMethod: 'CREDIT_CARD',
        scheduledTime: null,
        notes: 'Deixar na portaria'
      };

      const orderResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData);

      orderId = orderResponse.body.data.orderId;

      // Processar pagamento
      const paymentData = {
        orderId,
        amount: 21.00,
        cardData: {
          token: 'test_card_token',
          issuerId: '123',
          paymentMethodId: 'visa',
          installments: 1
        },
        customer: {
          email: 'joao.silva@teste.com',
          firstName: 'João',
          lastName: 'Silva',
          identification: {
            type: 'CPF',
            number: '12345678901'
          }
        }
      };

      const response = await request(app)
        .post('/api/payments/mercadopago/process-card')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('paymentId');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data.paymentMethod).toBe('CREDIT_CARD');

      // Verificar se o pagamento foi salvo no banco
      const savedPayment = await PaymentData.findOne({ orderId });
      expect(savedPayment).toBeDefined();
      expect(savedPayment?.status).toBe('PENDING');
      expect(savedPayment?.paymentMethod).toBe('CREDIT_CARD');
      expect(savedPayment?.amount).toBe(21.00);
    });

    it('deve armazenar dados do cliente de forma segura', async () => {
      const orderData = {
        items: [
          {
            productId,
            quantity: 1,
            unitPrice: 5.50,
            totalPrice: 5.50
          }
        ],
        pricing: {
          subtotal: 5.50,
          deliveryFee: 10.00,
          total: 15.50
        },
        deliveryAddress: {
          street: 'Rua Entrega',
          number: '456',
          neighborhood: 'Jardim',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234567',
          complement: 'Casa'
        },
        deliveryMethod: 'DELIVERY',
        paymentMethod: 'CREDIT_CARD',
        scheduledTime: null,
        notes: 'Teste de segurança'
      };

      const orderResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData);

      const orderId = orderResponse.body.data.orderId;

      const paymentData = {
        orderId,
        amount: 15.50,
        cardData: {
          token: 'test_card_token',
          issuerId: '123',
          paymentMethodId: 'visa',
          installments: 1
        },
        customer: {
          email: 'joao.silva@teste.com',
          firstName: 'João',
          lastName: 'Silva',
          identification: {
            type: 'CPF',
            number: '12345678901'
          }
        }
      };

      await request(app)
        .post('/api/payments/mercadopago/process-card')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData);

      // Verificar se os dados estão criptografados
      const savedPayment = await PaymentData.findOne({ orderId });
      expect(savedPayment?.securityData.encryptedData).toBeDefined();
      expect(savedPayment?.securityData.fingerprint).toBeDefined();
      expect(savedPayment?.securityData.origin).toBeDefined();
      
      // Verificar se os dados sensíveis estão mascarados
      expect(savedPayment?.customerInfo.cpf).toBe('***456789**');
      expect(savedPayment?.customerInfo.email).toBe('j***o@***e.com');
    });
  });

  describe('Pagamento com PIX', () => {
    it('deve processar pagamento com PIX', async () => {
      const orderData = {
        items: [
          {
            productId,
            quantity: 3,
            unitPrice: 5.50,
            totalPrice: 16.50
          }
        ],
        pricing: {
          subtotal: 16.50,
          deliveryFee: 10.00,
          total: 26.50
        },
        deliveryAddress: {
          street: 'Rua Entrega',
          number: '456',
          neighborhood: 'Jardim',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234567',
          complement: 'Casa'
        },
        deliveryMethod: 'DELIVERY',
        paymentMethod: 'PIX',
        scheduledTime: null,
        notes: 'Pagamento via PIX'
      };

      const orderResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData);

      orderId = orderResponse.body.data.orderId;

      // Processar pagamento PIX
      const paymentData = {
        orderId,
        amount: 26.50,
        description: 'Pedido de coxinhas',
        payer: {
          email: 'joao.silva@teste.com',
          firstName: 'João',
          lastName: 'Silva',
          identification: {
            type: 'CPF',
            number: '12345678901'
          }
        }
      };

      const response = await request(app)
        .post('/api/payments/mercadopago/process-pix')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('paymentId');
      expect(response.body.data).toHaveProperty('qrCode');
      expect(response.body.data).toHaveProperty('qrCodeBase64');
      expect(response.body.data.paymentMethod).toBe('PIX');

      // Verificar se o QR Code é válido
      expect(response.body.data.qrCodeBase64).toMatch(/^data:image\/png;base64,/);

      // Verificar se o pagamento foi salvo
      const savedPayment = await PaymentData.findOne({ orderId });
      expect(savedPayment).toBeDefined();
      expect(savedPayment?.status).toBe('PENDING');
      expect(savedPayment?.paymentMethod).toBe('PIX');
      expect(savedPayment?.pixInfo?.qrCode).toBeDefined();
      expect(savedPayment?.pixInfo?.qrCodeBase64).toBeDefined();
    });
  });

  describe('Consulta de Status', () => {
    it('deve consultar status do pagamento', async () => {
      // Criar pedido e pagamento
      const orderData = {
        items: [
          {
            productId,
            quantity: 1,
            unitPrice: 5.50,
            totalPrice: 5.50
          }
        ],
        pricing: {
          subtotal: 5.50,
          deliveryFee: 10.00,
          total: 15.50
        },
        deliveryAddress: {
          street: 'Rua Entrega',
          number: '456',
          neighborhood: 'Jardim',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234567',
          complement: 'Casa'
        },
        deliveryMethod: 'DELIVERY',
        paymentMethod: 'CREDIT_CARD',
        scheduledTime: null,
        notes: 'Teste de status'
      };

      const orderResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData);

      const orderId = orderResponse.body.data.orderId;

      const paymentData = {
        orderId,
        amount: 15.50,
        cardData: {
          token: 'test_card_token',
          issuerId: '123',
          paymentMethodId: 'visa',
          installments: 1
        },
        customer: {
          email: 'joao.silva@teste.com',
          firstName: 'João',
          lastName: 'Silva',
          identification: {
            type: 'CPF',
            number: '12345678901'
          }
        }
      };

      const paymentResponse = await request(app)
        .post('/api/payments/mercadopago/process-card')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData);

      const paymentId = paymentResponse.body.data.paymentId;

      // Consultar status
      const statusResponse = await request(app)
        .get(`/api/payments/mercadopago/status/${paymentId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(statusResponse.status).toBe(200);
      expect(statusResponse.body.success).toBe(true);
      expect(statusResponse.body.data).toHaveProperty('status');
      expect(statusResponse.body.data).toHaveProperty('paymentId');
      expect(statusResponse.body.data.paymentId).toBe(paymentId);
    });
  });

  describe('Webhook de Notificação', () => {
    it('deve processar webhook de notificação', async () => {
      const webhookData = {
        id: 123456789,
        live_mode: false,
        type: 'payment',
        date_created: new Date().toISOString(),
        application_id: 'test_app_id',
        user_id: 'test_user_id',
        version: 1,
        api_version: 'v1',
        action: 'payment.updated',
        data: {
          id: 'test_payment_id'
        }
      };

      const response = await request(app)
        .post('/api/webhooks/mercadopago')
        .send(webhookData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Webhook processado com sucesso');
    });
  });

  describe('Validação de Cartão', () => {
    it('deve validar token de cartão', async () => {
      const response = await request(app)
        .post('/api/payments/mercadopago/validate-card')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          token: 'test_card_token'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('valid');
      expect(response.body.data.valid).toBe(true);
    });
  });

  describe('Métodos de Pagamento', () => {
    it('deve listar métodos de pagamento disponíveis', async () => {
      const response = await request(app)
        .get('/api/payments/mercadopago/payment-methods')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Segurança e Conformidade', () => {
    it('deve ofuscar dados sensíveis do cliente', async () => {
      const orderData = {
        items: [
          {
            productId,
            quantity: 1,
            unitPrice: 5.50,
            totalPrice: 5.50
          }
        ],
        pricing: {
          subtotal: 5.50,
          deliveryFee: 10.00,
          total: 15.50
        },
        deliveryAddress: {
          street: 'Rua Entrega',
          number: '456',
          neighborhood: 'Jardim',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234567',
          complement: 'Casa'
        },
        deliveryMethod: 'DELIVERY',
        paymentMethod: 'CREDIT_CARD',
        scheduledTime: null,
        notes: 'Teste de ofuscação'
      };

      const orderResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData);

      const orderId = orderResponse.body.data.orderId;

      const paymentData = {
        orderId,
        amount: 15.50,
        cardData: {
          token: 'test_card_token',
          issuerId: '123',
          paymentMethodId: 'visa',
          installments: 1
        },
        customer: {
          email: 'joao.silva@teste.com',
          firstName: 'João',
          lastName: 'Silva',
          identification: {
            type: 'CPF',
            number: '12345678901'
          }
        }
      };

      await request(app)
        .post('/api/payments/mercadopago/process-card')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData);

      // Verificar ofuscação
      const savedPayment = await PaymentData.findOne({ orderId });
      expect(savedPayment?.customerInfo.cpf).not.toBe('12345678901');
      expect(savedPayment?.customerInfo.email).not.toBe('joao.silva@teste.com');
      expect(savedPayment?.customerInfo.cpf).toContain('***');
      expect(savedPayment?.customerInfo.email).toContain('***');
    });

    it('deve gerar fingerprint único para cada transação', async () => {
      const orderData = {
        items: [
          {
            productId,
            quantity: 1,
            unitPrice: 5.50,
            totalPrice: 5.50
          }
        ],
        pricing: {
          subtotal: 5.50,
          deliveryFee: 10.00,
          total: 15.50
        },
        deliveryAddress: {
          street: 'Rua Entrega',
          number: '456',
          neighborhood: 'Jardim',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234567',
          complement: 'Casa'
        },
        deliveryMethod: 'DELIVERY',
        paymentMethod: 'CREDIT_CARD',
        scheduledTime: null,
        notes: 'Teste de fingerprint'
      };

      const orderResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData);

      const orderId1 = orderResponse.body.data.orderId;

      const paymentData = {
        orderId: orderId1,
        amount: 15.50,
        cardData: {
          token: 'test_card_token',
          issuerId: '123',
          paymentMethodId: 'visa',
          installments: 1
        },
        customer: {
          email: 'joao.silva@teste.com',
          firstName: 'João',
          lastName: 'Silva',
          identification: {
            type: 'CPF',
            number: '12345678901'
          }
        }
      };

      await request(app)
        .post('/api/payments/mercadopago/process-card')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData);

      // Criar segundo pedido
      const orderResponse2 = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData);

      const orderId2 = orderResponse2.body.data.orderId;

      const paymentData2 = {
        ...paymentData,
        orderId: orderId2
      };

      await request(app)
        .post('/api/payments/mercadopago/process-card')
        .set('Authorization', `Bearer ${authToken}`)
        .send(paymentData2);

      // Verificar fingerprints diferentes
      const payment1 = await PaymentData.findOne({ orderId: orderId1 });
      const payment2 = await PaymentData.findOne({ orderId: orderId2 });

      expect(payment1?.securityData.fingerprint).toBeDefined();
      expect(payment2?.securityData.fingerprint).toBeDefined();
      expect(payment1?.securityData.fingerprint).not.toBe(payment2?.securityData.fingerprint);
    });
  });
});