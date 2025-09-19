import React, { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import socketService from '../../services/socket'

const ChatPopup = ({ isOpen, onClose }) => {
  const { userId, name, role } = useSelector((s) => s.user)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (!isOpen) return

    const socket = socketService.getSocket() || socketService.connect()
    
    // Join chat room
    socketService.joinChat(userId, role)
    
    const onNewMessage = (messageData) => {
      setMessages(prev => [...prev, messageData])
    }

    socket.on('new-message', onNewMessage)
    
    return () => {
      socket.off('new-message', onNewMessage)
      socketService.leaveChat()
    }
  }, [isOpen, userId, role])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const messageData = {
      userId,
      name,
      role,
      message: newMessage.trim()
    }

    socketService.sendMessage(messageData)
    setNewMessage('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md h-96 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b" style={{ backgroundColor: 'var(--primary-purple)' }}>
          <h3 className="text-white font-semibold">Chat</h3>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-xl"
          >
            ×
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === role ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs p-2 rounded-lg ${
                  msg.role === role
                    ? 'text-white'
                    : 'text-gray-800'
                }`}
                style={{
                  backgroundColor: msg.role === role 
                    ? 'var(--primary-purple)' 
                    : 'var(--light-gray)'
                }}
              >
                <div className="text-xs opacity-75">{msg.name} ({msg.role})</div>
                <div>{msg.message}</div>
                <div className="text-xs opacity-75">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="p-4 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 input"
            />
            <button type="submit" className="btn btn-primary">
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ChatPopup
