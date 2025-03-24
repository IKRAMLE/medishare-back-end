const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Chat');
const User = require('../models/User');

// Get chat messages between two users
router.get('/chat/:userId', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { senderId: req.user.id, receiverId: req.params.userId },
        { senderId: req.params.userId, receiverId: req.user.id }
      ]
    })
    .sort('createdAt')
    .populate('senderId', 'name')
    .populate('receiverId', 'name');

    res.json({
      success: true,
      data: messages
    });
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des messages',
      error: err.message
    });
  }
});

// Send a message
router.post('/chat/:userId', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const receiverId = req.params.userId;

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const message = new Message({
      senderId: req.user.id,
      receiverId,
      content
    });

    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'name')
      .populate('receiverId', 'name');

    res.status(201).json({
      success: true,
      data: populatedMessage
    });
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi du message',
      error: err.message
    });
  }
});

// Get recent chats list
router.get('/chats', auth, async (req, res) => {
  try {
    // Find all messages where user is either sender or receiver
    const messages = await Message.find({
      $or: [
        { senderId: req.user.id },
        { receiverId: req.user.id }
      ]
    })
    .sort('-createdAt')
    .populate('senderId', 'name')
    .populate('receiverId', 'name');

    // Get unique users from messages
    const chatUsers = new Set();
    messages.forEach(msg => {
      if (msg.senderId._id.toString() !== req.user.id) {
        chatUsers.add(msg.senderId);
      }
      if (msg.receiverId._id.toString() !== req.user.id) {
        chatUsers.add(msg.receiverId);
      }
    });

    res.json({
      success: true,
      data: Array.from(chatUsers)
    });
  } catch (err) {
    console.error('Error fetching chats:', err);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des conversations',
      error: err.message
    });
  }
});

module.exports = router;
