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
          <h1 className="wait-message">Wait for the teacher to ask questions..</h1>
        </div>
        <ChatWidget />
        <style>{`
          .student-dashboard {
            min-height: 100vh;
            background: #ffffff;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
            color: #000;
            position: relative;
          }

          .brand-pill {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 6px 14px;
            border-radius: 999px;
            background: linear-gradient(90deg, #7c5cff 0%, #7c5cff 60%, #5767D0 100%);
            color: white;
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 40px;
            box-shadow: 0 6px 20px rgba(15,23,42,0.04);
          }

          .loading-container {
            text-align: center;
            max-width: 600px;
            width: 100%;
          }

          .loader {
            width: 40px;
            height: 40px;
            border: 3px solid #f3f4f6;
            border-top: 3px solid #7c5cff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 30px;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .wait-message {
            font-size: 1.2rem;
            font-weight: 600;
            margin: 0;
            color: #111827;
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
          <h1 className="wait-message">Wait for the teacher to ask questions..</h1>
        </div>
        <ChatWidget />
        <style>{`
          .student-dashboard {
            min-height: 100vh;
            background: #ffffff;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
            color: #000;
            position: relative;
          }

          .brand-pill {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 6px 14px;
            border-radius: 999px;
            background: linear-gradient(90deg, #7c5cff 0%, #7c5cff 60%, #5767D0 100%);
            color: white;
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 40px;
            box-shadow: 0 6px 20px rgba(15,23,42,0.04);
          }

          .loading-container {
            text-align: center;
            max-width: 600px;
            width: 100%;
          }

          .loader {
            width: 40px;
            height: 40px;
            border: 3px solid #f3f4f6;
            border-top: 3px solid #7c5cff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 30px;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .wait-message {
            font-size: 1.2rem;
            font-weight: 600;
            margin: 0;
            color: #111827;
          }
        `}</style>
      </div>
    )
  }

  // Show active poll with countdown timer
  return (
    <div className="student-dashboard">
      {/* Top Section - Question Number and Timer */}
      <div className="top-section">
        <div className="question-number">Question 1</div>
        <div className="timer">
          <svg width="16" height="16" viewBox="0 0 24 24" style={{ marginRight: 8 }}>
            <path fill="#ff0000" d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z"/>
          </svg>
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Main Poll Container */}
      <div className="poll-container">
        <div className="poll-card">
          {/* Question header - dark strip */}
          <div className="poll-header">
            <div className="question-text">{currentPoll.question}</div>
          </div>

          {/* Options body */}
          <div className="poll-body">
             {hasVoted ? (
               // Show results after voting
               <>
                 {currentPoll.options && currentPoll.options.length > 0 ? currentPoll.options.map((option, optionIndex) => {
                  const percentage = calculatePercentage(option.votes, currentPoll.totalVotes || 0)
  return (
                    <div className="option-row result-option" key={optionIndex}>
                      <div className="option-background" style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}></div>
                      <div className="option-content">
                        <div className="left">
                          <div className="num">{optionIndex + 1}</div>
                          <div className="opt-label">{option.text}</div>
                        </div>
                        <div className="percent">{percentage}%</div>
                      </div>
                    </div>
                   )
                 }) : (
                   <div className="no-options">
                     <p>No options available for this poll.</p>
                   </div>
                 )}
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

              </>
            )}
          </div>
        </div>
      </div>

      {/* Submit Button - Outside and to the left */}
      {!hasVoted && (
        <div className="submit-button-container">
          <button 
            className="vote-button"
            onClick={handleVote}
            disabled={selectedOption === null || timeLeft <= 0}
          >
            Submit
          </button>
        </div>
      )}

      {/* Wait Message - Outside the question box */}
      {hasVoted && (
        <div className="wait-message">
          Wait for the teacher to ask a new question..
        </div>
      )}

      <ChatWidget />

      {/* Styles matching the image exactly */}
      <style>{`
        .student-dashboard {
          min-height: 100vh;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 20px;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
          color: #111827;
          position: relative;
        }

        .top-section {
          display: flex;
          justify-content: flex-start;
          align-items: center;
          gap: 20px;
          width: 100%;
          max-width: 600px;
          margin-bottom: 20px;
        }

        .question-number {
          font-size: 20px;
          font-weight: 700;
          color: #111827;
        }

        .timer {
          display: flex;
          align-items: center;
          font-size: 20px;
          font-weight: 700;
          color: #ff0000;
        }

        .poll-container {
          max-width: 600px;
          width: 100%;
        }

        .poll-card {
          width: 100%;
          border-radius: 8px;
          border: 1px solid #4285F4;
          padding: 0;
          background: #ffffff;
        }

        .poll-header {
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
          padding: 12px 20px;
          background: linear-gradient(90deg, #343a40 0%, #343a40 60%, rgba(52,58,64,0.3) 100%);
          color: #ffffff;
          font-weight: 500;
          font-size: 16px;
        }

        .question-text { 
          padding-left: 0; 
        }

        .poll-body {
          padding: 20px;
          background: #ffffff;
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
        }

        .option-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 20px;
          border-radius: 8px;
          margin-bottom: 8px;
          background: #f0f0f0;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .result-option {
          background: #f0f0f0;
          cursor: default;
          overflow: hidden;
        }

        .option-background {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: linear-gradient(90deg, #7c5cff 0%, #7c5cff 60%, #5767D0 100%);
          border-radius: 8px;
          transition: width 0.5s ease;
          z-index: 1;
        }

        .option-content {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }

        .option-row:last-child { margin-bottom: 0; }

        .option-row .left {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
        }

        .num {
          width: 24px;
          height: 24px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #8b8b9f;
          color: #ffffff;
          font-weight: 600;
          font-size: 12px;
          flex-shrink: 0;
        }

        .opt-label {
          font-size: 16px;
          color: #343a40;
          font-weight: 500;
        }

        .vote-option.selected {
          background: linear-gradient(90deg, #7c5cff 0%, #7c5cff 60%, #5767D0 100%);
        }

        .vote-option.selected .num {
          background: #ffffff;
          color: #7c5cff;
        }

        .vote-option.selected .opt-label {
          color: #ffffff;
        }

        .submit-button-container {
          margin-top: 20px;
          text-align: right;
          width: 100%;
          max-width: 600px;
        }

        .vote-button {
          width: 180px;
          height: 44px;
          border: none;
          border-radius: 999px;
          background: linear-gradient(90deg, #7c5cff 0%, #7c5cff 60%, #5767D0 100%);
          color: #ffffff;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 8px 22px rgba(92,72,214,0.12);
        }

        .vote-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 12px 30px rgba(92,72,214,0.16);
        }

        .vote-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
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
          background: #f4f4f6;
          border-radius: 6px;
          overflow: hidden;
          border: 1px solid rgba(124,58,237,0.08);
          display: flex;
          align-items: center;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #7c5cff 0%, #7c5cff 60%, #5767D0 100%);
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
          font-size: 16px;
        }

        .result-option .percent {
          color: #0f1724;
          font-weight: 700;
        }

        .wait-message {
          margin-top: 20px;
          text-align: center;
          color:rgb(0, 0, 0);
          font-size: 16px;
          font-weight: 500;
          width: 100%;
          max-width: 600px;
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
