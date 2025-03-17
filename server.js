const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT;

// In a real production app, use dotenv to load from .env file
const JWT_SECRET = process.env.JWT_SECRET;
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use('/uploads', express.static(uploadDir));

// MongoDB Connection
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch(err => console.error('Error connecting to MongoDB:', err));

// Create User Schema
const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create User Model
const User = mongoose.model('User', userSchema, 'signUp');

// Validation middleware
const validateSignup = [
  body('fullName').trim().notEmpty().withMessage('Le nom complet est requis'),
  body('email').trim().isEmail().withMessage('Email invalide').normalizeEmail(),
  body('phone').trim().notEmpty().withMessage('Le numéro de téléphone est requis'),
  body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Les mots de passe doivent correspondre');
    }
    return true;
  }),
  body('agreeTerms').equals('true').withMessage('Vous devez accepter les termes et conditions')
];

// Authentication middleware
const auth = (req, res, next) => {
  // Get token from header
  const token = req.header('x-auth-token');
  
  // Check if no token
  if (!token) {
    return res.status(401).json({ message: 'Pas de token, autorisation refusée' });
  }
  
  // Verify token
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token invalide' });
  }
};

// Helper function for user registration
const registerUser = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { fullName, email, phone, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Un utilisateur avec cet email existe déjà' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      fullName,
      email,
      phone,
      password: hashedPassword
    });

    // Save user to database
    await newUser.save();

    // Create JWT payload
    const payload = {
      user: {
        id: newUser._id
      }
    };

    // Generate JWT token
    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '7d' }, // Token expires in 7 days
      (err, token) => {
        if (err) throw err;
        
        // Return success response with token and user data (without password)
        const userToReturn = {
          id: newUser._id,
          fullName: newUser.fullName,
          email: newUser.email,
          phone: newUser.phone
        };
        
        res.status(201).json({ 
          message: 'Compte créé avec succès', 
          token,
          user: userToReturn 
        });
      }
    );

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Erreur du serveur lors de la création du compte', error: error.message });
  }
};

// Use the same function for both registration endpoints
app.post('/api/signup', validateSignup, registerUser);
app.post('/api/users/register', validateSignup, registerUser);

// Login endpoint
app.post('/api/login', [
  body('email').isEmail().withMessage('Veuillez fournir un email valide'),
  body('password').exists().withMessage('Le mot de passe est requis')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Create JWT payload
    const payload = {
      user: {
        id: user._id
      }
    };

    // Generate JWT token
    jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        
        // Return success response with token and user data (without password)
        const userToReturn = {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone
        };
        
        res.json({ 
          message: 'Connexion réussie',
          token, 
          user: userToReturn 
        });
      }
    );

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Erreur du serveur lors de la connexion' });
  }
});

// Protected route example - Get current user profile
app.get('/api/user/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json(user);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Add a route to check if email exists (for frontend validation)
app.post('/api/check-email', [
  body('email').isEmail().withMessage('Email invalide')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email } = req.body;
    const existingUser = await User.findOne({ email });
    
    res.json({ exists: !!existingUser });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    // Generate a safe filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function(req, file, cb) {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Handle multer errors
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ message: 'Le fichier est trop volumineux (max 5MB)' });
    }
    return res.status(400).json({ message: `Erreur d'upload: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

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
    console.error('Error fetching equipment:', err);
    res.status(500).json({ message: 'Erreur lors de la récupération des équipements' });
  }
});

// Add new equipment
app.post('/api/equipment', upload.single('image'), handleMulterError, async (req, res) => {
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
      return res.status(404).json({ message: 'Équipement non trouvé' });
    }
    res.json(equipment);
  } catch (err) {
    console.error('Error fetching equipment:', err);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'équipement' });
  }
});

// Helper function to delete file
const deleteFile = (filePath) => {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
    } catch (err) {
      console.error('Error deleting file:', err);
    }
  }
};

// Update equipment
app.put('/api/equipment/:id', upload.single('image'), handleMulterError, async (req, res) => {
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
        deleteFile(oldEquipment.image);
      }
    }
    
    const updatedEquipment = await Equipment.findByIdAndUpdate(
      req.params.id, 
      equipmentData, 
      { new: true, runValidators: true }
    );
    
    if (!updatedEquipment) {
      return res.status(404).json({ message: 'Équipement non trouvé' });
    }
    
    res.json(updatedEquipment);
  } catch (err) {
    console.error('Error updating equipment:', err);
    res.status(400).json({ message: err.message });
  }
});

// Delete equipment
app.delete('/api/equipment/:id', async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);
    
    if (!equipment) {
      return res.status(404).json({ message: 'Équipement non trouvé' });
    }
    
  // Delete associated image
  if (equipment.image) {
    deleteFile(equipment.image);
  }
  
  await Equipment.findByIdAndDelete(req.params.id);
  res.json({ message: 'Équipement supprimé' });
} catch (err) {
  console.error('Error deleting equipment:', err);
  res.status(500).json({ message: 'Erreur lors de la suppression de l\'équipement' });
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
  console.error('Error fetching stats:', err);
  res.status(500).json({ message: 'Erreur lors de la récupération des statistiques' });
}
});

// Error handling middleware
app.use((err, req, res, next) => {
console.error('Unhandled error:', err);
res.status(500).json({ message: 'Erreur interne du serveur' });
});

// Handle 404 - Route not found
app.use((req, res) => {
res.status(404).json({ message: 'Route non trouvée' });
});

// Start server
app.listen(PORT, () => {
console.log(`Server running on port ${PORT}`);
});