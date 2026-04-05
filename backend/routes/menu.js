const express = require('express');
const router  = express.Router();
const {
  getMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  toggleAvailability,
} = require('../controllers/menuController');
const { protect, authorize } = require('../middleware/auth');
const { upload }             = require('../config/cloudinary');

router.get('/',              protect, getMenuItems);
router.get('/:id',           protect, getMenuItem);
router.post('/',             protect, authorize('admin', 'manager'), upload.single('image'), createMenuItem);
router.put('/:id',           protect, authorize('admin', 'manager'), upload.single('image'), updateMenuItem);
router.delete('/:id',        protect, authorize('admin'), deleteMenuItem);
router.patch('/:id/toggle',  protect, authorize('admin', 'manager'), toggleAvailability);

module.exports = router;
