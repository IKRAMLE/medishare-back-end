const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // Platform Settings
  platformName: {
    type: String,
    default: 'MedRent'
  },
  contactEmail: {
    type: String,
    default: 'support@medrent.com'
  },
  platformDescription: {
    type: String,
    default: 'Medical equipment rental platform connecting providers and patients'
  },
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  userRegistration: {
    type: Boolean,
    default: true
  },

  // Regional Settings
  timezone: {
    type: String,
    default: 'America/New_York'
  },
  dateFormat: {
    type: String,
    default: 'MM/DD/YYYY'
  },
  currency: {
    type: String,
    default: 'USD'
  },

  // Notification Settings
  notifications: {
    newUserRegistration: {
      type: Boolean,
      default: true
    },
    newEquipmentListed: {
      type: Boolean,
      default: true
    },
    newRentalRequests: {
      type: Boolean,
      default: true
    },
    platformUpdates: {
      type: Boolean,
      default: false
    }
  },

  // Security Settings
  security: {
    twoFactorAuth: {
      type: Boolean,
      default: true
    },
    passwordExpiration: {
      type: Boolean,
      default: false
    },
    loginAttempts: {
      type: Boolean,
      default: true
    },
    sessionTimeout: {
      type: Number,
      default: 30
    }
  },

  // API Settings
  api: {
    apiKey: {
      type: String,
      default: ''
    },
    apiAccess: {
      type: Boolean,
      default: true
    },
    rateLimit: {
      type: Number,
      default: 60
    }
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings; 