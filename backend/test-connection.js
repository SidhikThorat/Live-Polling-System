const mongoose = require('mongoose')
require('dotenv').config()

const config = require('./config')

console.log('🔍 Testing MongoDB Atlas connection...')
console.log('📍 Connection URI:', config.MONGODB_URI.replace(/\/\/.*@/, '//***:***@')) // Hide credentials

mongoose.connect(config.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(async () => {
  console.log('✅ Successfully connected to MongoDB Atlas!')
  
  // Test basic operations
  const testSchema = new mongoose.Schema({
    test: String,
    timestamp: { type: Date, default: Date.now }
  })
  
  const TestModel = mongoose.model('ConnectionTest', testSchema)
  
  // Create a test document
  const testDoc = new TestModel({ test: 'MongoDB Atlas connection test' })
  await testDoc.save()
  console.log('✅ Test document saved successfully!')
  
  // Read the test document
  const savedDoc = await TestModel.findOne({ test: 'MongoDB Atlas connection test' })
  console.log('✅ Test document retrieved:', savedDoc)
  
  // Clean up test document
  await TestModel.deleteOne({ _id: savedDoc._id })
  console.log('✅ Test document cleaned up!')
  
  console.log('🎉 MongoDB Atlas is working perfectly!')
  process.exit(0)
})
.catch(err => {
  console.error('❌ MongoDB Atlas connection failed:', err.message)
  process.exit(1)
})
