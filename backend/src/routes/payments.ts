import express from 'express';
import { body, validationResult } from 'express-validator';
import { PaymentService } from '@/services/paymentService';
import { AppError, ValidationError, NotFoundError } from '@/utils/AppError';
import { authenticate, AuthenticatedRequest } from '@/middlewares/auth';
import { prisma } from '@/database/prisma';
import { logger } from '@/utils/logger';
import paymentRoutes from './paymentRoutes'; // Novas rotas de Mercado Pago

const router = express.Router();
const paymentService = new PaymentService();

// Rotas de Mercado Pago
router.use('/mercadopago', paymentRoutes);

// Validações
const createPixPaymentValidation = [
  body('orderId')
    .notEmpty()
    .withMessage('ID do pedido é obrigatório')
    .isUUID()
    .withMessage('ID do pedido deve ser um UUID válido'),
  body('amount')
    .notEmpty()
    .withMessage('Valor é obrigatório')
    .isFloat({ min: 0.01 })
    .withMessage('Valor deve ser maior que zero'),
  body('description')
    .notEmpty()
    .withMessage('Descrição é obrigatória')
    .isLength({ min: 1, max: 200 })
    .withMessage('Descrição deve ter entre 1 e 200 caracteres'),
  body('payer.email')
    .notEmpty()
    .withMessage('Email do pagador é obrigatório')
    .isEmail()
    .withMessage('Email inválido'),
  body('payer.firstName')
    .notEmpty()
    .withMessage('Nome do pagador é obrigatório')
    .isLength({ min: 1, max: 50 })
    .withMessage('Nome deve ter entre 1 e 50 caracteres'),
  body('payer.lastName')
    .notEmpty()
    .withMessage('Sobrenome do pagador é obrigatório')
    .isLength({ min: 1, max: 50 })
    .withMessage('Sobrenome deve ter entre 1 e 50 caracteres'),
  body('payer.identification.type')
    .notEmpty()
    .withMessage('Tipo de identificação é obrigatório')
    .isIn(['CPF', 'CNPJ'])
    .withMessage('Tipo de identificação deve ser CPF ou CNPJ'),
  body('payer.identification.number')
    .notEmpty()
    .withMessage('Número de identificação é obrigatório')
    .custom((value, { req }) => {
      const type = req.body.payer.identification.type;
      if (type === 'CPF' && !/^[0-9]{11}$/.test(value.replace(/[^0-9]/g, ''))) {
        throw new Error('CPF inválido');
      }
      if (type === 'CNPJ' && !/^[0-9]{14}$/.test(value.replace(/[^0-9]/g, ''))) {
        throw new Error('CNPJ inválido');
      }
      return true;
    }),
];

// Criar pagamento PIX
router.post('/pix', authenticate, createPixPaymentValidation, async (req: AuthenticatedRequest, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().reduce((acc, error) => {
        const field = error.path;
        if (!acc[field]) acc[field] = [];
        acc[field].push(error.msg);
        return acc;
      }, {} as Record<string, string[]>);
      
      throw new ValidationError(errorMessages);
    }

    const { orderId, amount, description, payer } = req.body;

    // Verificar se o pedido existe e pertence ao usuário
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: req.user!.id,
        deletedAt: null,
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new NotFoundError('Pedido');
    }

    // Verificar se o valor corresponde ao valor do pedido
    const orderTotal = order.totalAmount;
    if (Math.abs(amount - orderTotal) > 0.01) {
      throw new AppError('Valor do pagamento não corresponde ao valor do pedido', 400);
    }

    // Verificar se já existe pagamento em andamento
    const existingPayment = await prisma.payment.findFirst({
      where: {
        orderId,
        status: {
          in: ['PENDING', 'PROCESSING'],
        },
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (existingPayment) {
      throw new AppError('Já existe um pagamento em andamento para este pedido', 400);
    }

    // Criar pagamento PIX
    const pixPayment = await paymentService.createPixPayment({
      orderId,
      amount,
      description,
      payer: {
        email: payer.email,
        firstName: payer.firstName,
        lastName: payer.lastName,
        identification: {
          type: payer.identification.type,
          number: payer.identification.number.replace(/[^0-9]/g, ''),
        },
      },
    });

    logger.info('Pagamento PIX criado', {
      userId: req.user!.id,
      orderId,
      paymentId: pixPayment.id,
      amount,
    });

    res.json({
      success: true,
      data: {
        paymentId: pixPayment.id,
        qrCode: pixPayment.qrCode,
        qrCodeBase64: pixPayment.qrCodeBase64,
        ticketUrl: pixPayment.ticketUrl,
        expiresAt: pixPayment.expiresAt,
        status: pixPayment.status,
      },
      message: 'Pagamento PIX criado com sucesso',
    });

  } catch (error) {
    next(error);
  }
});

// Verificar status do pagamento
router.get('/status/:paymentId', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { paymentId } = req.params;

    // Verificar se o pagamento existe e pertence ao usuário
    const payment = await prisma.payment.findFirst({
      where: {
        externalId: paymentId,
        order: {
          userId: req.user!.id,
        },
      },
      include: {
        order: {
          select: {
            id: true,
            totalAmount: true,
            status: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundError('Pagamento');
    }

    res.json({
      success: true,
      data: {
        paymentId: payment.externalId,
        orderId: payment.orderId,
        amount: payment.amount,
        status: payment.status,
        paidAt: payment.paidAt,
        expiresAt: payment.expiresAt,
        qrCode: payment.qrCode,
        qrCodeBase64: payment.qrCodeBase64,
        ticketUrl: payment.ticketUrl,
        order: payment.order,
      },
    });

  } catch (error) {
    next(error);
  }
});

// Webhook para notificações do Mercado Pago
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res, next) => {
  try {
    // Verificar assinatura do webhook
    const signature = req.headers['x-signature'] as string;
    const payload = req.body;

    if (!signature) {
      logger.warn('Webhook sem assinatura');
      return res.status(400).json({ error: 'Assinatura ausente' });
    }

    // Verificar assinatura (implementar validação completa)
    const isValidSignature = await this.validateWebhookSignature(signature, payload);
    
    if (!isValidSignature) {
      logger.warn('Assinatura do webhook inválida');
      return res.status(401).json({ error: 'Assinatura inválida' });
    }

    const webhookData = JSON.parse(payload.toString());

    logger.info('Webhook recebido', {
      type: webhookData.type,
      paymentId: webhookData.data?.id,
      action: webhookData.action,
    });

    // Processar webhook
    await paymentService.processWebhook(webhookData);

    res.status(200).json({ success: true });

  } catch (error) {
    logger.error('Erro ao processar webhook', error);
    next(error);
  }
});

// Método privado para validar assinatura do webhook
async function validateWebhookSignature(signature: string, payload: Buffer): Promise<boolean> {
  try {
    // Implementar validação de assinatura do Mercado Pago
    // Por enquanto, retornar true para desenvolvimento
    // Em produção, implementar validação completa com certificado
    return true;
  } catch (error) {
    logger.error('Erro ao validar assinatura do webhook', error);
    return false;
  }
}

// Cancelar pagamento
router.delete('/:paymentId', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { paymentId } = req.params;

    // Verificar se o pagamento existe e pertence ao usuário
    const payment = await prisma.payment.findFirst({
      where: {
        externalId: paymentId,
        order: {
          userId: req.user!.id,
        },
        status: 'PENDING',
      },
    });

    if (!payment) {
      throw new NotFoundError('Pagamento');
    }

    // Atualizar status para cancelado
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    logger.info('Pagamento cancelado', {
      userId: req.user!.id,
      paymentId,
      orderId: payment.orderId,
    });

    res.json({
      success: true,
      message: 'Pagamento cancelado com sucesso',
    });

  } catch (error) {
    next(error);
  }
});

// Listar pagamentos do usuário
router.get('/my-payments', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;

    const skip = (page - 1) * limit;

    const where: any = {
      order: {
        userId: req.user!.id,
      },
    };

    if (status) {
      where.status = status;
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        select: {
          id: true,
          externalId: true,
          orderId: true,
          amount: true,
          method: true,
          status: true,
          paidAt: true,
          expiresAt: true,
          createdAt: true,
          order: {
            select: {
              id: true,
              totalAmount: true,
              status: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.payment.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: payments,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });

  } catch (error) {
    next(error);
  }
});

export { router as paymentRouter };