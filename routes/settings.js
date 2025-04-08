const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const auth = require('../middleware/auth');

// Get all settings
router.get('/settings', auth, settingsController.getSettings);

// Update settings
router.put('/settings', auth, settingsController.updateSettings);

// Regenerate API key
router.post('/settings/regenerate-api-key', auth, settingsController.regenerateApiKey);

module.exports = router; 