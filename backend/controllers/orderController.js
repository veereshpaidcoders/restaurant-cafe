const { Order, MenuItem, Customer } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
exports.getOrders = async (req, res) => {
  try {
    const { status, orderType, startDate, endDate, page = 1, limit = 50 } = req.query;
    
    let where = {};
    
    if (status) where.status = status;
    if (orderType) where.orderType = orderType;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    const offset = (page - 1) * limit;

    const orders = await Order.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: offset,
      order: [['createdAt', 'DESC']],
      include: [
        { 
          model: Customer,
          as: 'customer',
          attributes: ['firstName', 'lastName', 'email', 'phone'],
          required: false
        }
      ]
    });

    res.json({
      success: true,
      count: orders.count,
      page: parseInt(page),
      pages: Math.ceil(orders.count / limit),
      data: orders.rows
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { 
          model: Customer,
          as: 'customer',
          attributes: ['firstName', 'lastName', 'email', 'phone'],
          required: false
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res) => {
  try {
    const {
      orderType,
      tableNumber,
      customerName,
      customerPhone,
      customerEmail,
      deliveryAddress,
      items,
      paymentMethod,
      notes
    } = req.body;

    // Calculate order totals
    let subtotal = 0;
    for (const item of items) {
      const menuItem = await MenuItem.findByPk(item.menuItemId);
      if (!menuItem) {
        return res.status(404).json({ success: false, message: `Menu item ${item.menuItemId} not found` });
      }
      subtotal += parseFloat(menuItem.price) * item.quantity;
    }

    const tax = subtotal * 0.1; // 10% tax
    const deliveryFee = orderType === 'delivery' ? 5.00 : 0;
    const total = subtotal + tax + deliveryFee;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const order = await Order.create({
      orderNumber,
      orderType,
      tableNumber,
      customerName,
      customerPhone,
      customerEmail,
      deliveryAddress,
      items,
      subtotal,
      tax,
      deliveryFee,
      total,
      paymentMethod,
      notes,
      userId: req.user.id
    });

    logger.info('New order created', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderType: order.orderType,
      total: order.total,
      userId: req.user.id,
      itemCount: items.length
    });

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('newOrder', order);
    io.to('kitchen').emit('newKitchenOrder', order);

    res.status(201).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update order
// @route   PUT /api/orders/:id
// @access  Private
exports.updateOrder = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const updatedOrder = await order.update(req.body);

    logger.info('Order updated', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      updates: Object.keys(req.body),
      userId: req.user.id
    });

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('orderUpdated', updatedOrder);

    res.json({
      success: true,
      data: updatedOrder
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.status = status;
    if (status === 'completed') {
      order.completedAt = new Date();
      order.paymentStatus = 'paid';
    }
    await order.save();

    // Emit real-time update
    const io = req.app.get('io');
    io.emit('orderStatusUpdated', order);
    if (order.tableNumber) {
      io.to(`table_${order.tableNumber}`).emit('orderUpdate', order);
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private (Admin/Manager)
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    await order.destroy();

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get order statistics
// @route   GET /api/orders/stats
// @access  Private
exports.getOrderStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = await Order.count({
      where: {
        createdAt: { [Op.gte]: today },
        status: { [Op.ne]: 'cancelled' }
      }
    });

    const todayRevenue = await Order.sum('total', {
      where: {
        createdAt: { [Op.gte]: today },
        paymentStatus: 'paid'
      }
    });

    const pendingOrders = await Order.count({
      where: { status: { [Op.in]: ['pending', 'confirmed', 'preparing'] } }
    });

    res.json({
      success: true,
      data: {
        todayOrders,
        todayRevenue: todayRevenue || 0,
        pendingOrders
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
