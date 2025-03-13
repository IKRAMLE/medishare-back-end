const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// JWT Secret Key (in production, move this to environment variables)
const JWT_SECRET = 'medishare-secret-key-2025';

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb+srv://ikramlechqer:ikramlechqer@cluster0.owgf0.mongodb.net/Medical-Equipment?retryWrites=true&w=majority&appName=Cluster0', {
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

// Create account endpoint - KEEP ORIGINAL ENDPOINT
app.post('/api/signup', validateSignup, async (req, res) => {
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
});

// ADD SECOND ENDPOINT TO MATCH FRONTEND URL
app.post('/api/users/register', validateSignup, async (req, res) => {
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
});

// Login endpoint
app.post('/api/login', [
  body('email').isEmail().withMessage('Veuillez fournir un email valide'),
  body('password').exists().withMessage('Le mot de passe est requis')
], async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
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


// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});