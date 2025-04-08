const Settings = require('../models/Settings');
const crypto = require('crypto');

// Get all settings
exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    // If no settings exist, create default settings
    if (!settings) {
      settings = await Settings.create({});
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Error fetching settings' });
  }
};

// Update settings
exports.updateSettings = async (req, res) => {
  try {
    const updates = req.body;
    
    // Find existing settings or create new ones
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    // Update platform settings
    if (updates.platformName) settings.platformName = updates.platformName;
    if (updates.contactEmail) settings.contactEmail = updates.contactEmail;
    if (updates.platformDescription) settings.platformDescription = updates.platformDescription;
    if (typeof updates.maintenanceMode === 'boolean') settings.maintenanceMode = updates.maintenanceMode;
    if (typeof updates.userRegistration === 'boolean') settings.userRegistration = updates.userRegistration;

    // Update regional settings
    if (updates.timezone) settings.timezone = updates.timezone;
    if (updates.dateFormat) settings.dateFormat = updates.dateFormat;
    if (updates.currency) settings.currency = updates.currency;

    // Update notification settings
    if (updates.notifications) {
      if (typeof updates.notifications.newUserRegistration === 'boolean') {
        settings.notifications.newUserRegistration = updates.notifications.newUserRegistration;
      }
      if (typeof updates.notifications.newEquipmentListed === 'boolean') {
        settings.notifications.newEquipmentListed = updates.notifications.newEquipmentListed;
      }
      if (typeof updates.notifications.newRentalRequests === 'boolean') {
        settings.notifications.newRentalRequests = updates.notifications.newRentalRequests;
      }
      if (typeof updates.notifications.platformUpdates === 'boolean') {
        settings.notifications.platformUpdates = updates.notifications.platformUpdates;
      }
    }

    // Update security settings
    if (updates.security) {
      if (typeof updates.security.twoFactorAuth === 'boolean') {
        settings.security.twoFactorAuth = updates.security.twoFactorAuth;
      }
      if (typeof updates.security.passwordExpiration === 'boolean') {
        settings.security.passwordExpiration = updates.security.passwordExpiration;
      }
      if (typeof updates.security.loginAttempts === 'boolean') {
        settings.security.loginAttempts = updates.security.loginAttempts;
      }
      if (typeof updates.security.sessionTimeout === 'number') {
        settings.security.sessionTimeout = updates.security.sessionTimeout;
      }
    }

    // Update API settings
    if (updates.api) {
      if (typeof updates.api.apiAccess === 'boolean') {
        settings.api.apiAccess = updates.api.apiAccess;
      }
      if (typeof updates.api.rateLimit === 'number') {
        settings.api.rateLimit = updates.api.rateLimit;
      }
    }

    // Update timestamp
    settings.updatedAt = new Date();

    await settings.save();
    res.json(settings);
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Error updating settings' });
  }
};

// Regenerate API key
exports.regenerateApiKey = async (req, res) => {
  try {
    const settings = await Settings.findOne();
    if (!settings) {
      return res.status(404).json({ message: 'Settings not found' });
    }

    // Generate a new API key
    const newApiKey = crypto.randomBytes(32).toString('hex');
    settings.api.apiKey = newApiKey;
    settings.updatedAt = new Date();

    await settings.save();
    res.json({ apiKey: newApiKey });
  } catch (error) {
    console.error('Error regenerating API key:', error);
    res.status(500).json({ message: 'Error regenerating API key' });
  }
}; 