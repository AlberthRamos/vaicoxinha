import { Router } from 'express';
import { checkCustomerFirstOrder } from '../controllers/orderController';

const router = Router();

/**
 * @swagger
 * /customers/check:
 *   post:
 *     summary: Verificar se é o primeiro pedido do cliente
 *     description: Verifica se o cliente já fez pedidos anteriores baseado no CPF
 *     tags: [Customers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nome do cliente
 *               cpf:
 *                 type: string
 *                 description: CPF do cliente (apenas números)
 *     responses:
 *       200:
 *         description: Resultado da verificação
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     isFirstOrder:
 *                       type: boolean
 *                     criteria:
 *                       type: string
 *                     customerInfo:
 *                       type: object
 *       400:
 *         description: Dados inválidos
 *       500:
 *         description: Erro interno
 */
router.post('/check', checkCustomerFirstOrder);

export default router;