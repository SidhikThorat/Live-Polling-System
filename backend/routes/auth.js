const express = require('express')
const router = express.Router()
const User = require('../models/User')

// Create or get user
router.post('/login', async (req, res) => {
  try {
    const { name, role } = req.body

    if (!role) {
      return res.status(400).json({ error: 'Role is required' })
    }

    if (!['teacher', 'student'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be teacher or student' })
    }

    let user

    if (role === 'teacher') {
      // For teachers, always use a single fixed teacher account
      user = await User.findOne({ role: 'teacher' })
      if (!user) {
        // Create the single fixed teacher account if it doesn't exist
        user = new User({ name: 'Teacher', role: 'teacher' })
        await user.save()
      } else {
        // Update the existing teacher's name to 'Teacher' if it's different
        if (user.name !== 'Teacher') {
          user.name = 'Teacher'
          await user.save()
        }
      }
    } else {
      // For students, use the provided name or generate a unique default name
      let studentName = name?.trim()
      
      if (!studentName) {
        // Generate unique student name like "Student 1", "Student 2", etc.
        const existingStudents = await User.find({ role: 'student' }).sort({ name: 1 })
        let studentNumber = 1
        
        // Find the next available student number
        for (const student of existingStudents) {
          const match = student.name.match(/^Student (\d+)$/)
          if (match) {
            const num = parseInt(match[1])
            if (num >= studentNumber) {
              studentNumber = num + 1
            }
          }
        }
        
        // Double-check that the generated name doesn't already exist
        studentName = `Student ${studentNumber}`
        while (await User.findOne({ name: studentName, role: 'student' })) {
          studentNumber++
          studentName = `Student ${studentNumber}`
        }
      }
      
      user = await User.findOne({ name: studentName, role: 'student' })
      
      if (!user) {
        user = new User({ name: studentName, role: 'student' })
        await user.save()
      } else if (!user.isActive) {
        // Student is kicked out, deny login
        return res.status(403).json({ 
          error: 'You have been removed from the system. Please contact the teacher.' 
        })
      }
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
