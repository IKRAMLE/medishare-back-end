const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const equipmentRoutes = require('./routes/equipment');
const userRoutes = require('./routes/user');
const favoriteRoutes = require('./routes/favorites');
const orderRoutes = require('./routes/orders');
const chatRoutes = require('./routes/chat');
const dashboardRoutes = require('./routes/dashboard');
const settingsRoutes = require('./routes/settings');
const newsletterRoutes = require('./routes/newsletterRoutes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT;
const MONGODB_URI = process.env.MONGODB_URI;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
  exposedHeaders: ['x-auth-token']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

app.use('/uploads', express.static(uploadDir));

// MongoDB Connection
mongoose.connect(MONGODB_URI)
.then(() => console.log('Connected to MongoDB Atlas'))
.catch(err => console.error('Error connecting to MongoDB:', err));

// Routes
app.use('/api', authRoutes);
app.use('/api', equipmentRoutes);
app.use('/api', userRoutes);
app.use('/api', favoriteRoutes);
app.use('/api', orderRoutes);
app.use('/api', chatRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', settingsRoutes);
app.use('/api/newsletter', newsletterRoutes);

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