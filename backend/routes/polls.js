const express = require('express')
const router = express.Router()
const Poll = require('../models/Poll')
const Vote = require('../models/Vote')

// Get all polls
router.get('/', async (req, res) => {
  try {
    const polls = await Poll.find()
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 })

    res.json({ success: true, polls })
  } catch (error) {
    console.error('Get polls error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Get active polls
router.get('/active', async (req, res) => {
  try {
    const polls = await Poll.find({ status: 'active' })
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 })

    res.json({ success: true, polls })
  } catch (error) {
    console.error('Get active polls error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Get poll by ID
router.get('/:id', async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id)
      .populate('createdBy', 'name role')

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' })
    }

    res.json({ success: true, poll })
  } catch (error) {
    console.error('Get poll error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Create new poll
router.post('/', async (req, res) => {
  try {
    const { question, options, createdBy, timeLimit } = req.body

    if (!question || !options || !createdBy) {
      return res.status(400).json({ error: 'Question, options, and createdBy are required' })
    }

    if (options.length < 2) {
      return res.status(400).json({ error: 'At least 2 options are required' })
    }

    // Verify that the creator is the single teacher
    const User = require('../models/User')
    const teacher = await User.findById(createdBy)
    if (!teacher || teacher.role !== 'teacher' || teacher.name !== 'Teacher') {
      return res.status(403).json({ error: 'Only the system teacher can create polls' })
    }

    const poll = new Poll({
      question,
      options: options.map(option => ({ text: option, votes: 0 })),
      createdBy,
      timeLimit: timeLimit || null
    })

    await poll.save()
    await poll.populate('createdBy', 'name role')

    res.status(201).json({ success: true, poll })
  } catch (error) {
    console.error('Create poll error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Update poll status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!['draft', 'active', 'closed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    const poll = await Poll.findById(id).populate('createdBy', 'name role')
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' })
    }

    // Verify that only the single teacher can update poll status
    if (!poll.createdBy || poll.createdBy.role !== 'teacher' || poll.createdBy.name !== 'Teacher') {
      return res.status(403).json({ error: 'Only the system teacher can update poll status' })
    }

    poll.status = status
    
    // Set expiration if time limit is set and poll is being activated
    if (status === 'active' && poll.timeLimit) {
      poll.expiresAt = new Date(Date.now() + poll.timeLimit * 60 * 1000)
    }

    await poll.save()
    await poll.populate('createdBy', 'name role')

    res.json({ success: true, poll })
  } catch (error) {
    console.error('Update poll status error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Get poll results
router.get('/:id/results', async (req, res) => {
  try {
    const { id } = req.params

    const poll = await Poll.findById(id)
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' })
    }

    const votes = await Vote.find({ poll: id })
    const totalVotes = votes.length

    // Calculate results
    const results = poll.options.map((option, index) => {
      const optionVotes = votes.filter(vote => vote.optionIndex === index).length
      const percentage = totalVotes > 0 ? (optionVotes / totalVotes) * 100 : 0
      
      return {
        text: option.text,
        votes: optionVotes,
        percentage: Math.round(percentage * 100) / 100
      }
    })

    res.json({
      success: true,
      results: {
        question: poll.question,
        totalVotes,
        options: results
      }
    })
  } catch (error) {
    console.error('Get poll results error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
