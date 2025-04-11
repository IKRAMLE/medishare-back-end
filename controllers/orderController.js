const Order = require('../models/Order');
const Equipment = require('../models/Equipment');
const User = require('../models/User');

// Create new order
exports.createOrder = async (req, res) => {
  try {
    // Parse the orderData from the request body
    const orderData = JSON.parse(req.body.orderData);
    const { items, paymentMethod, totalAmount, personalInfo } = orderData;
    const userId = req.user.id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Les items de la commande sont invalides'
      });
    }

    // Validate items availability and get owner IDs
    const equipmentOwners = new Set();
    const equipmentMap = new Map(); // Store equipment details for later use

    for (const item of items) {
      const equipment = await Equipment.findById(item.equipmentId);
      if (!equipment || equipment.availability !== 'available') {
        return res.status(400).json({
          success: false,
          message: 'Un ou plusieurs équipements ne sont plus disponibles'
        });
      }
      equipmentOwners.add(equipment.userId.toString());
      equipmentMap.set(item.equipmentId, equipment);
    }

    // Create orders for each owner
    const orders = [];
    for (const ownerId of equipmentOwners) {
      // Filter items for this owner
      const ownerItems = items.filter(item => {
        const equipment = equipmentMap.get(item.equipmentId);
        return equipment.userId.toString() === ownerId;
      });

      // Calculate owner's total
      const ownerTotal = ownerItems.reduce((sum, item) => {
        return sum + (item.price * item.quantity * item.rentalDays);
      }, 0);

      // Create order
      const order = new Order({
        userId,
        ownerId,
        items: ownerItems,
        paymentMethod,
        totalAmount: ownerTotal,
        personalInfo,
        status: 'pending',
        paymentProof: req.file ? `/uploads/${req.file.filename}` : undefined
      });

      await order.save();
      orders.push(order);

      // Update equipment availability
      for (const item of ownerItems) {
        await Equipment.findByIdAndUpdate(item.equipmentId, {
          availability: 'rented'
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Commandes créées avec succès',
      data: orders
    });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la commande',
      error: err.message
    });
  }
};

// Get user's orders
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.id })
      .populate('items.equipmentId')
      .populate('ownerId', 'firstName lastName email phone')
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
};

// Get owner's orders
exports.getOwnerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ ownerId: req.user.id })
      .populate('items.equipmentId')
      .populate('userId', 'firstName lastName email phone')
      .sort('-createdAt');

    res.json({
      success: true,
      data: orders
    });
  } catch (err) {
    console.error('Error fetching owner orders:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des commandes',
      error: err.message
    });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findOne({
      _id: orderId,
      ownerId: req.user.id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Commande non trouvée'
      });
    }

    order.status = status;
    await order.save();

    // If order is rejected, restore equipment availability
    if (status === 'rejected') {
      for (const item of order.items) {
        await Equipment.findByIdAndUpdate(item.equipmentId, {
          availability: 'available'
        });
      }
    }

    res.json({
      success: true,
      message: 'Statut de la commande mis à jour avec succès',
      data: order
    });
  } catch (err) {
    console.error('Error updating order status:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du statut de la commande',
      error: err.message
    });
  }
}; 