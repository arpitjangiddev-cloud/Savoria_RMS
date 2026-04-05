const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  menuItem:  { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name:      { type: String, required: true },
  price:     { type: Number, required: true },
  quantity:  { type: Number, required: true, min: 1 },
  subtotal:  { type: Number, required: true },
  notes:     { type: String, default: '' },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true },
    table:       { type: mongoose.Schema.Types.ObjectId, ref: 'Table', required: true },
    tableNumber: { type: Number, required: true },
    items:       [orderItemSchema],
    status:      {
      type: String,
      enum: ['pending', 'preparing', 'ready', 'served', 'cancelled'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid'],
      default: 'unpaid',
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'upi', 'other'],
    },
    subtotal:   { type: Number, required: true },
    tax:        { type: Number, default: 0 },
    discount:   { type: Number, default: 0 },
    total:      { type: Number, required: true },
    notes:      { type: String, default: '' },
    servedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Auto-generate order number before save
orderSchema.pre('save', async function (next) {
  if (this.isNew) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
