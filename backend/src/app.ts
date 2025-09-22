import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';

import { connectDatabase } from './config/database';
import orderRoutes from './routes/orderRoutes';
import leadRoutes from './routes/leadRoutes';
import customerRoutes from './routes/customerRoutes';
import paymentRoutes from './routes/paymentRoutes';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: 'MongoDB',
    uptime: process.uptime()
  });
});

// Rotas
app.use('/api/orders', orderRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/payments', paymentRoutes);

// Rota de teste
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API de Pedidos e Leads - Vai Coxinha',
    version: '1.0.0',
    endpoints: {
      orders: [
        'POST /api/orders - Criar pedido',
        'GET /api/orders - Listar pedidos',
        'GET /api/orders/check-first - Verificar primeiro pedido',
        'GET /api/orders/statistics - Estatísticas de pedidos',
        'GET /api/orders/:orderId - Obter pedido por ID',
        'PUT /api/orders/:orderId/status - Atualizar status',
        'PUT /api/orders/:orderId/payment-status - Atualizar status do pagamento',
        'GET /api/orders/customers/:cpf/history - Histórico do cliente'
      ],
      leads: [
        'POST /api/leads/process - Processar lead',
        'POST /api/leads/convert - Registrar conversão',
        'GET /api/leads/analytics - Análise de leads',
        'GET /api/leads - Listar leads',
        'GET /api/leads/:cpf - Obter lead por CPF',
        'PUT /api/leads/:cpf/status - Atualizar status do lead'
      ]
    }
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Ocorreu um erro no servidor'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Rota não encontrada',
    message: `A rota ${req.originalUrl} não existe`
  });
});

// Iniciar servidor
const startServer = async () => {
  try {
    // Conectar ao MongoDB
    await connectDatabase();
    
    // Iniciar servidor HTTP
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
      console.log(`📡 API disponível em http://localhost:${PORT}/api`);
      console.log(`🔍 Health check em http://localhost:${PORT}/health`);
      console.log(`📖 Documentação de teste em http://localhost:${PORT}/api/test`);
    });
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
};

// Iniciar o servidor
startServer();

export default app;