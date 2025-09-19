import React, { useState } from 'react'
import PollList from './PollList'
import VotePoll from './VotePoll'
import ChatPopup from '../Shared/ChatPopup'

const StudentDashboard = () => {
  const [activePoll, setActivePoll] = useState(null)
  const [chatOpen, setChatOpen] = useState(false)
  return (
    <div className="fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--secondary-blue)' }}>
          Student Dashboard
        </h2>
        <p className="text-gray-600">Participate in polls and view results</p>
      </div>

      {!activePoll ? (
        <PollList onSelect={(p) => setActivePoll(p)} />
      ) : (
        <VotePoll poll={activePoll} onBack={() => setActivePoll(null)} />
      )}

      {/* Recent Activity */}
      <div className="mt-8">
        <div className="card">
          <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--dark-gray)' }}>
            Recent Activity
          </h3>
          <div className="text-center py-8 text-gray-500">
            <p>No recent activity to display</p>
            <p className="text-sm mt-2">Wait for your teacher to create a poll!</p>
          </div>
        </div>
      </div>

      {/* Chat button and popup */}
      <button 
        className="chat-btn" 
        onClick={() => setChatOpen(true)} 
        aria-label="chat"
        style={{
          position: 'fixed',
          right: '18px',
          bottom: '18px',
          width: '46px',
          height: '46px',
          borderRadius: '999px',
          border: 'none',
          background: 'linear-gradient(90deg, #7C3AED, #5BA0FF)',
          boxShadow: '0 10px 30px rgba(124,58,237,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 40
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M21 15a2 2 0 0 1-2 2H8l-5 3V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" fill="#fff"/>
        </svg>
      </button>

      <ChatPopup isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  )
}

export default StudentDashboard
