const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Favorite = require('../models/Favorite');
const Equipment = require('../models/Equipment');
const mongoose = require('mongoose');

// Get all favorites for the current user
router.get('/favorites', auth, async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.user.id })
      .populate('equipment');
    
    res.json({
      success: true,
      data: favorites.filter(fav => fav.equipment !== null) // Filter out any null equipment
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching favorites'
    });
  }
});

// Add to favorites
router.post('/favorites/:equipmentId', auth, async (req, res) => {
  try {
    // Validate equipmentId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.equipmentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid equipment ID format'
      });
    }
    
    const equipment = await Equipment.findById(req.params.equipmentId);
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }
    
    // Check if already favorited
    const existingFavorite = await Favorite.findOne({
      userId: req.user.id,
      equipment: req.params.equipmentId
    });
    
    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        message: 'Equipment already in favorites'
      });
    }
    
    // Create new favorite
    const favorite = new Favorite({
      userId: req.user.id,
      equipment: req.params.equipmentId
    });
    
    await favorite.save();
    
    res.json({
      success: true,
      message: 'Added to favorites',
      data: favorite
    });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error adding to favorites'
    });
  }
});

// Remove from favorites
router.delete('/favorites/:equipmentId', auth, async (req, res) => {
  try {
    // Validate equipmentId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.equipmentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid equipment ID format'
      });
    }
    
    const result = await Favorite.findOneAndDelete({
      userId: req.user.id,
      equipment: req.params.equipmentId
    });
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Removed from favorites'
    });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing from favorites'
    });
  }
});

module.exports = router;