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
});

// Ensure a user can't favorite the same equipment twice
favoriteSchema.index({ userId: 1, equipment: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
