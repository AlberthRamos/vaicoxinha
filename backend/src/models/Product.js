const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  image: { type: String, required: true },
  category: { type: String, enum: ['coxinha', 'combo', 'bebida'], default: 'coxinha' },
  isOffer: { type: Boolean, default: false },
  offerPrice: { type: Number, min: 0 },
  offerDescription: { type: String },
  isActive: { type: Boolean, default: true },
  stock: { type: Number, default: 0, min: 0 },
  preparationTime: { type: Number, default: 15, min: 1 }
}, { timestamps: true });

productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ isOffer: 1 });

module.exports = mongoose.model('Product', productSchema);

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  image: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['coxinha', 'combo', 'bebida'],
    default: 'coxinha'
  },
  isOffer: {
    type: Boolean,
    default: false
  },
  offerPrice: {
    type: Number,
    min: 0
  },
  offerDescription: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  stock: {
    type: Number,
    default: 0,
    min: 0
  },
  preparationTime: {
    type: Number,
    default: 15, // minutos
    min: 1
  }
}, {
  timestamps: true
});

// Índice para busca rápida
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ isOffer: 1 });

module.exports = mongoose.model('Product', productSchema);
