const express = require('express');
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

const router = express.Router();

// Routes
router.get('/user/profile', auth, userController.getUserProfile);
router.get('/users/register/:userId', userController.getUserMembershipDate);
router.get('/stats', auth, userController.getDashboardStats);

module.exports = router;