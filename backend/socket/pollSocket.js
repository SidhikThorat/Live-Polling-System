const Poll = require('../models/Poll')
const Vote = require('../models/Vote')

const pollSocket = (io, socket) => {
  // Join poll room
  socket.on('join-poll', async (data) => {
    try {
      const { pollId, userId } = data
      
      if (!pollId || !userId) {
        socket.emit('error', { message: 'Poll ID and User ID are required' })
        return
      }

      // Join the poll room
      socket.join(`poll-${pollId}`)
      
      // Get current poll data
      const poll = await Poll.findById(pollId).populate('createdBy', 'name role')
      if (poll) {
        socket.emit('poll-joined', { poll })
      }

      console.log(`User ${userId} joined poll ${pollId}`)
    } catch (error) {
      console.error('Join poll error:', error)
      socket.emit('error', { message: 'Failed to join poll' })
    }
  })

  // Leave poll room
  socket.on('leave-poll', (data) => {
    const { pollId } = data
    socket.leave(`poll-${pollId}`)
    console.log(`User left poll ${pollId}`)
  })

  // Handle new vote
  socket.on('vote-submitted', async (data) => {
    try {
      const { pollId, userId, optionIndex } = data

      // Check if poll exists and is active
      const poll = await Poll.findById(pollId)
      if (!poll) {
        socket.emit('error', { message: 'Poll not found' })
        return
      }

      if (poll.status !== 'active') {
        socket.emit('error', { message: 'Poll is not active' })
        return
      }

      // Check if user has already voted
      const existingVote = await Vote.findOne({ poll: pollId, user: userId })
      if (existingVote) {
        socket.emit('error', { message: 'You have already voted on this poll' })
        return
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

      // Get updated results
      const votes = await Vote.find({ poll: pollId })
      const totalVotes = votes.length

      const results = poll.options.map((option, index) => {
        const optionVotes = votes.filter(vote => vote.optionIndex === index).length
        const percentage = totalVotes > 0 ? (optionVotes / totalVotes) * 100 : 0
        
        return {
          text: option.text,
          votes: optionVotes,
          percentage: Math.round(percentage * 100) / 100
        }
      })

      // Broadcast updated results to all users in the poll room
      io.to(`poll-${pollId}`).emit('poll-updated', {
        pollId,
        results: {
          question: poll.question,
          totalVotes,
          options: results
        }
      })

      console.log(`Vote submitted for poll ${pollId} by user ${userId}`)
    } catch (error) {
      console.error('Vote submission error:', error)
      socket.emit('error', { message: 'Failed to submit vote' })
    }
  })

  // Handle poll status changes
  socket.on('poll-status-changed', async (data) => {
    try {
      const { pollId, status } = data

      const poll = await Poll.findById(pollId)
      if (!poll) {
        socket.emit('error', { message: 'Poll not found' })
        return
      }

      poll.status = status
      
      // Set expiration if time limit is set and poll is being activated
      if (status === 'active' && poll.timeLimit) {
        poll.expiresAt = new Date(Date.now() + poll.timeLimit * 60 * 1000)
      }

      await poll.save()

      // Broadcast status change to all users in the poll room
      io.to(`poll-${pollId}`).emit('poll-status-updated', {
        pollId,
        status,
        expiresAt: poll.expiresAt
      })

      console.log(`Poll ${pollId} status changed to ${status}`)
    } catch (error) {
      console.error('Poll status change error:', error)
      socket.emit('error', { message: 'Failed to update poll status' })
    }
  })

  // Handle new poll creation
  socket.on('poll-created', async (data) => {
    try {
      const { poll } = data

      // Broadcast new poll to all connected users
      io.emit('new-poll-available', { poll })

      console.log(`New poll created: ${poll.question}`)
    } catch (error) {
      console.error('Poll creation broadcast error:', error)
    }
  })
}

module.exports = pollSocket
