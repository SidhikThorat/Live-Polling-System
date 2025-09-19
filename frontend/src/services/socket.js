import { io } from 'socket.io-client'
import { store } from '../store/index'
import { connect, connected, disconnected, setError } from '../store/socketSlice'

class SocketService {
  constructor() {
    this.socket = null
    this.isConnected = false
  }

  connect() {
    if (this.socket && this.isConnected) {
      return this.socket
    }

    this.socket = io('http://localhost:5000', {
      transports: ['websocket'],
      autoConnect: true,
    })

    // Store socket in Redux
    store.dispatch(connect(this.socket))

    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to server')
      this.isConnected = true
      store.dispatch(connected())
    })

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server')
      this.isConnected = false
      store.dispatch(disconnected())
    })

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error)
      store.dispatch(setError(error.message))
    })

    // Poll events
    this.socket.on('poll-joined', (data) => {
      console.log('Joined poll:', data)
    })

    this.socket.on('poll-updated', (data) => {
      console.log('Poll updated:', data)
      // Dispatch to Redux store
      store.dispatch({
        type: 'polls/updateResults',
        payload: { pollId: data.pollId, results: data.results }
      })
    })

    this.socket.on('poll-status-updated', (data) => {
      console.log('Poll status updated:', data)
      // Dispatch to Redux store
      store.dispatch({
        type: 'polls/updatePoll',
        payload: { id: data.pollId, status: data.status, expiresAt: data.expiresAt }
      })
    })

    this.socket.on('new-poll-available', (data) => {
      console.log('New poll available:', data)
      // Dispatch to Redux store
      store.dispatch({
        type: 'polls/addPoll',
        payload: data.poll
      })
    })

    this.socket.on('error', (data) => {
      console.error('Socket error:', data)
      store.dispatch(setError(data.message))
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
    }
  }

  // Poll-related methods
  joinPoll(pollId, userId) {
    if (this.socket) {
      this.socket.emit('join-poll', { pollId, userId })
    }
  }

  leavePoll(pollId) {
    if (this.socket) {
      this.socket.emit('leave-poll', { pollId })
    }
  }

  submitVote(pollId, userId, optionIndex) {
    if (this.socket) {
      this.socket.emit('vote-submitted', { pollId, userId, optionIndex })
    }
  }

  changePollStatus(pollId, status) {
    if (this.socket) {
      this.socket.emit('poll-status-changed', { pollId, status })
    }
  }

  broadcastNewPoll(poll) {
    if (this.socket) {
      this.socket.emit('poll-created', { poll })
    }
  }

  // Chat methods
  joinChat(userId, role) {
    if (this.socket) {
      this.socket.emit('join-chat', { userId, role })
    }
  }

  leaveChat() {
    if (this.socket) {
      this.socket.emit('leave-chat')
    }
  }

  sendMessage(messageData) {
    if (this.socket) {
      this.socket.emit('send-message', messageData)
    }
  }

  getSocket() {
    return this.socket
  }
}

// Create singleton instance
const socketService = new SocketService()

export default socketService
