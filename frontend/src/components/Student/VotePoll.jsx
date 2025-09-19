import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import socketService from '../../services/socket'
import { pollsAPI, votesAPI } from '../../services/api'
import PollResults from '../Shared/PollResults'
import ChatPopup from '../Shared/ChatPopup'

const VotePoll = ({ poll, onBack }) => {
  const { userId } = useSelector((s) => s.user)
  const [selected, setSelected] = useState(null)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [chatOpen, setChatOpen] = useState(false)

  useEffect(() => {
    let mounted = true
    const init = async () => {
      try {
        const socket = socketService.getSocket() || socketService.connect()
        socketService.joinPoll(poll._id, userId)
        socket.on('poll-updated', (data) => {
          if (data.pollId === poll._id) setResults(data.results)
        })
        const { data } = await pollsAPI.getResults(poll._id)
        if (mounted) setResults(data.results)
      } catch (e) {
        setError('Failed to load poll')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    init()
    return () => { mounted = false }
  }, [poll._id, userId])

  const submit = async () => {
    setError('')
    if (selected === null) return setError('Select an option')
    try {
      // Use socket service for real-time vote submission
      socketService.submitVote(poll._id, userId, selected)
      
      // Also submit via REST API as backup
      await votesAPI.submit({ pollId: poll._id, userId, optionIndex: selected })
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to vote')
    }
  }

  if (loading) return <div className="card"><p>Loading...</p></div>

  return (
    <div className="card">
      <button className="btn btn-secondary mb-4" onClick={onBack}>Back</button>
      <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--primary-purple)' }}>{poll.question}</h3>
      {error ? <p style={{ color: 'var(--dark-purple)' }} className="mb-2">{error}</p> : null}
      <div className="space-y-3 mb-4">
        {poll.options.map((opt, idx) => (
          <label key={idx} className="flex items-center gap-3">
            <input
              type="radio"
              name="opt"
              checked={selected === idx}
              onChange={() => setSelected(idx)}
            />
            <span style={{ color: 'var(--dark-gray)' }}>{typeof opt === 'string' ? opt : opt.text}</span>
          </label>
        ))}
      </div>
      <button className="btn btn-primary" onClick={submit}>Submit Vote</button>
      {results ? <div className="mt-6"><PollResults results={results} /></div> : null}

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

export default VotePoll


