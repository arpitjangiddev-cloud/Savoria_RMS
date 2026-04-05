const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price:       { type: Number, required: true, min: 0 },
    category:    {
      type: String,
      required: true,
      enum: ['Starters', 'Main Course', 'Desserts', 'Beverages', 'Specials'],
    },
    image:       { type: String, default: '' },
    imagePublicId: { type: String, default: '' },
    isAvailable: { type: Boolean, default: true },
    preparationTime: { type: Number, default: 15 }, // minutes
    tags:        [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('MenuItem', menuItemSchema);
