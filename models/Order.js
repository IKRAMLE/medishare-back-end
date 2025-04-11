const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  equipmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Equipment',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  rentalDays: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  },
  rentalPeriod: {
    type: String,
    enum: ['day', 'month'],
    required: true
  }
});

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  personalInfo: {
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    cin: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    }
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['bank', 'wafacash', 'cashplus']
  },
  paymentProof: {
    type: String,
    required: function() {
      return ['bank', 'wafacash', 'cashplus'].includes(this.paymentMethod);
    }
  },
  totalAmount: {
    type: Number,
    required: true
  },
  deposit: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
