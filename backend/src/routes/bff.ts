import { Router } from 'express';
import BFFController from '@/controllers/bffController';
import { auth } from '@/middlewares/auth';
import { rateLimiter } from '@/middlewares/rateLimiter';
import { validateRequest } from '@/middlewares/validation';
import { query } from 'express-validator';

const router = Router();
const bffController = new BFFController();

/**
 * @swagger
 * /bff/dashboard:
 *   get:
 *     summary: Obter dados do dashboard
 *     description: Retorna dados agregados para o dashboard administrativo
 *     tags: [BFF]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do dashboard
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 summary:
 *                   type: object
 *                 recentOrders:
 *                   type: array
 *                 topProducts:
 *                   type: array
 *                 salesChart:
 *                   type: object
 *                 userGrowth:
 *                   type: object
 */
router.get('/dashboard', auth, rateLimiter(), bffController.getDashboardOverview);

/**
 * @swagger
 * /bff/profile:
 *   get:
 *     summary: Obter dados do perfil do usuário
 *     description: Retorna dados completos do perfil do usuário logado
 *     tags: [BFF]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do perfil
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 profile:
 *                   type: object
 *                 orders:
 *                   type: array
 *                 addresses:
 *                   type: array
 *                 paymentMethods:
 *                   type: array
 *                 preferences:
 *                   type: object
 *                 stats:
 *                   type: object
 */
router.get('/profile', auth, rateLimiter(), bffController.getUserProfileData);

/**
 * @swagger
 * /bff/catalog:
 *   get:
 *     summary: Obter catálogo de produtos
 *     description: Retorna catálogo de produtos com filtros e paginação
 *     tags: [BFF]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número da página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Limite de itens por página
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: ID da categoria
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Termo de busca
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, price, createdAt]
 *           default: name
 *         description: Campo para ordenação
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Ordem de ordenação
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Preço mínimo
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Preço máximo
 *       - in: query
 *         name: inStock
 *         schema:
 *           type: boolean
 *         description: Apenas produtos em estoque
 *     responses:
 *       200:
 *         description: Catálogo de produtos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                 pagination:
 *                   type: object
 *                 filters:
 *                   type: object
 */
router.get('/catalog', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('category').optional().isUUID(),
  query('search').optional().isString().trim(),
  query('sortBy').optional().isIn(['name', 'price', 'createdAt']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('inStock').optional().isBoolean(),
  validateRequest,
], rateLimiter(), bffController.getProductCatalog);

/**
 * @swagger
 * /bff/cart:
 *   get:
 *     summary: Obter dados do carrinho
 *     description: Retorna dados do carrinho do usuário
 *     tags: [BFF]
 *     responses:
 *       200:
 *         description: Dados do carrinho
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                 subtotal:
 *                   type: number
 *                 shipping:
 *                   type: number
 *                 total:
 *                   type: number
 *                 itemCount:
 *                   type: number
 */
router.get('/cart', rateLimiter(), bffController.getCartData);

/**
 * @swagger
 * /bff/checkout:
 *   get:
 *     summary: Obter dados do checkout
 *     description: Retorna dados necessários para o checkout
 *     tags: [BFF]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do checkout
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 addresses:
 *                   type: array
 *                 paymentMethods:
 *                   type: array
 *                 shippingOptions:
 *                   type: array
 *                 availablePaymentTypes:
 *                   type: array
 *                 installments:
 *                   type: array
 */
router.get('/checkout', auth, rateLimiter(), bffController.getCheckoutData);

/**
 * @swagger
 * /bff/search/suggestions:
 *   get:
 *     summary: Obter sugestões de pesquisa
 *     description: Retorna sugestões de pesquisa baseadas no termo
 *     tags: [BFF]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Termo de pesquisa
 *     responses:
 *       200:
 *         description: Sugestões de pesquisa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                 categories:
 *                   type: array
 */
router.get('/search/suggestions', [
  query('q').isString().trim().isLength({ min: 1, max: 100 }),
  validateRequest,
], rateLimiter(), bffController.getSearchSuggestions);

export default router;