const User = require('../models/User');
const Equipment = require('../models/Equipment');

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json(user);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

exports.getUserMembershipDate = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      id: user._id,
      email: user.email,
      createdAt: user.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const totalEquipment = await Equipment.countDocuments({ userId: req.user.id });
    const active = await Equipment.countDocuments({ userId: req.user.id, status: 'active' });
    const pending = await Equipment.countDocuments({ userId: req.user.id, status: 'pending' });
    const revenue = await Equipment.aggregate([
      { $match: { userId: req.user.id } },
      { $group: { _id: null, total: { $sum: "$price" } } }
    ]);
    
    res.json({
      success: true,
      data: {
        totalEquipment,
        active,
        pending,
        revenue: revenue.length > 0 ? revenue[0].total : 0
      }
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: err.message 
    });
  }
};