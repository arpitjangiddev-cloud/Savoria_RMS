const Order    = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const Table    = require('../models/Table');
const Staff    = require('../models/Staff');

// @route GET /api/stats/overview
exports.getOverview = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      todayOrders,
      todayRevenue,
      totalMenuItems,
      availableTables,
      occupiedTables,
      totalStaff,
      pendingOrders,
    ] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: today, $lte: todayEnd } }),
      Order.aggregate([
        { $match: { createdAt: { $gte: today, $lte: todayEnd }, paymentStatus: 'paid' } },
        { $group: { _id: null, total: { $sum: '$total' } } },
      ]),
      MenuItem.countDocuments({ isAvailable: true }),
      Table.countDocuments({ status: 'available', isActive: true }),
      Table.countDocuments({ status: 'occupied', isActive: true }),
      Staff.countDocuments({ isActive: true }),
      Order.countDocuments({ status: { $in: ['pending', 'preparing'] } }),
    ]);

    res.json({
      success: true,
      data: {
        todayOrders,
        todayRevenue:    todayRevenue[0]?.total || 0,
        totalMenuItems,
        availableTables,
        occupiedTables,
        totalTables:     availableTables + occupiedTables,
        totalStaff,
        pendingOrders,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/stats/revenue?period=7 (days)
exports.getRevenueChart = async (req, res) => {
  try {
    const days = parseInt(req.query.period) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const data = await Order.aggregate([
      {
        $match: {
          createdAt:     { $gte: startDate },
          paymentStatus: 'paid',
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          revenue: { $sum: '$total' },
          orders:  { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill missing days with 0
    const result = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const key = d.toISOString().split('T')[0];
      const found = data.find((x) => x._id === key);
      result.push({
        date:    key,
        revenue: found?.revenue || 0,
        orders:  found?.orders  || 0,
      });
    }

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/stats/top-items?limit=5
exports.getTopItems = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const data = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id:      '$items.menuItem',
          name:     { $first: '$items.name' },
          quantity: { $sum: '$items.quantity' },
          revenue:  { $sum: '$items.subtotal' },
        },
      },
      { $sort: { quantity: -1 } },
      { $limit: limit },
    ]);

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/stats/category-sales
exports.getCategorySales = async (req, res) => {
  try {
    const data = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $lookup: {
          from:         'menuitems',
          localField:   'items.menuItem',
          foreignField: '_id',
          as:           'menuData',
        },
      },
      { $unwind: '$menuData' },
      {
        $group: {
          _id:     '$menuData.category',
          revenue: { $sum: '$items.subtotal' },
          orders:  { $sum: '$items.quantity' },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/stats/recent-orders?limit=10
exports.getRecentOrders = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const orders = await Order.find()
      .populate('table', 'number')
      .select('orderNumber tableNumber total status paymentStatus createdAt')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
