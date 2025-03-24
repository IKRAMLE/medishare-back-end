const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Order = require('../models/Order');
const Equipment = require('../models/Equipment');
const User = require('../models/User');

// Create new order
router.post('/orders', auth, async (req, res) => {
  try {
    const { items, paymentMethod, totalAmount } = req.body;

    // Validate items availability
    for (const item of items) {
      const equipment = await Equipment.findById(item.equipmentId);
      if (!equipment || equipment.availability !== 'available') {
        return res.status(400).json({
          success: false,
          message: 'Un ou plusieurs équipements ne sont plus disponibles'
        });
      }
    }

    // Create order
    const order = new Order({
      userId: req.user.id,
      items,
      paymentMethod,
      totalAmount
    });

    await order.save();

    // Update equipment availability
    for (const item of items) {
      await Equipment.findByIdAndUpdate(item.equipmentId, {
        availability: 'rented'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Commande créée avec succès',
      data: order
    });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la commande',
      error: err.message
    });
  }
});

// Get user's orders
router.get('/orders', auth, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .populate('items.equipmentId')
      .sort('-createdAt');

    res.json({
      success: true,
      data: orders
    });
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des commandes',
      error: err.message
    });
  }
});

// Get order details
router.get('/orders/:orderId', auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      userId: req.user.id
    }).populate('items.equipmentId');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la commande',
      error: err.message
    });
  }
});

// Cancel order
router.post('/orders/:orderId/cancel', auth, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.orderId,
      userId: req.user.id,
      status: 'pending'
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée ou ne peut pas être annulée'
      });
    }

    order.status = 'cancelled';
    await order.save();

    // Restore equipment availability
    for (const item of order.items) {
      await Equipment.findByIdAndUpdate(item.equipmentId, {
        availability: 'available'
      });
    }

    res.json({
      success: true,
      message: 'Commande annulée avec succès',
      data: order
    });
  } catch (err) {
    console.error('Error cancelling order:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'annulation de la commande',
      error: err.message
    });
  }
});

module.exports = router;
