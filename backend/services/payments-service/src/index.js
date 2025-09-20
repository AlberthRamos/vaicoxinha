const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const dotenv = require('dotenv');
const mercadopago = require('mercadopago');
const amqp = require('amqplib');

dotenv.config();

const app = express();
app.use(helmet());
app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));

if (process.env.MERCADOPAGO_TOKEN) {
  mercadopago.configurations.setAccessToken(process.env.MERCADOPAGO_TOKEN);
}

let amqpChannel;
async function publishEvent(event, payload) {
  try {
    if (!amqpChannel) return;
    const exch = 'order_events';
    await amqpChannel.assertExchange(exch, 'fanout', { durable: true });
    amqpChannel.publish(exch, '', Buffer.from(JSON.stringify({ event, payload, at: Date.now() })));
  } catch (err) {
    console.warn('Falha ao publicar evento:', err.message);
  }
}

app.get('/health', (_req, res) => res.json({ ok: true }));

// Criar pagamento PIX
app.post('/pix', async (req, res) => {
  try {
    if (!process.env.MERCADOPAGO_TOKEN) return res.status(500).json({ message: 'MERCADOPAGO_TOKEN não configurado' });
    const { amount, description } = req.body;
    const result = await mercadopago.payment.create({
      transaction_amount: amount,
      description: description || 'Vai Coxinha - Pedido',
      payment_method_id: 'pix',
      payer: { email: 'cliente@example.com' }
    });
    publishEvent('payment_created', { method: 'pix', id: result.body.id, status: result.body.status });
    res.json(result.body);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Criar pagamento cartão (preference)
app.post('/card', async (req, res) => {
  try {
    if (!process.env.MERCADOPAGO_TOKEN) return res.status(500).json({ message: 'MERCADOPAGO_TOKEN não configurado' });
    const preference = {
      items: req.body.items || [{ title: 'Vai Coxinha', quantity: 1, currency_id: 'BRL', unit_price: req.body.amount || 10 }]
    };
    const result = await mercadopago.preferences.create(preference);
    publishEvent('payment_preference_created', { id: result.body.id });
    res.json(result.body);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Webhook
app.post('/webhook', async (req, res) => {
  publishEvent('payment_webhook', req.body);
  res.sendStatus(200);
});

const PORT = process.env.PORT || 4003;
(async () => {
  try {
    try {
      const conn = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost:5672');
      amqpChannel = await conn.createChannel();
      await amqpChannel.assertExchange('order_events', 'fanout', { durable: true });
      console.log('Payments service conectado RabbitMQ');
    } catch (err) { console.warn('RabbitMQ indisponível (payments):', err.message); }
    app.listen(PORT, () => console.log(`Payments service na porta ${PORT}`));
  } catch (err) {
    console.error('Falha ao iniciar payments-service', err);
    process.exit(1);
  }
})();


