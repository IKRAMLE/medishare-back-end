const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/auth');

// Get dashboard statistics
router.get('/dashboard/stats', auth, dashboardController.getDashboardStats);

// Get notifications
router.get('/dashboard/notifications', auth, dashboardController.getNotifications);

// Get recent activity
router.get('/dashboard/recent-activity', auth, dashboardController.getRecentActivity);

// Get quick actions
router.get('/dashboard/quick-actions', auth, dashboardController.getQuickActions);

module.exports = router; 