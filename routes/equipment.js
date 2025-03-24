const express = require('express');
const equipmentController = require('../controllers/equipmentController');
const auth = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/upload');

const router = express.Router();

// Routes
router.get('/equipment', equipmentController.getAllEquipment);
router.get('/equipment/:id', equipmentController.getEquipmentById);
router.post('/equipment', auth, upload.single('image'), handleMulterError, equipmentController.createEquipment);
router.put('/equipment/:id', auth, upload.single('image'), handleMulterError, equipmentController.updateEquipment);
router.delete('/equipment/:id', auth, equipmentController.deleteEquipment);

module.exports = router;