import { Router } from 'express';
import {
  createOrder,
  checkFirstOrder,
  getCustomerHistory,
  getOrderById,
  getOrders,
  updateOrderStatus,
  updatePaymentStatus,
  getOrderStatistics
} from '../controllers/orderController';

const router = Router();

// Rotas de pedidos
router.post('/', createOrder);
router.get('/', getOrders);
router.get('/check-first', checkFirstOrder);
router.get('/statistics', getOrderStatistics);
router.get('/:orderId', getOrderById);
router.put('/:orderId/status', updateOrderStatus);
router.put('/:orderId/payment-status', updatePaymentStatus);

// Rotas de histórico do cliente
router.get('/customers/:cpf/history', getCustomerHistory);

export default router;