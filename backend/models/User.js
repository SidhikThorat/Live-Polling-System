const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['teacher', 'student'],
    required: true
  },
  socketId: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// Ensure only one teacher can exist in the system
userSchema.index({ role: 1 }, { 
  unique: true, 
  partialFilterExpression: { role: 'teacher' } 
})

module.exports = mongoose.model('User', userSchema)
