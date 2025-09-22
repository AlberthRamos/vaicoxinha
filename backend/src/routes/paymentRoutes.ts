import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController';

const router = Router();
const paymentController = new PaymentController();

/**
 * @route   POST /api/payments/card
 * @desc    Processa pagamento com cartão de crédito/débito
 * @access  Public
 */
router.post('/card', (req, res) => paymentController.processCardPayment(req, res));

/**
 * @route   POST /api/payments/pix
 * @desc    Processa pagamento com PIX
 * @access  Public
 */
router.post('/pix', (req, res) => paymentController.processPixPayment(req, res));

/**
 * @route   GET /api/payments/status/:paymentId
 * @desc    Consulta status do pagamento
 * @access  Public
 */
router.get('/status/:paymentId', (req, res) => paymentController.getPaymentStatus(req, res));

/**
 * @route   POST /api/payments/webhook
 * @desc    Processa webhook de notificação do Mercado Pago
 * @access  Public
 */
router.post('/webhook', (req, res) => paymentController.processWebhook(req, res));

/**
 * @route   GET /api/payments/methods
 * @desc    Obtém métodos de pagamento disponíveis
 * @access  Public
 */
router.get('/methods', (req, res) => paymentController.getPaymentMethods(req, res));

/**
 * @route   POST /api/payments/validate-card
 * @desc    Valida token de cartão
 * @access  Public
 */
router.post('/validate-card', (req, res) => paymentController.validateCardToken(req, res));

export default router;