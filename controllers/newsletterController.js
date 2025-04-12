const Subscriber = require('../models/Subscriber');
const { sendWelcomeEmail } = require('../utils/emailService');

// Subscribe to newsletter
exports.subscribe = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if email already exists
    const existingSubscriber = await Subscriber.findOne({ email });
    if (existingSubscriber) {
      return res.status(400).json({
        success: false,
        message: "Cette adresse email est déjà inscrite à notre newsletter."
      });
    }

    // Create new subscriber
    const subscriber = new Subscriber({ email });
    await subscriber.save();

    // Send welcome email
    const emailSent = await sendWelcomeEmail(email);
    
    if (!emailSent) {
      console.warn('Failed to send welcome email to:', email);
    }

    res.status(201).json({
      success: true,
      message: "Merci de votre inscription ! Vous recevrez bientôt nos actualités."
    });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    res.status(500).json({
      success: false,
      message: "Une erreur est survenue lors de l'inscription. Veuillez réessayer plus tard."
    });
  }
};

// Unsubscribe from newsletter
exports.unsubscribe = async (req, res) => {
  try {
    const { email } = req.params;

    const subscriber = await Subscriber.findOne({ email });
    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: "Adresse email non trouvée."
      });
    }

    subscriber.isActive = false;
    await subscriber.save();

    res.status(200).json({
      success: true,
      message: "Vous avez été désinscrit de notre newsletter avec succès."
    });
  } catch (error) {
    console.error('Newsletter unsubscribe error:', error);
    res.status(500).json({
      success: false,
      message: "Une erreur est survenue lors de la désinscription. Veuillez réessayer plus tard."
    });
  }
}; 