const express = require('express');
const router  = express.Router();
const {
  getOverview,
  getRevenueChart,
  getTopItems,
  getCategorySales,
  getRecentOrders,
} = require('../controllers/statsController');
const { protect, authorize } = require('../middleware/auth');

router.get('/overview',         protect, getOverview);
router.get('/revenue',          protect, getRevenueChart);
router.get('/top-items',        protect, getTopItems);
router.get('/category-sales',   protect, getCategorySales);
router.get('/recent-orders',    protect, getRecentOrders);

module.exports = router;
