const Order = require('../models/Order');
const Table = require('../models/Table');
const MenuItem = require('../models/MenuItem');

// @route GET /api/orders
exports.getOrders = async (req, res) => {
  try {
    const { status, paymentStatus, date, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.createdAt = { $gte: start, $lte: end };
    }

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate('table', 'number location')
      .populate('servedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      count: orders.length,
      total,
      pages: Math.ceil(total / limit),
      currentPage: Number(page),
      data: orders,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/orders/:id
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('table', 'number location')
      .populate('items.menuItem', 'name category')
      .populate('servedBy', 'name role');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route POST /api/orders
exports.createOrder = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, message: errors.array()[0].msg });
  }
  try {
    const { tableId, items, notes, discount = 0 } = req.body;

    const table = await Table.findById(tableId);
    if (!table) return res.status(404).json({ success: false, message: 'Table not found' });

    // Resolve items and calculate totals
    let subtotal = 0;
    const resolvedItems = [];

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItemId);
      if (!menuItem) {
        return res.status(404).json({ success: false, message: `Menu item ${item.menuItemId} not found` });
      }
      if (!menuItem.isAvailable) {
        return res.status(400).json({ success: false, message: `${menuItem.name} is not available` });
      }

      const itemSubtotal = menuItem.price * item.quantity;
      subtotal += itemSubtotal;

      resolvedItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity,
        subtotal: itemSubtotal,
        notes: item.notes || '',
      });
    }

    const taxRate = 0.05; // 5%
    const tax = parseFloat((subtotal * taxRate).toFixed(2));
    const total = parseFloat((subtotal + tax - discount).toFixed(2));

    const order = await Order.create({
      table: tableId,
      tableNumber: table.number,
      items: resolvedItems,
      subtotal,
      tax,
      discount,
      total,
      notes,
      servedBy: req.user._id,
    });

    // Mark table as occupied
    table.status = 'occupied';
    table.currentOrder = order._id;
    await table.save();

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route PATCH /api/orders/:id/status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'preparing', 'ready', 'served', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.status = status;
    await order.save();

    // Free up table when order is served or cancelled
    if (status === 'served' || status === 'cancelled') {
      await Table.findByIdAndUpdate(order.table, {
        status: 'available',
        currentOrder: null,
      });
    }

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route PATCH /api/orders/:id/payment
exports.updatePayment = async (req, res) => {
  try {
    const { paymentMethod } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.paymentStatus = 'paid';
    order.paymentMethod = paymentMethod;
    if (order.status !== 'cancelled') order.status = 'served';
    await order.save();

    // Free up table
    await Table.findByIdAndUpdate(order.table, { status: 'available', currentOrder: null });

    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route DELETE /api/orders/:id
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    await Table.findByIdAndUpdate(order.table, { status: 'available', currentOrder: null });
    await order.deleteOne();

    res.json({ success: true, message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
