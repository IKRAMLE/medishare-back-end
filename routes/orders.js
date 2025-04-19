const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const orderController = require('../controllers/orderController');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function(req, file, cb) {
    // Accept images and PDFs
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|pdf)$/i)) {
      return cb(new Error('Only image and PDF files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Create new order - no auth required
router.post('/orders', upload.fields([
  { name: 'receipt', maxCount: 1 },
  { name: 'cinFile', maxCount: 1 },
  { name: 'messageFile', maxCount: 1 }
]), orderController.createOrder);

// Get user's orders
router.get('/orders', auth, orderController.getUserOrders);

// Get owner's orders
router.get('/orders/owner', auth, orderController.getOwnerOrders);

// Update order status
router.put('/orders/:orderId/status', auth, orderController.updateOrderStatus);

module.exports = router;
