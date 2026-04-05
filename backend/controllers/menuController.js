const MenuItem           = require('../models/MenuItem');
const { cloudinary }     = require('../config/cloudinary');

// @route GET /api/menu
exports.getMenuItems = async (req, res) => {
  try {
    const { category, available, search } = req.query;
    const filter = {};

    if (category)  filter.category    = category;
    if (available) filter.isAvailable = available === 'true';
    if (search)    filter.name        = { $regex: search, $options: 'i' };

    const items = await MenuItem.find(filter).sort({ category: 1, name: 1 });
    res.json({ success: true, count: items.length, data: items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/menu/:id
exports.getMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Menu item not found' });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route POST /api/menu
exports.createMenuItem = async (req, res) => {
  try {
    const body = { ...req.body };
    if (req.file) {
      body.image          = req.file.path;
      body.imagePublicId  = req.file.filename;
    }

    const item = await MenuItem.create(body);
    res.status(201).json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route PUT /api/menu/:id
exports.updateMenuItem = async (req, res) => {
  try {
    const existing = await MenuItem.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Menu item not found' });

    const body = { ...req.body };

    if (req.file) {
      // Delete old image from Cloudinary
      if (existing.imagePublicId) {
        await cloudinary.uploader.destroy(existing.imagePublicId);
      }
      body.image         = req.file.path;
      body.imagePublicId = req.file.filename;
    }

    const item = await MenuItem.findByIdAndUpdate(req.params.id, body, {
      new: true, runValidators: true,
    });

    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route DELETE /api/menu/:id
exports.deleteMenuItem = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Menu item not found' });

    if (item.imagePublicId) {
      await cloudinary.uploader.destroy(item.imagePublicId);
    }
    await item.deleteOne();

    res.json({ success: true, message: 'Menu item deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route PATCH /api/menu/:id/toggle
exports.toggleAvailability = async (req, res) => {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Menu item not found' });

    item.isAvailable = !item.isAvailable;
    await item.save();

    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
