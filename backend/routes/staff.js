const express = require('express');
const router  = express.Router();
const {
  getAllStaff,
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
} = require('../controllers/staffController');
const { protect, authorize } = require('../middleware/auth');

router.get('/',        protect, authorize('admin', 'manager'), getAllStaff);
router.get('/:id',     protect, authorize('admin', 'manager'), getStaff);
router.post('/',       protect, authorize('admin'), createStaff);
router.put('/:id',     protect, authorize('admin', 'manager'), updateStaff);
router.delete('/:id',  protect, authorize('admin'), deleteStaff);

module.exports = router;
