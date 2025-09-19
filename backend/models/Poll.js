const mongoose = require('mongoose')

const optionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    trim: true
  },
  votes: {
    type: Number,
    default: 0
  }
})

const pollSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true
  },
  options: [optionSchema],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'closed'],
    default: 'draft'
  },
  timeLimit: {
    type: Number, // in seconds
    default: null
  },
  expiresAt: {
    type: Date,
    default: null
  },
  totalVotes: {
    type: Number,
    default: 0
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
})

// Index for better query performance
pollSchema.index({ status: 1, createdAt: -1 })

module.exports = mongoose.model('Poll', pollSchema)
