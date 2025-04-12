const nodemailer = require('nodemailer');

// Create a transporter using environment variables
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Welcome email template
const sendWelcomeEmail = async (email) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Bienvenue à la newsletter MediShare !',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0d4071;">Bienvenue chez MediShare !</h2>
        <p>Cher(e) abonné(e),</p>
        <p>Nous sommes ravis de vous compter parmi nos abonnés ! Votre inscription à notre newsletter a été confirmée avec succès.</p>
        <p>Vous recevrez désormais :</p>
        <ul>
          <li>Les dernières mises à jour sur la disponibilité des équipements médicaux</li>
          <li>Des offres exclusives</li>
          <li>Des conseils santé pertinents</li>
        </ul>
        <p>Si vous souhaitez vous désinscrire à tout moment, vous trouverez un lien de désinscription en bas de chaque email.</p>
        <p>Cordialement,<br>L'équipe MediShare</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully to:', email);
    return true;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return false;
  }
};

module.exports = {
  sendWelcomeEmail
}; 