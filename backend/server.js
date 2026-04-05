const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '.env') });

if (!process.env.MONGO_URI || !process.env.MONGO_URI.trim()) {
  console.error('Missing MONGO_URI in backend/.env. Add it and restart the server.');
  process.exit(1);
}

const authRoutes    = require('./routes/auth');
const menuRoutes    = require('./routes/menu');
const orderRoutes   = require('./routes/orders');
const tableRoutes   = require('./routes/tables');
const staffRoutes   = require('./routes/staff');
const statsRoutes   = require('./routes/stats');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth',   authRoutes);
app.use('/api/menu',   menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/staff',  staffRoutes);
app.use('/api/stats',  statsRoutes);

// Health check
app.get('/', (req, res) => res.json({ message: 'Restaurant API running' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Connect to MongoDB and start server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(process.env.PORT || 5000, () =>
      console.log(`Server running on port ${process.env.PORT || 5000}`)
    );
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });
