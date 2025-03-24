const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  equipment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equipment',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  // Add strict validation
  strict: true,
  // Ensure all fields are validated
  validateBeforeSave: true
});

// Ensure a user can't favorite the same equipment twice
favoriteSchema.index({ userId: 100, equipment: 100 }, { unique: true });

// Add validation to ensure equipment is not null
favoriteSchema.pre('save', function(next) {
  if (!this.equipment) {
    next(new Error('Equipment ID is required'));
  }
  next();
});

const Favorite = mongoose.model('Favorite', favoriteSchema);

// Clean up existing invalid data and recreate indexes
const initializeModel = async () => {
  try {
    // Remove any documents with null equipment
    await Favorite.deleteMany({ equipment: null });
    
    // Drop existing indexes
    await Favorite.collection.dropIndexes();
    
    // Recreate indexes
    await Favorite.syncIndexes();
    
    console.log('Favorite model initialized successfully');
  } catch (error) {
    console.error('Error initializing Favorite model:', error);
  }
};

initializeModel();

module.exports = Favorite;
