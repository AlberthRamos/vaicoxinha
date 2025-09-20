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
