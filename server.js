const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB Connection
mongoose.connect('mongodb+srv://ikramlechqer:ikramlechqer@cluster0.owgf0.mongodb.net/medishare?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function(req, file, cb) {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'));
    }
    cb(null, true);
  }
});

// Equipment Schema
const equipmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  rentalPeriod: { type: String, enum: ['day', 'month'], default: 'day' },
  condition: { type: String, required: true },
  availability: { type: String, enum: ['available', 'not-available'], default: 'available' },
  location: { type: String, required: true },
  image: { type: String },
  status: { type: String, enum: ['active', 'pending'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

const Equipment = mongoose.model('Equipment', equipmentSchema);

// Routes
// Get all equipment
app.get('/api/equipment', async (req, res) => {
  try {
    const equipment = await Equipment.find().sort({ createdAt: -1 });
    res.json(equipment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add new equipment
app.post('/api/equipment', upload.single('image'), async (req, res) => {
  try {
    const equipmentData = {
      ...req.body,
      price: Number(req.body.price)
    };
    
    // Handle image upload
    if (req.file) {
      equipmentData.image = `/uploads/${req.file.filename}`;
    }
    
    const newEquipment = new Equipment(equipmentData);
    const savedEquipment = await newEquipment.save();
    res.status(201).json(savedEquipment);
  } catch (err) {
    console.error('Error saving equipment:', err);
    res.status(400).json({ message: err.message });
  }
});

// Get equipment by ID
app.get('/api/equipment/:id', async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }
    res.json(equipment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update equipment
app.put('/api/equipment/:id', upload.single('image'), async (req, res) => {
  try {
    const equipmentData = {
      ...req.body,
      price: Number(req.body.price)
    };
    
    // Only update image if a new one is uploaded
    if (req.file) {
      equipmentData.image = `/uploads/${req.file.filename}`;
      
      // Delete old image if it exists
      const oldEquipment = await Equipment.findById(req.params.id);
      if (oldEquipment && oldEquipment.image) {
        const oldImagePath = path.join(__dirname, oldEquipment.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
    }
    
    const updatedEquipment = await Equipment.findByIdAndUpdate(
      req.params.id, 
      equipmentData, 
      { new: true }
    );
    
    if (!updatedEquipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }
    
    res.json(updatedEquipment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete equipment
app.delete('/api/equipment/:id', async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }
    
    // Delete associated image
    if (equipment.image) {
      const imagePath = path.join(__dirname, equipment.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    await Equipment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Equipment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get dashboard stats
app.get('/api/stats', async (req, res) => {
  try {
    const totalEquipment = await Equipment.countDocuments();
    const active = await Equipment.countDocuments({ status: 'active' });
    const pending = await Equipment.countDocuments({ status: 'pending' });
    const revenue = await Equipment.aggregate([
      { $group: { _id: null, total: { $sum: "$price" } } }
    ]);
    
    res.json({
      totalEquipment,
      active,
      pending,
      revenue: revenue.length > 0 ? revenue[0].total : 0
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});