const express = require('express');
const router = express.Router();
const { subscribe, unsubscribe } = require('../controllers/newsletterController');

// Subscribe to newsletter
router.post('/subscribe', subscribe);

// Unsubscribe from newsletter
router.post('/unsubscribe/:email', unsubscribe);

module.exports = router; 