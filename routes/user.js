const express = require('express');
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

const router = express.Router();

// Routes
router.get('/user/profile', auth, userController.getUserProfile);
router.get('/users/register/:userId', userController.getUserMembershipDate);
router.get('/stats', auth, userController.getDashboardStats);

// User management routes
router.get('/users', auth, userController.getAllUsers);
router.post('/users', auth, userController.createUser);
router.put('/users/:id', auth, userController.updateUser);
router.delete('/users/:id', auth, userController.deleteUser);

module.exports = router;