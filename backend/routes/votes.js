const express = require('express')
const router = express.Router()
const Vote = require('../models/Vote')
const Poll = require('../models/Poll')

// Submit vote
router.post('/', async (req, res) => {
  try {
    const { pollId, userId, optionIndex } = req.body

    if (!pollId || !userId || optionIndex === undefined) {
      return res.status(400).json({ error: 'Poll ID, User ID, and option index are required' })
    }

    // Check if poll exists and is active
    const poll = await Poll.findById(pollId)
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' })
    }

    if (poll.status !== 'active') {
      return res.status(400).json({ error: 'Poll is not active' })
    }

    // Check if option index is valid
    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      return res.status(400).json({ error: 'Invalid option index' })
    }

    // Check if user has already voted
    const existingVote = await Vote.findOne({ poll: pollId, user: userId })
    if (existingVote) {
      return res.status(400).json({ error: 'User has already voted on this poll' })
    }

    // Create new vote
    const vote = new Vote({
      poll: pollId,
      user: userId,
      optionIndex
    })

    await vote.save()

    // Update poll vote count
    poll.options[optionIndex].votes += 1
    poll.totalVotes += 1
    await poll.save()

    res.status(201).json({ success: true, vote })
  } catch (error) {
    console.error('Submit vote error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Get user's vote for a poll
router.get('/user/:userId/poll/:pollId', async (req, res) => {
  try {
    const { userId, pollId } = req.params

    const vote = await Vote.findOne({ poll: pollId, user: userId })
    
    res.json({ success: true, vote })
  } catch (error) {
    console.error('Get user vote error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

// Get all votes for a poll
router.get('/poll/:pollId', async (req, res) => {
  try {
    const { pollId } = req.params

    const votes = await Vote.find({ poll: pollId })
      .populate('user', 'name role')

    res.json({ success: true, votes })
  } catch (error) {
    console.error('Get poll votes error:', error)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
