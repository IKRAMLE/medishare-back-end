const mongoose = require('mongoose');

// Equipment Schema
const equipmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  rentalPeriod: { type: String, enum: ['day','month'], default: 'day' },
  condition: { type: String, required: true },
  availability: { type: String, enum: ['available', 'not-available'], default: 'available' },
  location: { type: String, required: true },
  image: { type: String },
  status: { type: String, enum: ['active', 'pending'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

const Equipment = mongoose.model('Equipment', equipmentSchema);

module.exports = Equipment;