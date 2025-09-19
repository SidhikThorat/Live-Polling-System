const express = require('express')
const router = express.Router()
const Message = require('../models/Message')

// Get all chat messages
router.get('/', async (req, res) => {
  try {
    const messages = await Message.find()
      .populate('userId', 'name role')
      .sort({ timestamp: 1 }) // Sort by timestamp ascending (oldest first)

    // Transform messages to match frontend format
    const formattedMessages = messages.map(msg => ({
      userId: msg.userId._id || msg.userId,
      name: msg.name,
      role: msg.role,
      message: msg.message,
      timestamp: msg.timestamp
    }))

    res.json({ success: true, messages: formattedMessages })
  } catch (error) {
    console.error('Get chat messages error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Get recent chat messages (last 50)
router.get('/recent', async (req, res) => {
  try {
    const messages = await Message.find()
      .populate('userId', 'name role')
      .sort({ timestamp: -1 }) // Sort by timestamp descending (newest first)
      .limit(50)

    // Reverse to get oldest first for display
    messages.reverse()

    // Transform messages to match frontend format
    const formattedMessages = messages.map(msg => ({
      userId: msg.userId._id || msg.userId,
      name: msg.name,
      role: msg.role,
      message: msg.message,
      timestamp: msg.timestamp
    }))

    res.json({ success: true, messages: formattedMessages })
  } catch (error) {
    console.error('Get recent chat messages error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
