const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const { createProxyMiddleware } = require('http-proxy-middleware');
const amqp = require('amqplib');

dotenv.config();

const app = express();
app.use(helmet());
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));

const limiter = rateLimit({ windowMs: 1 * 60 * 1000, max: 120 });
app.use(limiter);

const targetProducts = process.env.SERVICES_PRODUCTS_URL || 'http://localhost:4001';
const targetOrders = process.env.SERVICES_ORDERS_URL || 'http://localhost:4002';
const targetPayments = process.env.SERVICES_PAYMENTS_URL || 'http://localhost:4003';
const targetAdmin = process.env.SERVICES_ADMIN_URL || 'http://localhost:4004';

// Proxies
app.use('/api/products', createProxyMiddleware({
  target: targetProducts,
  changeOrigin: true,
  pathRewrite: { '^/api/products': '/' },
}));
app.use('/api/orders', createProxyMiddleware({
  target: targetOrders,
  changeOrigin: true,
  pathRewrite: { '^/api/orders': '/' },
}));
app.use('/api/payments', createProxyMiddleware({
  target: targetPayments,
  changeOrigin: true,
  pathRewrite: { '^/api/payments': '/' },
}));
app.use('/api/admin', createProxyMiddleware({
  target: targetAdmin,
  changeOrigin: true,
  pathRewrite: { '^/api/admin': '/' },
}));

app.get('/health', (_req, res) => res.json({ ok: true }));

// RabbitMQ connection (for future server-sent events / websockets bridge)
(async () => {
  try {
    const url = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
    const conn = await amqp.connect(url);
    const ch = await conn.createChannel();
    await ch.assertExchange('order_events', 'fanout', { durable: true });
    console.log('BFF conectado ao RabbitMQ');
  } catch (err) {
    console.error('Falha ao conectar RabbitMQ no BFF', err.message);
  }
})();

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`BFF ouvindo na porta ${PORT}`));


