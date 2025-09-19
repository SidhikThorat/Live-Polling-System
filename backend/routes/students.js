const express = require('express')
const router = express.Router()
const User = require('../models/User')
const { io } = require('../app')

// List active students
router.get('/', async (req, res) => {
  try {
    const students = await User.find({ role: 'student', isActive: true }).select('name role socketId')
    res.json({ success: true, students })
  } catch (error) {
    console.error('Get students error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Remove a student (good-to-have)
router.put('/:id/remove', async (req, res) => {
  try {
    const { id } = req.params
    const user = await User.findById(id)
    if (!user) return res.status(404).json({ error: 'User not found' })

    user.isActive = false
    await user.save()

    // Inform and disconnect if connected
    if (user.socketId && io) {
      io.to(user.socketId).emit('removed', { reason: 'Removed by teacher' })
      try { io.sockets.sockets.get(user.socketId)?.disconnect(true) } catch (_) {}
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Remove student error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router


