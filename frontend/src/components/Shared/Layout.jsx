import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { logout } from '../../store/userSlice'
import ChatPopup from './ChatPopup'

const Layout = ({ children }) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { role, name } = useSelector(state => state.user)
  const [chatOpen, setChatOpen] = useState(false)

  const handleLogout = () => {
    dispatch(logout())
    navigate('/')
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background-dark)' }}>
      {/* Header */}
      <header className="p-4" style={{ backgroundColor: 'var(--dark-gray)' }}>
        <div className="container flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--primary-purple)' }}>
              Live Polling System
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-light)' }}>
              Welcome, {name} ({role})
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setChatOpen(true)}
              className="btn btn-secondary"
            >
              💬 Chat
            </button>
            <button
              onClick={handleLogout}
              className="btn btn-secondary"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container p-8">
        {children}
      </main>

      {/* Chat Popup */}
      <ChatPopup isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  )
}

export default Layout
