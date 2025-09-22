import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { logger } from '@/utils/logger';
import { errorHandler } from '@/middlewares/errorHandler';
import { notFoundHandler } from '@/middlewares/notFoundHandler';
import { authRouter } from '@/routes/auth';
import { userRouter } from '@/routes/users';
import { productRouter } from '@/routes/products';
import { orderRouter } from '@/routes/orders';
import { categoryRouter } from '@/routes/categories';
import { paymentRouter } from '@/routes/payments';
import { webhookRouter } from '@/routes/webhooks';
import bffRouter from '@/routes/bff';
import { RabbitMQService } from '@/services/rabbitmqService';
import { MessageProcessor } from '@/services/messageProcessor';
import { MonitoringService } from '@/services/monitoringService';
import { SecurityMonitor } from '@/services/securityMonitor';
import { securityMiddleware } from '@/middlewares/security';

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || 'localhost';

// Inicializar serviços
const rabbitMQService = RabbitMQService.getInstance();
const messageProcessor = MessageProcessor.getInstance();
const monitoringService = MonitoringService.getInstance();
const securityMonitor = SecurityMonitor.getInstance();

// Inicializar serviços assíncronos
async function initializeServices() {
  try {
    // Conectar ao RabbitMQ
    await rabbitMQService.connect();
    logger.info('✅ RabbitMQ conectado com sucesso');
    
    // Iniciar processamento de mensagens
    await messageProcessor.start();
    logger.info('✅ Processador de mensagens iniciado');
    
    // Iniciar monitoramento
    await monitoringService.start();
    logger.info('✅ Monitoramento iniciado');
    
    // Iniciar segurança
    await securityMonitor.start();
    logger.info('✅ Monitor de segurança iniciado');
    
  } catch (error) {
    logger.error('Erro ao inicializar serviços:', error);
    throw error;
  }
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    error: 'Muitas requisições deste IP, tente novamente mais tarde.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middlewares de segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: process.env.CORS_CREDENTIALS === 'true',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middlewares de segurança avançados
app.use(securityMiddleware.securityHeaders());
app.use(securityMiddleware.inputValidation());
app.use(securityMiddleware.sanitizeInput());
app.use(securityMonitor.middleware());

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/products', productRouter);
app.use('/api/orders', orderRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/webhooks', webhookRouter);
app.use('/api/bff', bffRouter);

// Static files
app.use('/uploads', express.static('uploads'));

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM recebido, encerrando servidor...');
  server.close(() => {
    logger.info('Servidor encerrado');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT recebido, encerrando servidor...');
  server.close(() => {
    logger.info('Servidor encerrado');
    process.exit(0);
  });
});

server.listen(PORT, async () => {
  logger.info(`🚀 Servidor rodando em http://${HOST}:${PORT}`);
  logger.info(`📊 Health check disponível em http://${HOST}:${PORT}/health`);
  logger.info(`🔧 Ambiente: ${process.env.NODE_ENV}`);
  
  // Inicializar serviços
  try {
    await initializeServices();
    logger.info('✅ Todos os serviços foram inicializados com sucesso');
  } catch (error) {
    logger.error('❌ Erro ao inicializar serviços:', error);
    process.exit(1);
  }
});

export default app;