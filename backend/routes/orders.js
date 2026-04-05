const express = require('express');
const router = express.Router();
const {
  getOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  updatePayment,
  deleteOrder,
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getOrders);
router.get('/:id', protect, getOrder);
router.post('/', protect, createOrder);
router.patch('/:id/status', protect, updateOrderStatus);
router.patch('/:id/payment', protect, authorize('admin', 'manager', 'staff'), updatePayment);
router.delete('/:id', protect, authorize('admin', 'manager'), deleteOrder);

module.exports = router;
