const express = require('express');
const router = express.Router();
const {
  getMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getCategories,
  updateAvailability
} = require('../controllers/menuController');
const { protect, authorize } = require('../middleware/auth');

router.get('/categories', getCategories);

router.route('/')
  .get(getMenuItems)
  .post(protect, authorize('admin', 'manager'), createMenuItem);

router.route('/:id')
  .get(getMenuItem)
  .put(protect, authorize('admin', 'manager'), updateMenuItem)
  .delete(protect, authorize('admin', 'manager'), deleteMenuItem);

router.put('/:id/availability', protect, updateAvailability);

module.exports = router;
