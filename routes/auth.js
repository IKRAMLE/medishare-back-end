const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');

const router = express.Router();

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

const validateLogin = [
  body('email').isEmail().withMessage('Veuillez fournir un email valide'),
  body('password').exists().withMessage('Le mot de passe est requis')
];

// Routes
router.post('/signup', validateSignup, authController.registerUser);
router.post('/users/register', validateSignup, authController.registerUser);
router.post('/login', validateLogin, authController.loginUser);
router.post('/check-email', [
  body('email').isEmail().withMessage('Email invalide')
], authController.checkEmail);

module.exports = router;