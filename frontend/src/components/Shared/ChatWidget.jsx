import React, { useState } from 'react'
import ChatPopup from './ChatPopup'

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false)

  const toggleChat = () => {
    setIsOpen(!isOpen)
  }

  return (
    <>
      {/* Chat button */}
      <button className="chat-toggle-btn" onClick={toggleChat} aria-label="chat">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M21 15a2 2 0 0 1-2 2H8l-5 3V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" fill="#fff"/>
        </svg>
      </button>

      {/* Chat Popup */}
      <ChatPopup isOpen={isOpen} onClose={() => setIsOpen(false)} />

      {/* Styles */}
      <style>{`
        .chat-toggle-btn {
          position: fixed;
          right: 18px;
          bottom: 18px;
          width: 46px;
          height: 46px;
          border-radius: 999px;
          border: none;
          background: linear-gradient(90deg, #7C3AED, #5BA0FF);
          box-shadow: 0 10px 30px rgba(124,58,237,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 1001;
          transition: all 0.2s ease;
        }

        .chat-toggle-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 36px rgba(124,58,237,0.16);
        }

        .chat-toggle-btn:active {
          transform: translateY(0px);
        }

        .chat-toggle-btn svg { 
          display: block;
          transition: transform 0.2s ease;
        }

        .chat-toggle-btn:hover svg {
          transform: scale(1.05);
        }
      `}</style>
    </>
  )
}

export default ChatWidget
