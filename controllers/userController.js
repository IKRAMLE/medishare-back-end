const User = require('../models/User');
const Equipment = require('../models/Equipment');
const bcrypt = require('bcrypt');

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

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });
    
    // Transform the data to match the frontend requirements
    const transformedUsers = users.map(user => ({
      id: user._id,
      name: user.name || user.fullName || user.email.split('@')[0],
      email: user.email,
      role: user.role || 'User',
      status: user.status || 'Active',
      lastLogin: user.lastLogin || user.createdAt
    }));

    res.json(transformedUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting the last admin
    if (user.role === 'Admin') {
      const adminCount = await User.countDocuments({ role: 'Admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Cannot delete the last admin user' });
      }
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, role, status, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      name,
      fullName: name, // Set fullName to name for backward compatibility
      email,
      role,
      status,
      password: hashedPassword,
      phone: 'N/A' // Default phone number
    });

    // Save user to database
    await newUser.save();

    // Return user data without password
    const userToReturn = {
      id: newUser._id,
      name: newUser.name || newUser.fullName,
      email: newUser.email,
      role: newUser.role,
      status: newUser.status,
      lastLogin: newUser.lastLogin || newUser.createdAt
    };

    res.status(201).json(userToReturn);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { name, email, role, status, password } = req.body;
    const userId = req.params.id;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }
    }

    // Update user fields
    if (name) {
      user.name = name;
      user.fullName = name; // Update fullName for backward compatibility
    }
    if (email) user.email = email;
    if (role) user.role = role;
    if (status) user.status = status;

    // Update password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    // Save updated user
    await user.save();

    // Return updated user data without password
    const userToReturn = {
      id: user._id,
      name: user.name || user.fullName,
      email: user.email,
      role: user.role,
      status: user.status,
      lastLogin: user.lastLogin || user.createdAt
    };

    res.json(userToReturn);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user' });
  }
};