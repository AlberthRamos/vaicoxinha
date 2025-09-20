const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const amqp = require('amqplib');

dotenv.config();

const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 }
}, { _id: false });
const orderSchema = new mongoose.Schema({
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'paid', 'preparing', 'out_for_delivery', 'difficulty', 'delivered', 'cancelled'], default: 'pending' },
  customer: {
    name: String,
    phone: String,
    address: String,
    location: { lat: Number, lng: Number }
  },
  payment: {
    method: { type: String, enum: ['pix', 'card'], required: true },
    mpPaymentId: String,
    mpPreferenceId: String
  },
  termsAccepted: { type: Boolean, required: true },
  notes: String
}, { timestamps: true });
const Order = mongoose.model('Order', orderSchema);

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

// Consumir eventos de pagamento e atualizar status
(async () => {
  try {
    const conn = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost:5672');
    const ch = await conn.createChannel();
    await ch.assertExchange('order_events', 'fanout', { durable: true });
    const q = await ch.assertQueue('orders-service-events', { durable: true });
    await ch.bindQueue(q.queue, 'order_events', '');
    ch.consume(q.queue, async (msg) => {
      if (!msg) return;
      try {
        const data = JSON.parse(msg.content.toString());
        if (data.event === 'payment_paid' && data.payload?.orderId) {
          await Order.findByIdAndUpdate(data.payload.orderId, { status: 'paid' });
        }
      } catch (e) {}
      ch.ack(msg);
    });
  } catch (err) {
    console.warn('Orders consumer não iniciado:', err.message);
  }
})();

app.get('/health', (_req, res) => res.json({ ok: true }));

// Listar pedidos (admin simples)
const authAdmin = (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    jwt.verify(token, process.env.JWT_SECRET || 'dev');
    next();
  } catch { return res.status(401).json({ message: 'Unauthorized' }); }
};

app.get('/', authAdmin, async (_req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).limit(100);
    res.json(orders);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Criar pedido
app.post('/', [
  body('items').isArray({ min: 1 }),
  body('totalAmount').isFloat({ min: 0 }),
  body('payment.method').isIn(['pix', 'card']),
  body('termsAccepted').isBoolean().custom(v => v === true)
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const order = new Order({ ...req.body, termsAccepted: true });
    await order.save();
    publishEvent('order_created', { id: order._id.toString(), status: order.status });
    res.status(201).json(order);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Buscar pedido
app.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado' });
    res.json(order);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Atualizar status
app.patch('/:id/status', authAdmin, [body('status').isIn(['preparing', 'out_for_delivery', 'difficulty', 'delivered', 'cancelled'])], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado' });
    publishEvent('order_status_updated', { id: order._id.toString(), status: order.status });
    res.json(order);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Simular rota e eventos
app.post('/simulate/:id', authAdmin, async (req, res) => {
  const id = req.params.id;
  const sequence = ['preparing', 'out_for_delivery', Math.random() < 0.3 ? 'difficulty' : 'out_for_delivery', 'delivered'];
  let delay = 1000;
  sequence.forEach((st, idx) => {
    setTimeout(async () => {
      try {
        const order = await Order.findByIdAndUpdate(id, { status: st }, { new: true });
        if (order) publishEvent('order_status_updated', { id: order._id.toString(), status: order.status });
      } catch {}
    }, delay);
    delay += (idx === 1 ? 8000 : 5000);
  });
  res.json({ started: true });
});

const PORT = process.env.PORT || 4002;
(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/vai-coxinha');
    try {
      const conn = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost:5672');
      amqpChannel = await conn.createChannel();
      await amqpChannel.assertExchange('order_events', 'fanout', { durable: true });
      console.log('Orders service conectado RabbitMQ');
    } catch (err) { console.warn('RabbitMQ indisponível (orders):', err.message); }
    app.listen(PORT, () => console.log(`Orders service na porta ${PORT}`));
  } catch (err) {
    console.error('Falha ao iniciar orders-service', err);
    process.exit(1);
  }
})();


