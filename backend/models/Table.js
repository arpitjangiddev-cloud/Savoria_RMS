const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema(
  {
    number:   { type: Number, required: true, unique: true },
    capacity: { type: Number, required: true, min: 1 },
    status:   {
      type: String,
      enum: ['available', 'occupied', 'reserved', 'maintenance'],
      default: 'available',
    },
    location: {
      type: String,
      enum: ['Indoor', 'Outdoor', 'VIP', 'Bar'],
      default: 'Indoor',
    },
    currentOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Table', tableSchema);
