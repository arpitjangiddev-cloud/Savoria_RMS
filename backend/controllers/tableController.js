const Table = require('../models/Table');
const Order = require('../models/Order');

// @route GET /api/tables
exports.getTables = async (req, res) => {
  try {
    const { status, location } = req.query;
    const filter = { isActive: true };

    if (status)   filter.status   = status;
    if (location) filter.location = location;

    const tables = await Table.find(filter)
      .populate('currentOrder', 'orderNumber total status createdAt')
      .sort({ number: 1 });

    res.json({ success: true, count: tables.length, data: tables });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/tables/:id
exports.getTable = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id).populate({
      path: 'currentOrder',
      populate: { path: 'items.menuItem', select: 'name' },
    });
    if (!table) return res.status(404).json({ success: false, message: 'Table not found' });
    res.json({ success: true, data: table });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route POST /api/tables
exports.createTable = async (req, res) => {
  try {
    const table = await Table.create(req.body);
    res.status(201).json({ success: true, data: table });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route PUT /api/tables/:id
exports.updateTable = async (req, res) => {
  try {
    const table = await Table.findByIdAndUpdate(req.params.id, req.body, {
      new: true, runValidators: true,
    });
    if (!table) return res.status(404).json({ success: false, message: 'Table not found' });
    res.json({ success: true, data: table });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route DELETE /api/tables/:id
exports.deleteTable = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) return res.status(404).json({ success: false, message: 'Table not found' });

    table.isActive = false;
    await table.save();

    res.json({ success: true, message: 'Table deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route PATCH /api/tables/:id/status
exports.updateTableStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const table = await Table.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!table) return res.status(404).json({ success: false, message: 'Table not found' });
    res.json({ success: true, data: table });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
