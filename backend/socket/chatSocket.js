const Message = require('../models/Message')

const chatSocket = (io, socket) => {
  // Join chat room
  socket.on('join-chat', async (data) => {
    try {
      const { userId, role } = data
      socket.join('chat-room')
      console.log(`User ${userId} (${role}) joined chat`)
    } catch (error) {
      console.error('Join chat error:', error)
    }
  })

  // Send message
  socket.on('send-message', async (data) => {
    try {
      const { userId, name, role, message } = data
      
      if (!message.trim()) return

      const messageData = {
        userId,
        name,
        role,
        message: message.trim(),
        timestamp: new Date()
      }

      // Broadcast to all users in chat room
      io.to('chat-room').emit('new-message', messageData)
      console.log(`Message from ${name} (${role}): ${message}`)
    } catch (error) {
      console.error('Send message error:', error)
      socket.emit('error', { message: 'Failed to send message' })
    }
  })

  // Leave chat room
  socket.on('leave-chat', () => {
    socket.leave('chat-room')
    console.log('User left chat')
  })
}

module.exports = chatSocket
