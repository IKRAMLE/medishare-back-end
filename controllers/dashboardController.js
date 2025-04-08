const Equipment = require('../models/Equipment');
const Order = require('../models/Order');
const User = require('../models/User');

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    // Get total users
    const totalUsers = await User.countDocuments();

    // Get total equipment
    const totalEquipment = await Equipment.countDocuments();

    // Get total revenue from completed orders
    const completedOrders = await Order.find({ status: 'completed' });
    const revenue = completedOrders.reduce((total, order) => total + order.totalAmount, 0);

    // Get active rentals
    const activeRentals = await Order.countDocuments({ status: 'active' });

    // Get equipment status distribution
    const equipmentStatus = await Equipment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Format equipment status for chart
    const formattedEquipmentStatus = equipmentStatus.map(status => ({
      name: status._id,
      value: status.count,
      color: getStatusColor(status._id)
    }));

    // Get monthly rentals data
    const monthlyRentals = await Order.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    // Format monthly rentals for chart
    const formattedMonthlyRentals = monthlyRentals.map(rental => ({
      name: `${getMonthName(rental._id.month)} ${rental._id.year}`,
      rentals: rental.count
    }));

    // Get equipment categories
    const equipmentCategories = await Equipment.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    // Format equipment categories for chart
    const formattedEquipmentCategories = equipmentCategories.map(category => ({
      name: category._id,
      count: category.count,
      color: getCategoryColor(category._id)
    }));

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalEquipment,
          revenue,
          activeRentals
        },
        equipmentStatus: formattedEquipmentStatus,
        monthlyRentals: formattedMonthlyRentals,
        equipmentCategories: formattedEquipmentCategories
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics'
    });
  }
};

// Get notifications
const getNotifications = async (req, res) => {
  try {
    const notifications = [];

    // Get recent user registrations
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5);
    
    recentUsers.forEach(user => {
      notifications.push({
        type: 'user',
        message: `New user registered: ${user.name}`,
        timestamp: user.createdAt
      });
    });

    // Get recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'name')
      .populate('items.equipmentId', 'name');
    
    recentOrders.forEach(order => {
      const equipmentNames = order.items.map(item => item.equipmentId.name).join(', ');
      notifications.push({
        type: 'equipment',
        message: `${order.userId.name} placed an order for ${equipmentNames}`,
        timestamp: order.createdAt
      });
    });

    // Get equipment that needs attention (low stock or maintenance)
    const equipmentNeedsAttention = await Equipment.find({
      $or: [
        { quantity: { $lt: 5 } },
        { status: 'maintenance' }
      ]
    }).limit(5);

    equipmentNeedsAttention.forEach(equipment => {
      notifications.push({
        type: 'alert',
        message: `${equipment.name} needs attention: ${equipment.quantity < 5 ? 'Low stock' : 'Under maintenance'}`,
        timestamp: equipment.updatedAt
      });
    });

    // Sort all notifications by timestamp
    notifications.sort((a, b) => b.timestamp - a.timestamp);

    res.json({
      success: true,
      data: notifications.slice(0, 10) // Return only the 10 most recent notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get recent activity
const getRecentActivity = async (req, res) => {
  try {
    // Get recent user registrations
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .select('name email createdAt');

    // Get recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(3)
      .populate('userId', 'name email')
      .populate('items.equipmentId', 'name');

    // Get equipment alerts (low stock or maintenance needed)
    const equipmentAlerts = await Equipment.find({
      $or: [
        { stock: { $lt: 5 } },
        { maintenanceStatus: 'needed' }
      ]
    })
    .sort({ updatedAt: -1 })
    .limit(3)
    .select('name stock maintenanceStatus updatedAt');

    // Format activities
    const activities = [
      ...recentUsers.map(user => ({
        id: user._id,
        type: 'user',
        action: 'New user registered',
        user: user.name,
        time: user.createdAt,
        status: 'success'
      })),
      ...recentOrders.map(order => ({
        id: order._id,
        type: 'equipment',
        action: 'Equipment rented',
        user: order.userId.name,
        equipment: order.items.map(item => item.equipmentId.name).join(', '),
        time: order.createdAt,
        status: 'success'
      })),
      ...equipmentAlerts.map(equipment => ({
        id: equipment._id,
        type: 'alert',
        action: equipment.stock < 5 ? 'Low stock alert' : 'Maintenance needed',
        equipment: equipment.name,
        time: equipment.updatedAt,
        status: 'warning'
      }))
    ];

    // Sort by time and limit to 10 most recent
    const sortedActivities = activities
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 10);

    res.json({
      success: true,
      data: sortedActivities
    });
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent activity'
    });
  }
};

// Get quick actions data
const getQuickActions = async (req, res) => {
  try {
    // Get counts for quick actions
    const [
      totalEquipment,
      activeRentals,
      pendingMaintenance,
      totalReports
    ] = await Promise.all([
      Equipment.countDocuments(),
      Order.countDocuments({ status: 'active' }),
      Equipment.countDocuments({ maintenanceStatus: 'needed' }),
      Order.countDocuments({ status: 'completed' })
    ]);

    const quickActions = [
      {
        name: 'Add Equipment',
        icon: 'Plus',
        color: 'bg-blue-500 hover:bg-blue-600',
        count: totalEquipment
      },
      {
        name: 'New Rental',
        icon: 'Package',
        color: 'bg-green-500 hover:bg-green-600',
        count: activeRentals
      },
      {
        name: 'View Reports',
        icon: 'BarChart',
        color: 'bg-purple-500 hover:bg-purple-600',
        count: totalReports
      },
      {
        name: 'Maintenance',
        icon: 'Activity',
        color: 'bg-amber-500 hover:bg-amber-600',
        count: pendingMaintenance
      }
    ];

    res.json({
      success: true,
      data: quickActions
    });
  } catch (error) {
    console.error('Error fetching quick actions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching quick actions'
    });
  }
};

// Helper function to get status color
function getStatusColor(status) {
  const colors = {
    'available': '#22c55e',
    'rented': '#3b82f6',
    'maintenance': '#f59e0b',
    'unavailable': '#ef4444'
  };
  return colors[status] || '#64748b';
}

// Helper function to get category color
function getCategoryColor(category) {
  const colors = {
    'Excavators': '#3b82f6',
    'Bulldozers': '#22c55e',
    'Cranes': '#f59e0b',
    'Loaders': '#ef4444',
    'Dump Trucks': '#8b5cf6',
    'Graders': '#ec4899'
  };
  return colors[category] || '#64748b';
}

// Helper function to get month name
function getMonthName(month) {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1];
}

module.exports = {
  getDashboardStats,
  getNotifications,
  getRecentActivity,
  getQuickActions
}; 