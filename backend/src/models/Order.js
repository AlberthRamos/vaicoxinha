const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  items: { type: [orderItemSchema], required: true },
  totalAmount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['pending', 'paid', 'preparing', 'out_for_delivery', 'difficulty', 'delivered', 'cancelled'], default: 'pending' },
  customer: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    location: { lat: Number, lng: Number }
  },
  payment: {
    method: { type: String, enum: ['pix', 'card'], required: true },
    mpPaymentId: { type: String },
    mpPreferenceId: { type: String }
  },
  termsAccepted: { type: Boolean, required: true },
  notes: { type: String }
}, { timestamps: true });

orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);

const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    }
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  customer: {
    name: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    address: {
      street: { type: String, required: true },
      number: { type: String, required: true },
      complement: { type: String },
      neighborhood: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number }
      }
    }
  },
  payment: {
    method: {
      type: String,
      enum: ['pix', 'credit_card'],
      required: true
    },
    mercadoPagoId: {
      type: String
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    qrCode: {
      type: String
    },
    qrCodeBase64: {
      type: String
    }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled', 'delivery_issue'],
    default: 'pending'
  },
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String
  }],
  estimatedDeliveryTime: {
    type: Date
  },
  deliveryNotes: {
    type: String
  },
  trackingCode: {
    type: String,
    unique: true
  }
}, {
  timestamps: true
});

// Gerar código de rastreamento único
orderSchema.pre('save', function(next) {
  if (!this.trackingCode) {
    this.trackingCode = 'VC' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase();
  }
  next();
});

// Adicionar histórico de status
orderSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date()
    });
  }
  next();
});

// Índices para busca rápida
orderSchema.index({ trackingCode: 1 });
orderSchema.index({ 'customer.phone': 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
