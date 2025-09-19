const express = require('express')
const router = express.Router()
const User = require('../models/User')

// Create or get user
router.post('/login', async (req, res) => {
  try {
    const { name, role } = req.body

    if (!name || !role) {
      return res.status(400).json({ error: 'Name and role are required' })
    }

    if (!['teacher', 'student'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be teacher or student' })
    }

    // Find existing user or create new one
    let user = await User.findOne({ name, role })
    if (!user) {
      user = new User({ name, role })
      await user.save()
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        role: user.role
      }
    })
  } catch (error) {
    console.error('Auth error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Update user socket ID
router.put('/socket/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    const { socketId } = req.body

    const user = await User.findByIdAndUpdate(
      userId,
      { socketId },
      { new: true }
    )

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ success: true, user })
  } catch (error) {
    console.error('Socket update error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Get user by ID
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    const user = await User.findById(userId)

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json({ success: true, user })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
