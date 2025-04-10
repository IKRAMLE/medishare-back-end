const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
require('dotenv').config();

// In a real production app, use dotenv to load from .env file
const JWT_SECRET = process.env.JWT_SECRET;

exports.registerUser = async (req, res) => {
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
      { expiresIn: '1h' }, 
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

exports.loginUser = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'Email ou mot de passe incorrect' 
      });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false,
        message: 'Email ou mot de passe incorrect' 
      });
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
      { expiresIn: '1h' }, 
      (err, token) => {
        if (err) throw err;
        
        // Return success response with token and user data (without password)
        const userToReturn = {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          role: user.role
        };
        
        res.json({ 
          success: true,
          message: 'Connexion réussie',
          token, 
          user: userToReturn 
        });
      }
    );

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur du serveur lors de la connexion',
      error: error.message 
    });
  }
};

exports.checkEmail = async (req, res) => {
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
};