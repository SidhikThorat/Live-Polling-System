import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { pollsAPI, votesAPI } from '../../services/api'
import socketService from '../../services/socket'
import ChatWidget from '../Shared/ChatWidget'

const StudentDashboard = () => {
  const { userId } = useSelector((s) => s.user)
  const [currentPoll, setCurrentPoll] = useState(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [hasVoted, setHasVoted] = useState(false)
  const [selectedOption, setSelectedOption] = useState(null)
  const [loading, setLoading] = useState(true)
  const [joinedPollId, setJoinedPollId] = useState(null) // Track which poll we've joined

  // Fetch active poll only once on mount
  useEffect(() => {
    const fetchActivePoll = async () => {
      try {
        const { data } = await pollsAPI.getActive()
        const activePolls = data.polls || []
        
        if (activePolls.length > 0) {
          const poll = activePolls[0] // Get the first active poll
          setCurrentPoll(poll)
          
          // Join poll room manually
          socketService.joinPoll(poll._id, userId)
          setJoinedPollId(poll._id)
          console.log('Student joined initial poll room:', poll._id)
          
          // Calculate time left if poll has time limit
          if (poll.expiresAt) {
            const now = new Date().getTime()
            const expires = new Date(poll.expiresAt).getTime()
            const timeRemaining = Math.max(0, Math.floor((expires - now) / 1000))
            
            // If the time remaining is more than 24 hours, something is wrong with the calculation
            if (timeRemaining > 86400) {
              setTimeLeft(poll.timeLimit || 60)
            } else {
              setTimeLeft(timeRemaining)
            }
          } else if (poll.timeLimit) {
            setTimeLeft(poll.timeLimit)
          }

          // Check if user has already voted
          try {
            const voteResponse = await votesAPI.getUserVote(userId, poll._id)
            if (voteResponse.data.vote) {
              setHasVoted(true)
            }
          } catch (voteError) {
            console.log('No existing vote found or error checking vote:', voteError)
          }
        } else {
          setCurrentPoll(null)
        }
      } catch (error) {
        console.error('Failed to fetch active poll:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivePoll()
  }, []) // Only run once on mount

  // Set up socket listeners only once
  useEffect(() => {
    const socket = socketService.getSocket() || socketService.connect()
    
    const handleNewPoll = (data) => {
      const poll = data.poll // Extract poll from the payload
      console.log('New poll received:', poll)
      setCurrentPoll(poll)
      setHasVoted(false)
      setSelectedOption(null)
      
      // Join poll room manually
      if (joinedPollId !== poll._id) {
        socketService.joinPoll(poll._id, userId)
        setJoinedPollId(poll._id)
        console.log('Student joined new poll room:', poll._id)
      }
      
      // Calculate time left for new poll
      if (poll.expiresAt) {
        const now = new Date().getTime()
        const expires = new Date(poll.expiresAt).getTime()
        const timeRemaining = Math.max(0, Math.floor((expires - now) / 1000))
        
        if (timeRemaining > 86400) {
          setTimeLeft(poll.timeLimit || 60)
        } else {
          setTimeLeft(timeRemaining)
        }
      } else if (poll.timeLimit) {
        setTimeLeft(poll.timeLimit)
      }
    }

    const handlePollUpdate = (data) => {
      setCurrentPoll(prevPoll => {
        if (!prevPoll || prevPoll._id !== data.pollId) return prevPoll
        
        const updatedPoll = {
          ...prevPoll,
          totalVotes: data.results.totalVotes,
          options: data.results.options.map((result, index) => ({
            ...prevPoll.options[index],
            votes: result.votes
          }))
        }
        
        return updatedPoll
      })
    }

    const handlePollClosed = (data) => {
      setCurrentPoll(prevPoll => {
        if (prevPoll?._id === data.pollId) {
          setJoinedPollId(null)
          setHasVoted(false)
          setSelectedOption(null)
          setTimeLeft(0)
          return null
        }
        return prevPoll
      })
    }

    const handlePollStatusUpdate = (data) => {
      console.log('Poll status updated:', data)
      if (data.status === 'active' && !currentPoll) {
        // Fetch the active poll when a poll becomes active
        fetchActivePoll()
      }
    }

    const handleSocketError = (data) => {
      console.error('Socket error:', data)
      if (data.message?.includes('already voted')) {
        setHasVoted(true)
        console.log('User has already voted, showing results')
      } else {
        alert(`Error: ${data.message}`)
      }
    }

    socket.on('new-poll-available', handleNewPoll)
    socket.on('poll-updated', handlePollUpdate)
    socket.on('poll-closed', handlePollClosed)
    socket.on('poll-status-updated', handlePollStatusUpdate)
    socket.on('error', handleSocketError)

    return () => {
      socket.off('new-poll-available', handleNewPoll)
      socket.off('poll-updated', handlePollUpdate)
      socket.off('poll-closed', handlePollClosed)
      socket.off('poll-status-updated', handlePollStatusUpdate)
      socket.off('error', handleSocketError)
    }
  }, []) // Only run once on mount

  // Handle poll room joining manually in event handlers

  // Countdown timer effect
  useEffect(() => {
    if (timeLeft > 0 && currentPoll) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Time's up - poll should be closed
            console.log('Timer expired, clearing poll and leaving room')
            if (currentPoll) {
              socketService.leavePoll(currentPoll._id)
            }
            setJoinedPollId(null)
            setCurrentPoll(null)
            setHasVoted(false)
            setSelectedOption(null)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [timeLeft]) // Removed currentPoll from dependencies to prevent timer restart

  // Separate effect to handle timer expiration
  useEffect(() => {
    if (timeLeft === 0 && currentPoll) {
      console.log('Timer reached 0, clearing poll and leaving room')
      socketService.leavePoll(currentPoll._id)
      setJoinedPollId(null)
      setCurrentPoll(null)
      setHasVoted(false)
      setSelectedOption(null)
    }
  }, [timeLeft, currentPoll])

  // Cleanup effect - leave poll room when component unmounts
  useEffect(() => {
    return () => {
      if (joinedPollId) {
        console.log('Component unmounting, leaving poll room:', joinedPollId)
        socketService.leavePoll(joinedPollId)
      }
    }
  }, [joinedPollId])

  // Handle vote submission
  const handleVote = async () => {
    if (selectedOption === null || !currentPoll || hasVoted) return

    try {
      // Submit vote via socket for real-time updates
      socketService.submitVote(currentPoll._id, userId, selectedOption)
      
      // Set hasVoted to true immediately for UI feedback
      setHasVoted(true)
      console.log('Vote submitted via socket')
    } catch (error) {
      console.error('Failed to submit vote:', error)
      alert('Failed to submit vote. Please try again.')
    }
  }

  // Format time display
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // Calculate percentage for results display
  const calculatePercentage = (votes, totalVotes) => {
    if (totalVotes === 0) return 0
    return Math.round((votes / totalVotes) * 100)
  }

  if (loading) {
    return (
      <div className="student-dashboard">
        <div className="brand-pill">✦ Intervue Poll</div>
        <div className="loading-container">
          <div className="loader"></div>
          <h1 className="wait-message">Wait for teacher to ask questions...</h1>
        </div>
        <ChatWidget />
        <style>{`
          .student-dashboard {
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
            color: white;
          }

          .brand-pill {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 12px 20px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 40px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          }

          .loading-container {
            text-align: center;
            max-width: 600px;
            width: 100%;
          }

          .loader {
            width: 60px;
            height: 60px;
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top: 4px solid #7C3AED;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 30px;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .wait-message {
            font-size: 1.5rem;
            font-weight: 600;
            margin: 0;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          }
        `}</style>
      </div>
    )
  }

  // Show loading state when no active poll
  if (!currentPoll) {
    return (
      <div className="student-dashboard">
        <div className="brand-pill">✦ Intervue Poll</div>
        <div className="loading-container">
          <div className="loader"></div>
          <h1 className="wait-message">Wait for teacher to ask questions...</h1>
        </div>
        <ChatWidget />
        <style>{`
          .student-dashboard {
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
            color: white;
          }

          .brand-pill {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 12px 20px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 40px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          }

          .loading-container {
            text-align: center;
            max-width: 600px;
            width: 100%;
          }

          .loader {
            width: 60px;
            height: 60px;
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top: 4px solid #7C3AED;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 30px;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .wait-message {
            font-size: 1.5rem;
            font-weight: 600;
            margin: 0;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          }
        `}</style>
      </div>
    )
  }

  // Show active poll with countdown timer
  return (
    <div className="student-dashboard">
      <div className="brand-pill">✦ Intervue Poll</div>
      
      {/* Countdown Timer */}
      <div className="countdown-container">
        <div className="countdown-timer">
          Time Remaining: {formatTime(timeLeft)}
        </div>
      </div>

      {/* Poll Card - matches poll history styling */}
      <div className="poll-container">
        <div className="poll-card">
          {/* Question header - dark strip */}
          <div className="poll-header">
            <div className="question-text">"{currentPoll.question}"</div>
          </div>

          {/* Options body */}
          <div className="poll-body">
             {hasVoted ? (
               // Show results after voting
               <>
                 {currentPoll.options && currentPoll.options.length > 0 ? currentPoll.options.map((option, optionIndex) => {
                  const percentage = calculatePercentage(option.votes, currentPoll.totalVotes || 0)
  return (
                    <div className="option-row" key={optionIndex}>
                      <div className="left">
                        <div className="num">{optionIndex + 1}</div>
                        <div className="opt-label">{option.text}</div>
      </div>

                      <div className="right">
                        <div className="progress-wrap">
                          <div className="progress-track">
                            <div
                              className="progress-fill"
                              style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
                            />
                          </div>
                          <div className="percent">{percentage}%</div>
                        </div>
                      </div>
                    </div>
                   )
                 }) : (
                   <div className="no-options">
                     <p>No options available for this poll.</p>
                   </div>
                 )}

                 <div className="total-votes">
                   Total votes: {currentPoll.totalVotes || 0}
                 </div>
               </>
             ) : (
               // Show voting options
               <>
                 {currentPoll.options && currentPoll.options.length > 0 ? currentPoll.options.map((option, optionIndex) => (
                  <div 
                    key={optionIndex}
                    className={`option-row vote-option ${selectedOption === optionIndex ? 'selected' : ''}`}
                    onClick={() => setSelectedOption(optionIndex)}
                  >
                    <div className="left">
                      <div className="num">{optionIndex + 1}</div>
                      <div className="opt-label">{option.text}</div>
                    </div>
                   </div>
                 )) : (
                   <div className="no-options">
                     <p>No options available for this poll.</p>
                   </div>
                 )}

                 <div className="vote-button-container">
                  <button 
                    className="vote-button"
                    onClick={handleVote}
                    disabled={selectedOption === null || timeLeft <= 0}
                  >
                    Submit Vote
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <ChatWidget />

      {/* Styles matching poll history */}
      <style>{`
        :root{
          --page-white: #ffffff;
          --muted: #6b7280;
          --border-purple: rgba(124,58,237,0.15);
          --purple-strong: #7C3AED;
          --purple-2: #5BA0FF;
          --dark-header-start: #3a3a3a;
          --dark-header-end: #6f6f6f;
          --card-shadow: rgba(16,24,40,0.04);
          --track-bg: #f4f4f6;
        }

        .student-dashboard {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
          color: white;
          position: relative;
        }

        .brand-pill {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 12px 20px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 30px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .countdown-container {
          margin-bottom: 24px;
          text-align: center;
        }

        .countdown-timer {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 12px;
          padding: 12px 24px;
          color: white;
          font-size: 1.2rem;
          font-weight: 700;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }

        .poll-container {
          max-width: 800px;
          width: 100%;
        }

        .poll-card {
          width: 100%;
          border-radius: 8px;
          border: 2px solid rgba(124,58,237,0.12);
          padding: 0;
          box-shadow: 0 6px 24px var(--card-shadow);
          background: transparent;
        }

        .poll-header {
          border-top-left-radius: 6px;
          border-top-right-radius: 6px;
          padding: 12px 16px;
          background: linear-gradient(90deg, var(--dark-header-start), var(--dark-header-end));
          color: #fff;
          font-weight: 600;
          font-size: 14px;
        }

        .question-text { 
          padding-left: 6px; 
        }

        .poll-body {
          padding: 18px;
          background: #fff;
          border-bottom-left-radius: 6px;
          border-bottom-right-radius: 6px;
        }

        .option-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid rgba(124,58,237,0.06);
          margin-bottom: 12px;
          background: #fff;
        }

        .option-row:last-child { margin-bottom: 0; }

        .option-row .left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 260px;
        }

        .num {
          width: 34px;
          height: 34px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--purple-strong);
          color: #fff;
          font-weight: 700;
          box-shadow: 0 6px 14px rgba(124,58,237,0.12);
          font-size: 14px;
          flex-shrink: 0;
        }

        .opt-label {
          font-size: 15px;
          color: #0f1724;
        }

        .right { 
          display: flex; 
          align-items: center; 
          gap: 12px; 
          width: 360px; 
        }

        .progress-wrap { 
          display: flex; 
          align-items: center; 
          gap: 12px; 
          width: 100%; 
        }

        .progress-track {
          flex: 1;
          height: 28px;
          background: var(--track-bg);
          border-radius: 6px;
          overflow: hidden;
          border: 1px solid rgba(124,58,237,0.08);
          display: flex;
          align-items: center;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--purple-strong), var(--purple-2));
          border-top-right-radius: 6px;
          border-bottom-right-radius: 6px;
          border-top-left-radius: 6px;
          border-bottom-left-radius: 6px;
          transition: width 500ms ease;
        }

        .percent {
          min-width: 44px;
          text-align: right;
          font-weight: 700;
          color: #0f1724;
        }

        .total-votes {
          margin-top: 16px;
          padding: 12px;
          background-color: #f8f9fa;
          border-radius: 8px;
          text-align: center;
          color: #6b7280;
          font-size: 14px;
        }

        .vote-option {
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .vote-option:hover {
          background: rgba(124,58,237,0.05);
          border-color: rgba(124,58,237,0.2);
        }

        .vote-option.selected {
          background: rgba(124,58,237,0.1);
          border-color: var(--purple-strong);
        }

        .vote-button-container {
          margin-top: 20px;
          text-align: center;
        }

        .vote-button {
          background: linear-gradient(90deg, var(--purple-strong), var(--purple-2));
          color: white;
          border: none;
          padding: 12px 32px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(124,58,237,0.3);
        }

        .vote-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(124,58,237,0.4);
        }

        .vote-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        @media (max-width: 768px) {
          .student-dashboard { padding: 15px; }
          .right { width: 46%; }
          .poll-card { width: 100%; }
        }
      `}</style>
    </div>
  )
}

export default StudentDashboard
