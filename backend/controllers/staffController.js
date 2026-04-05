const Staff = require('../models/Staff');
const User  = require('../models/User');

// @route GET /api/staff
exports.getAllStaff = async (req, res) => {
  try {
    const { position, shift, isActive } = req.query;
    const filter = {};

    if (position) filter.position = position;
    if (shift)    filter.shift    = shift;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const staff = await Staff.find(filter)
      .populate('user', 'name email role avatar')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: staff.length, data: staff });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route GET /api/staff/:id
exports.getStaff = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id).populate('user', 'name email role avatar');
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });
    res.json({ success: true, data: staff });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route POST /api/staff
// Creates a User account + Staff profile in one request
exports.createStaff = async (req, res) => {
  try {
    const { name, email, password, role, position, shift, phone, salary, joiningDate } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user  = await User.create({ name, email, password, role: role || 'staff' });
    const staff = await Staff.create({
      user: user._id,
      position,
      shift,
      phone,
      salary,
      joiningDate,
    });

    const populated = await staff.populate('user', 'name email role');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route PUT /api/staff/:id
exports.updateStaff = async (req, res) => {
  try {
    const { name, email, role, ...staffData } = req.body;

    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });

    // Update User fields if provided
    if (name || email || role) {
      await User.findByIdAndUpdate(staff.user, { name, email, role });
    }

    const updated = await Staff.findByIdAndUpdate(req.params.id, staffData, {
      new: true, runValidators: true,
    }).populate('user', 'name email role');

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @route DELETE /api/staff/:id
exports.deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    if (!staff) return res.status(404).json({ success: false, message: 'Staff not found' });

    staff.isActive = false;
    await staff.save();
    await User.findByIdAndUpdate(staff.user, { isActive: false });

    res.json({ success: true, message: 'Staff member deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
