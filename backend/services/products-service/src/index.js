const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const amqp = require('amqplib');

dotenv.config();

const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  image: { type: String, required: true },
  category: { type: String, enum: ['coxinha', 'combo', 'bebida'], default: 'coxinha' },
  isOffer: { type: Boolean, default: false },
  offerPrice: { type: Number, min: 0 },
  offerDescription: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
productSchema.index({ category: 1, isActive: 1 });
const Product = mongoose.model('Product', productSchema);

// Seed inicial
async function ensureSeed() {
  const count = await Product.countDocuments();
  if (count > 0) return;
  await Product.insertMany([
    { name: 'Coxinha Tradicional', description: 'Frango cremoso', price: 3.5, image: '/logo.png', category: 'coxinha' },
    { name: 'Coxinha Catupiry', description: 'Frango com catupiry', price: 4.5, image: '/logo.png', category: 'coxinha' },
    { name: 'Coxinha Queijo', description: 'Queijo derretido', price: 4.0, image: '/logo.png', category: 'coxinha' },
    { name: 'Coxinha Calabresa', description: 'Levemente apimentada', price: 4.2, image: '/logo.png', category: 'coxinha' },
    { name: 'Coxinha Veggie', description: 'Recheio vegetal', price: 4.0, image: '/logo.png', category: 'coxinha' },
    { name: 'Coxinha Bacon', description: 'Frango e bacon', price: 4.8, image: '/logo.png', category: 'coxinha' },
    { name: 'Coxinha Doce de Leite', description: 'Experiência doce', price: 5.0, image: '/logo.png', category: 'coxinha' },
    { name: 'Oferta 1: 3 coxinhas + refri', description: 'R$9,90', price: 9.9, image: '/logo.png', category: 'combo', isOffer: true, offerPrice: 9.9, offerDescription: '3 coxinhas + refri R$9,90' },
    { name: 'Oferta 2: 5 coxinhas + refri', description: 'R$12,90', price: 12.9, image: '/logo.png', category: 'combo', isOffer: true, offerPrice: 12.9, offerDescription: '5 coxinhas + refri R$12,90' }
  ]);
}

app.get('/health', (_req, res) => res.json({ ok: true }));

// Listar produtos
app.get('/', async (req, res) => {
  try {
    const { category, isOffer } = req.query;
    const query = { isActive: true };
    if (category) query.category = category;
    if (isOffer !== undefined) query.isOffer = isOffer === 'true';
    const products = await Product.find(query).sort({ isOffer: -1, createdAt: -1 });
    res.json(products);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Criar produto (admin)
app.post('/', [
  body('name').isString().isLength({ min: 1 }),
  body('description').isString().isLength({ min: 1 }),
  body('price').isFloat({ min: 0 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

const PORT = process.env.PORT || 4001;
(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/vai-coxinha');
    await ensureSeed();
    // RabbitMQ touch
    try {
      const conn = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost:5672');
      const ch = await conn.createChannel();
      await ch.assertExchange('order_events', 'fanout', { durable: true });
      console.log('Products service conectado RabbitMQ');
    } catch (err) {
      console.warn('RabbitMQ indisponível (products):', err.message);
    }
    app.listen(PORT, () => console.log(`Products service na porta ${PORT}`));
  } catch (err) {
    console.error('Falha ao iniciar products-service', err);
    process.exit(1);
  }
})();


