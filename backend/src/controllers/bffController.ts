import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/database/prisma';
import { AppError } from '@/utils/AppError';
import { logger } from '@/utils/logger';
import { validateRequest } from '@/middlewares/validation';
import { body, param, query } from 'express-validator';
import { cache } from '@/utils/cache';
import { rateLimiter } from '@/middlewares/rateLimiter';
import { auth } from '@/middlewares/auth';

// Interface para dados agregados do dashboard
interface DashboardData {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    totalUsers: number;
    totalProducts: number;
    avgOrderValue: number;
    conversionRate: number;
  };
  recentOrders: any[];
  topProducts: any[];
  salesChart: {
    labels: string[];
    data: number[];
  };
  userGrowth: {
    labels: string[];
    data: number[];
  };
}

// Interface para dados do usuário logado
interface UserProfileData {
  profile: any;
  orders: any[];
  addresses: any[];
  paymentMethods: any[];
  preferences: any;
  stats: {
    totalOrders: number;
    totalSpent: number;
    avgOrderValue: number;
  };
}

export class BFFController {
  /**
   * Dashboard Overview - Dados principais para o dashboard
   */
  async getDashboardOverview(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const cacheKey = 'dashboard:overview';
      const cachedData = await cache.get(cacheKey);

      if (cachedData) {
        res.json(cachedData);
        return;
      }

      const [summary, recentOrders, topProducts, salesData, userGrowthData] = await Promise.all([
        this.getDashboardSummary(),
        this.getRecentOrders(10),
        this.getTopProducts(10),
        this.getSalesChartData(30),
        this.getUserGrowthData(30),
      ]);

      const dashboardData: DashboardData = {
        summary,
        recentOrders,
        topProducts,
        salesChart: salesData,
        userGrowth: userGrowthData,
      };

      // Cache por 5 minutos
      await cache.set(cacheKey, dashboardData, 300);

      res.json(dashboardData);
    } catch (error) {
      logger.error('Erro ao buscar dados do dashboard', { error });
      next(new AppError('Erro ao buscar dados do dashboard', 500));
    }
  }

  /**
   * User Profile Data - Dados completos do perfil do usuário
   */
  async getUserProfileData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user.id;
      const cacheKey = `user:profile:${userId}`;
      const cachedData = await cache.get(cacheKey);

      if (cachedData) {
        res.json(cachedData);
        return;
      }

      const [profile, orders, addresses, paymentMethods, preferences, stats] = await Promise.all([
        this.getUserProfile(userId),
        this.getUserOrders(userId, 10),
        this.getUserAddresses(userId),
        this.getUserPaymentMethods(userId),
        this.getUserPreferences(userId),
        this.getUserStats(userId),
      ]);

      const userData: UserProfileData = {
        profile,
        orders,
        addresses,
        paymentMethods,
        preferences,
        stats,
      };

      // Cache por 10 minutos
      await cache.set(cacheKey, userData, 600);

      res.json(userData);
    } catch (error) {
      logger.error('Erro ao buscar dados do perfil do usuário', { userId: req.user.id, error });
      next(new AppError('Erro ao buscar dados do perfil', 500));
    }
  }

  /**
   * Product Catalog - Catálogo otimizado de produtos
   */
  async getProductCatalog(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { 
        page = 1, 
        limit = 20, 
        category, 
        search, 
        sortBy = 'name', 
        sortOrder = 'asc',
        minPrice,
        maxPrice,
        inStock
      } = req.query;

      const cacheKey = `catalog:${JSON.stringify(req.query)}`;
      const cachedData = await cache.get(cacheKey);

      if (cachedData) {
        res.json(cachedData);
        return;
      }

      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {
        isActive: true,
      };

      if (category) {
        where.categoryId = category;
      }

      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) where.price.gte = Number(minPrice);
        if (maxPrice) where.price.lte = Number(maxPrice);
      }

      if (inStock === 'true') {
        where.stock = { gt: 0 };
      }

      const orderBy: any = {};
      orderBy[sortBy as string] = sortOrder as 'asc' | 'desc';

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          skip,
          take: Number(limit),
          orderBy,
          include: {
            category: true,
            images: true,
            _count: {
              select: {
                orderItems: true,
                reviews: true,
              },
            },
          },
        }),
        prisma.product.count({ where }),
      ]);

      const catalogData = {
        products,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
        filters: {
          categories: await this.getCategories(),
          priceRange: await this.getPriceRange(),
        },
      };

      // Cache por 2 minutos
      await cache.set(cacheKey, catalogData, 120);

      res.json(catalogData);
    } catch (error) {
      logger.error('Erro ao buscar catálogo de produtos', { error });
      next(new AppError('Erro ao buscar catálogo', 500));
    }
  }

  /**
   * Cart Data - Dados do carrinho otimizados
   */
  async getCartData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const sessionId = req.session?.id;

      if (!userId && !sessionId) {
        res.json({ items: [], total: 0, subtotal: 0, shipping: 0 });
        return;
      }

      const cacheKey = `cart:${userId || sessionId}`;
      const cachedData = await cache.get(cacheKey);

      if (cachedData) {
        res.json(cachedData);
        return;
      }

      const where: any = {};
      if (userId) {
        where.userId = userId;
      } else {
        where.sessionId = sessionId;
      }

      const cart = await prisma.cart.findFirst({
        where,
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: true,
                },
              },
            },
          },
        },
      });

      if (!cart) {
        const emptyCart = { items: [], total: 0, subtotal: 0, shipping: 0 };
        await cache.set(cacheKey, emptyCart, 300);
        res.json(emptyCart);
        return;
      }

      const subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const shipping = subtotal > 100 ? 0 : 15; // Frete grátis acima de R$100
      const total = subtotal + shipping;

      const cartData = {
        items: cart.items,
        subtotal,
        shipping,
        total,
        itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
      };

      // Cache por 5 minutos
      await cache.set(cacheKey, cartData, 300);

      res.json(cartData);
    } catch (error) {
      logger.error('Erro ao buscar dados do carrinho', { userId: req.user?.id, error });
      next(new AppError('Erro ao buscar carrinho', 500));
    }
  }

  /**
   * Checkout Data - Dados necessários para o checkout
   */
  async getCheckoutData(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user.id;

      const [addresses, paymentMethods, shippingOptions] = await Promise.all([
        this.getUserAddresses(userId),
        this.getUserPaymentMethods(userId),
        this.getShippingOptions(),
      ]);

      const checkoutData = {
        addresses,
        paymentMethods,
        shippingOptions,
        availablePaymentTypes: ['credit_card', 'debit_card', 'pix', 'boleto'],
        installments: this.getInstallmentOptions(),
      };

      res.json(checkoutData);
    } catch (error) {
      logger.error('Erro ao buscar dados do checkout', { userId: req.user.id, error });
      next(new AppError('Erro ao buscar dados do checkout', 500));
    }
  }

  /**
   * Search Suggestions - Sugestões de pesquisa otimizadas
   */
  async getSearchSuggestions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { q } = req.query;

      if (!q || typeof q !== 'string') {
        res.json([]);
        return;
      }

      const cacheKey = `search:suggestions:${q.toLowerCase()}`;
      const cachedData = await cache.get(cacheKey);

      if (cachedData) {
        res.json(cachedData);
        return;
      }

      const suggestions = await Promise.all([
        // Sugestões de produtos
        prisma.product.findMany({
          where: {
            name: { contains: q, mode: 'insensitive' },
            isActive: true,
          },
          select: { id: true, name: true, category: { select: { name: true } } },
          take: 5,
        }),
        // Sugestões de categorias
        prisma.category.findMany({
          where: {
            name: { contains: q, mode: 'insensitive' },
            isActive: true,
          },
          select: { id: true, name: true },
          take: 3,
        }),
      ]);

      const [products, categories] = suggestions;

      const searchData = {
        products: products.map(p => ({ type: 'product', id: p.id, name: p.name, category: p.category?.name })),
        categories: categories.map(c => ({ type: 'category', id: c.id, name: c.name })),
      };

      // Cache por 10 minutos
      await cache.set(cacheKey, searchData, 600);

      res.json(searchData);
    } catch (error) {
      logger.error('Erro ao buscar sugestões de pesquisa', { query: req.query.q, error });
      next(new AppError('Erro ao buscar sugestões', 500));
    }
  }

  // Métodos auxiliares privados
  private async getDashboardSummary(): Promise<any> {
    const [orders, users, products, revenue] = await Promise.all([
      prisma.order.count(),
      prisma.user.count(),
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.aggregate({
        where: { status: 'PAID' },
        _sum: { total: true },
      }),
    ]);

    const avgOrderValue = orders > 0 ? (revenue._sum.total || 0) / orders : 0;
    const conversionRate = users > 0 ? (orders / users) * 100 : 0;

    return {
      totalRevenue: revenue._sum.total || 0,
      totalOrders: orders,
      totalUsers: users,
      totalProducts: products,
      avgOrderValue,
      conversionRate,
    };
  }

  private async getRecentOrders(limit: number): Promise<any[]> {
    return prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: {
          select: {
            quantity: true,
            price: true,
            product: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  private async getTopProducts(limit: number): Promise<any[]> {
    return prisma.product.findMany({
      where: { isActive: true },
      orderBy: { orderItems: { _count: 'desc' } },
      take: limit,
      include: {
        category: { select: { name: true } },
        images: { take: 1 },
        _count: {
          select: {
            orderItems: true,
            reviews: true,
          },
        },
      },
    });
  }

  private async getSalesChartData(days: number): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const salesData = await prisma.order.groupBy({
      by: ['createdAt'],
      where: {
        status: 'PAID',
        createdAt: { gte: startDate },
      },
      _sum: { total: true },
      orderBy: { createdAt: 'asc' },
    });

    // Agrupar por dia
    const dailySales = salesData.reduce((acc, sale) => {
      const date = sale.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + (sale._sum.total || 0);
      return acc;
    }, {} as Record<string, number>);

    const labels = Object.keys(dailySales).sort();
    const data = labels.map(label => dailySales[label]);

    return { labels, data };
  }

  private async getUserGrowthData(days: number): Promise<any> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const userData = await prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: { gte: startDate },
      },
      _count: { id: true },
      orderBy: { createdAt: 'asc' },
    });

    // Agrupar por dia
    const dailyUsers = userData.reduce((acc, user) => {
      const date = user.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + user._count.id;
      return acc;
    }, {} as Record<string, number>);

    const labels = Object.keys(dailyUsers).sort();
    const data = labels.map(label => dailyUsers[label]);

    return { labels, data };
  }

  private async getUserProfile(userId: string): Promise<any> {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  private async getUserOrders(userId: string, limit: number): Promise<any[]> {
    return prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, images: { take: 1 } } },
          },
        },
      },
    });
  }

  private async getUserAddresses(userId: string): Promise<any[]> {
    return prisma.address.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' },
    });
  }

  private async getUserPaymentMethods(userId: string): Promise<any[]> {
    return prisma.paymentMethod.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  private async getUserPreferences(userId: string): Promise<any> {
    return prisma.userPreference.findUnique({
      where: { userId },
    });
  }

  private async getUserStats(userId: string): Promise<any> {
    const [orders, totalSpent] = await Promise.all([
      prisma.order.count({ where: { userId } }),
      prisma.order.aggregate({
        where: { userId, status: 'PAID' },
        _sum: { total: true },
      }),
    ]);

    const avgOrderValue = orders > 0 ? (totalSpent._sum.total || 0) / orders : 0;

    return {
      totalOrders: orders,
      totalSpent: totalSpent._sum.total || 0,
      avgOrderValue,
    };
  }

  private async getCategories(): Promise<any[]> {
    return prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  private async getPriceRange(): Promise<{ min: number; max: number }> {
    const result = await prisma.product.aggregate({
      where: { isActive: true },
      _min: { price: true },
      _max: { price: true },
    });

    return {
      min: result._min.price || 0,
      max: result._max.price || 1000,
    };
  }

  private async getShippingOptions(): Promise<any[]> {
    return [
      { id: 'standard', name: 'Padrão', price: 15, estimatedDays: 5 },
      { id: 'express', name: 'Expresso', price: 25, estimatedDays: 2 },
      { id: 'overnight', name: 'Entrega no dia seguinte', price: 45, estimatedDays: 1 },
    ];
  }

  private getInstallmentOptions(): any[] {
    return [
      { installments: 1, interest: 0 },
      { installments: 2, interest: 0 },
      { installments: 3, interest: 0 },
      { installments: 4, interest: 2.5 },
      { installments: 5, interest: 2.5 },
      { installments: 6, interest: 2.5 },
      { installments: 7, interest: 3.5 },
      { installments: 8, interest: 3.5 },
      { installments: 9, interest: 3.5 },
      { installments: 10, interest: 4.5 },
      { installments: 11, interest: 4.5 },
      { installments: 12, interest: 4.5 },
    ];
  }
}

// Rotas do BFF
export const bffRoutes = [
  {
    method: 'get',
    path: '/bff/dashboard',
    middleware: [auth, rateLimiter()],
    handler: 'getDashboardOverview',
  },
  {
    method: 'get',
    path: '/bff/profile',
    middleware: [auth, rateLimiter()],
    handler: 'getUserProfileData',
  },
  {
    method: 'get',
    path: '/bff/catalog',
    middleware: [rateLimiter()],
    handler: 'getProductCatalog',
  },
  {
    method: 'get',
    path: '/bff/cart',
    middleware: [rateLimiter()],
    handler: 'getCartData',
  },
  {
    method: 'get',
    path: '/bff/checkout',
    middleware: [auth, rateLimiter()],
    handler: 'getCheckoutData',
  },
  {
    method: 'get',
    path: '/bff/search/suggestions',
    middleware: [rateLimiter()],
    handler: 'getSearchSuggestions',
  },
];

export default new BFFController();