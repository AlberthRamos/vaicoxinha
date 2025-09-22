import express from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '@/database/prisma';
import { AppError, ValidationError, NotFoundError } from '@/utils/AppError';
import { authenticate, authorize, AuthenticatedRequest } from '@/middlewares/auth';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Validações
const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres'),
  body('phone')
    .optional()
    .isMobilePhone('pt-BR')
    .withMessage('Telefone inválido'),
  body('address')
    .optional()
    .isObject()
    .withMessage('Endereço deve ser um objeto'),
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Senha atual é obrigatória'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Nova senha deve ter pelo menos 6 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Nova senha deve conter letras maiúsculas, minúsculas e números'),
];

// Listar usuários (Admin apenas)
router.get('/', authenticate, authorize(['ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const role = req.query.role as string;

    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          role: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: users,
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

// Obter usuário por ID
router.get('/:id', authenticate, authorize(['ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        emailVerified: true,
        address: true,
        lastAccessAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('Usuário');
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
});

// Atualizar perfil do usuário logado
router.put('/profile', authenticate, updateProfileValidation, async (req: AuthenticatedRequest, res, next) => {
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

    const { name, phone, address } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(address && { address }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        emailVerified: true,
        address: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: { user },
      message: 'Perfil atualizado com sucesso',
    });
  } catch (error) {
    next(error);
  }
});

// Alterar senha
router.put('/password', authenticate, changePasswordValidation, async (req: AuthenticatedRequest, res, next) => {
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

    const { currentPassword, newPassword } = req.body;

    // Buscar usuário com senha
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { password: true },
    });

    if (!user) {
      throw new NotFoundError('Usuário');
    }

    // Verificar senha atual
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isCurrentPasswordValid) {
      throw new AppError('Senha atual incorreta', 400, 'INVALID_CURRENT_PASSWORD');
    }

    // Hash da nova senha
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Atualizar senha
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { password: hashedPassword },
    });

    res.json({
      success: true,
      message: 'Senha alterada com sucesso',
    });
  } catch (error) {
    next(error);
  }
});

// Atualizar status do usuário (Admin apenas)
router.patch('/:id/status', authenticate, authorize(['ADMIN']), async (req: AuthenticatedRequest, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      throw new AppError('Status deve ser um booleano', 400, 'INVALID_STATUS');
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: { user },
      message: `Usuário ${isActive ? 'ativado' : 'desativado'} com sucesso`,
    });
  } catch (error) {
    next(error);
  }
});

// Estatísticas do usuário logado
router.get('/me/stats', authenticate, async (req: AuthenticatedRequest, res, next) => {
  try {
    const userId = req.user!.id;

    const [totalOrders, pendingOrders, completedOrders] = await Promise.all([
      prisma.order.count({
        where: { userId, deletedAt: null },
      }),
      prisma.order.count({
        where: { userId, status: 'PENDING', deletedAt: null },
      }),
      prisma.order.count({
        where: { 
          userId, 
          status: 'DELIVERED', 
          deletedAt: null 
        },
      }),
    ]);

    const totalSpent = await prisma.order.aggregate({
      where: { 
        userId, 
        paymentStatus: 'COMPLETED', 
        deletedAt: null 
      },
      _sum: {
        totalAmount: true,
      },
    });

    res.json({
      success: true,
      data: {
        totalOrders,
        pendingOrders,
        completedOrders,
        totalSpent: totalSpent._sum.totalAmount || 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as userRouter };