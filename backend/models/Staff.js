const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema(
  {
    user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    employeeId: { type: String, unique: true },
    phone:      { type: String, default: '' },
    position:   {
      type: String,
      enum: ['Waiter', 'Chef', 'Manager', 'Cashier', 'Host', 'Cleaner'],
      required: true,
    },
    shift:      {
      type: String,
      enum: ['Morning', 'Afternoon', 'Evening', 'Night'],
      default: 'Morning',
    },
    salary:     { type: Number, default: 0 },
    joiningDate: { type: Date, default: Date.now },
    isActive:   { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Auto-generate employee ID
staffSchema.pre('save', async function (next) {
  if (this.isNew) {
    const count = await mongoose.model('Staff').countDocuments();
    this.employeeId = `EMP-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Staff', staffSchema);
