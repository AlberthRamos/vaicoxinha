import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

// Importar rotas
import orderRoutes from './routes/orderRoutes';
import leadRoutes from './routes/leadRoutes';
import customerRoutes from './routes/customerRoutes';
import paymentRoutes from './routes/paymentRoutes';

// Importar configuração do banco
import { connectDatabase } from './config/database';

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || 'localhost';

// Middleware de segurança
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Middleware de compressão
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Muitas requisições deste IP, tente novamente mais tarde.',
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Rotas da API
app.use('/api/orders', orderRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/payments', paymentRoutes);

// Rota de teste
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API Vai Coxinha com MongoDB está funcionando!',
    endpoints: {
      orders: '/api/orders',
      leads: '/api/leads',
      health: '/health'
    }
  });
});

// Tratamento de erros
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Erro:', err);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Erro interno do servidor',
      status: err.status || 500,
      timestamp: new Date().toISOString()
    }
  });
});

// Rota 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      message: 'Rota não encontrada',
      path: req.originalUrl,
      timestamp: new Date().toISOString()
    }
  });
});

// Iniciar servidor com MongoDB em memória
async function startServer() {
  try {
    console.log('🚀 Iniciando servidor com MongoDB em memória...');
    
    // Iniciar MongoDB em memória para desenvolvimento
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    console.log(`📦 MongoDB em memória iniciado: ${uri}`);
    
    // Conectar ao MongoDB
    await mongoose.connect(uri);
    console.log('✅ Conectado ao MongoDB em memória');
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🍗 Servidor Vai Coxinha rodando em http://${HOST}:${PORT}`);
      console.log(`📋 Health check: http://${HOST}:${PORT}/health`);
      console.log(`🧪 Teste da API: http://${HOST}:${PORT}/api/test`);
      console.log(`📊 API de Pedidos: http://${HOST}:${PORT}/api/orders`);
      console.log(`🎯 API de Leads: http://${HOST}:${PORT}/api/leads`);
      console.log('\n📖 Documentação completa em README-MONGODB.md');
    });

  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Iniciar servidor
startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM recebido, encerrando gracefulmente...');
  await mongoose.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 SIGINT recebido, encerrando gracefulmente...');
  await mongoose.disconnect();
  process.exit(0);
});