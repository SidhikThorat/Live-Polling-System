const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const cors = require('cors')
const mongoose = require('mongoose')
const config = require('./config')

// Import routes
const authRoutes = require('./routes/auth')
const pollRoutes = require('./routes/polls')
const voteRoutes = require('./routes/votes')
const studentRoutes = require('./routes/students')
const chatRoutes = require('./routes/chat')

// Import socket handlers
const pollSocket = require('./socket/pollSocket')
const chatSocket = require('./socket/chatSocket')

const app = express()
const server = http.createServer(app)

// Socket.io setup
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
})

// Middleware
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Database connection
mongoose.connect(config.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
})
.then(() => console.log('✅ Connected to MongoDB Atlas'))
.catch(err => {
  console.error('❌ MongoDB Atlas connection error:', err)
  process.exit(1)
})

// MongoDB connection event handlers
mongoose.connection.on('connected', () => {
  console.log('📊 Mongoose connected to MongoDB Atlas')
})

mongoose.connection.on('error', (err) => {
  console.error('📊 Mongoose connection error:', err)
})

mongoose.connection.on('disconnected', () => {
  console.log('📊 Mongoose disconnected from MongoDB Atlas')
})

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close()
  console.log('📊 MongoDB Atlas connection closed through app termination')
  process.exit(0)
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/polls', pollRoutes)
app.use('/api/votes', voteRoutes)
app.use('/api/students', studentRoutes)
app.use('/api/chat', chatRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Live Polling System API is running' })
})

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id)
  
  // Handle poll-related socket events
  pollSocket(io, socket)
  
  // Handle chat-related socket events
  chatSocket(io, socket)
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: config.NODE_ENV === 'development' ? err.message : 'Internal server error'
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

const PORT = config.PORT
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Environment: ${config.NODE_ENV}`)
})

module.exports = { app, server }
