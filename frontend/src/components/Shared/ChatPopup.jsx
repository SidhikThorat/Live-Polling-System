import React, { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import socketService from '../../services/socket'
import { chatAPI, studentsAPI } from '../../services/api'

const ChatPopup = ({ isOpen, onClose }) => {
  const { userId, name, role } = useSelector((s) => s.user)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [activeTab, setActiveTab] = useState('chat')
  const [participants, setParticipants] = useState([])
  const [loadingParticipants, setLoadingParticipants] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadParticipants = async () => {
    setLoadingParticipants(true)
    try {
      const response = await studentsAPI.getParticipants()
      if (response.data.success) {
        setParticipants(response.data.participants || [])
      }
    } catch (error) {
      console.error('Failed to load participants:', error)
    } finally {
      setLoadingParticipants(false)
    }
  }

  const handleKickout = async (participantId) => {
    try {
      await studentsAPI.remove(participantId)
      // Reload participants after kickout
      loadParticipants()
    } catch (error) {
      console.error('Failed to kickout participant:', error)
    }
  }

  useEffect(() => {
    if (!isOpen) return

    const socket = socketService.getSocket() || socketService.connect()
    
    // Load previous messages when chat opens
    const loadPreviousMessages = async () => {
      try {
        const response = await chatAPI.getRecentMessages()
        if (response.data.success) {
          setMessages(response.data.messages || [])
        }
      } catch (error) {
        console.error('Failed to load previous messages:', error)
      }
    }

    // Join chat room
    socketService.joinChat(userId, role)
    
    const onNewMessage = (messageData) => {
      setMessages(prev => [...prev, messageData])
    }

    // Load previous messages and set up real-time listeners
    loadPreviousMessages()
    socket.on('new-message', onNewMessage)
    
    return () => {
      socket.off('new-message', onNewMessage)
      socketService.leaveChat()
    }
  }, [isOpen, userId, role])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load participants when participants tab is activated
  useEffect(() => {
    if (isOpen && activeTab === 'participants') {
      loadParticipants()
    }
  }, [isOpen, activeTab])

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
    <div className="chatbot-widget">
      <div className="chatbot-container">
        {/* Header with tabs */}
        <div className="chatbot-header">
          <div className="chatbot-tabs">
            <button
              className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              Chat
            </button>
            <button
              className={`tab-button ${activeTab === 'participants' ? 'active' : ''}`}
              onClick={() => setActiveTab('participants')}
            >
              Participants
            </button>
          </div>
          <button className="close-button" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Tab content */}
        <div className="chatbot-content">
          {activeTab === 'chat' ? (
            <>
              {/* Messages */}
              <div className="messages-container">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`message-wrapper ${msg.userId === userId ? 'own-message' : 'other-message'}`}>
                    <div className="message-name">{msg.name}</div>
                    <div className="message-bubble">
                      <div className="message-text">{msg.message}</div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={sendMessage} className="message-form">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="message-input"
                />
                <button type="submit" className="send-button">
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="participants-tab">
              {loadingParticipants ? (
                <div className="loading-message">Loading participants...</div>
              ) : participants.length === 0 ? (
                <div className="no-participants">No participants found</div>
              ) : (
                <div className="participants-list">
                  {participants.map((participant) => (
                    <div key={participant._id} className="participant-row">
                      <div className="participant-name">
                        {participant.name}
                        {participant.role === 'teacher' && <span className="role-badge">Teacher</span>}
                      </div>
                      {role === 'teacher' && participant.role === 'student' && (
                        <button
                          className="kickout-button"
                          onClick={() => handleKickout(participant._id)}
                          title="Kick out student"
                        >
                          Kick
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Styles */}
      <style>{`
        .chatbot-widget {
          position: fixed;
          bottom: 74px;
          right: 20px;
          z-index: 1000;
        }

        .chatbot-container {
          width: 350px;
          height: 450px;
          background: white;
          border-radius: 8px;
          border: 1px solid #4285F4;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .chatbot-header {
          background: white;
          color: #374151;
          padding: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #e5e7eb;
        }

        .chatbot-tabs {
          display: flex;
          gap: 8px;
        }

        .tab-button {
          background: none;
          border: none;
          color: #6b7280;
          padding: 8px 16px;
          border-radius: 0;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
          transition: all 0.2s;
          position: relative;
        }

        .tab-button.active {
          color: #111827;
          font-weight: 600;
        }

        .tab-button.active::after {
          content: '';
          position: absolute;
          bottom: -16px;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, #7c5cff 0%, #7c5cff 60%, #5767D0 100%);
        }

        .tab-button:hover {
          color: #111827;
        }

        .close-button {
          background: none;
          border: none;
          color: #6b7280;
          font-size: 20px;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .close-button:hover {
          background: #f3f4f6;
          color: #111827;
        }

        .chatbot-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .message-wrapper {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .own-message {
          align-items: flex-end;
        }

        .other-message {
          align-items: flex-start;
        }

        .message-name {
          font-size: 14px;
          font-weight: 600;
          color: #7c5cff;
          margin-bottom: 4px;
        }

        .message-bubble {
          max-width: 80%;
          padding: 8px 12px;
          border-radius: 12px;
          word-wrap: break-word;
        }

        .own-message .message-bubble {
          background: linear-gradient(90deg, #7c5cff 0%, #7c5cff 60%, #5767D0 100%);
          color: white;
        }

        .other-message .message-bubble {
          background: #374151;
          color: white;
        }

        .message-text {
          font-size: 14px;
          line-height: 1.4;
          margin: 0;
        }

        .message-form {
          padding: 12px;
          border-top: 1px solid #e5e7eb;
          display: flex;
          gap: 8px;
        }

        .message-input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
          outline: none;
        }

        .message-input:focus {
          border-color: #7C3AED;
          box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.1);
        }

        .send-button {
          background: linear-gradient(90deg, #7C3AED, #5BA0FF);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: transform 0.2s;
        }

        .send-button:hover {
          transform: translateY(-1px);
        }

        .participants-tab {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 16px;
          overflow-y: auto;
        }

        .participants-tab::before {
          
          font-size: 14px;
          color: #6b7280;
          font-weight: 500;
          margin-bottom: 12px;
        }

        .loading-message, .no-participants {
          display: flex;
          align-items: center;
          justify-content: center;
          color: #6b7280;
          font-size: 14px;
          flex: 1;
        }

        .participants-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .participant-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          background: transparent;
          border: none;
        }

        .participant-name {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          color: #111827;
          font-weight: 500;
        }

        .role-badge {
          background: linear-gradient(90deg, #7C3AED, #5BA0FF);
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .kickout-button {
          background: #ef4444;
          color: white;
          border: none;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .kickout-button:hover {
          background: #dc2626;
        }

        .kickout-button:active {
          background: #b91c1c;
        }

        /* Scrollbar styling */
        .messages-container::-webkit-scrollbar {
          width: 4px;
        }

        .messages-container::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        .messages-container::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 2px;
        }

        .messages-container::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>
    </div>
  )
}

export default ChatPopup
