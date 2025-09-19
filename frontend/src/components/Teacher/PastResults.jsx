import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { pollsAPI } from '../../services/api'
import socketService from '../../services/socket'
import ChatWidget from '../Shared/ChatWidget'

const PastResults = ({ refreshKey = 0 }) => {
  const navigate = useNavigate()
  const [allPolls, setAllPolls] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchPolls = async () => {
    setLoading(true)
    try {
      const { data } = await pollsAPI.getAll()
      console.log('Fetched all polls:', data.polls)
      setAllPolls(data.polls || [])
    } finally {
      setLoading(false)
    }
  }

  // Set up real-time updates for poll results
  useEffect(() => {
    const socket = socketService.getSocket() || socketService.connect()
    
    const onPollUpdate = (payload) => {
      console.log('Poll updated:', payload)
      // Update the specific poll in our state
      setAllPolls(prevPolls => 
        prevPolls.map(poll => 
          poll._id === payload.pollId 
            ? { ...poll, ...payload.poll }
            : poll
        )
      )
    }

    const onVoteUpdate = (payload) => {
      console.log('Vote update received:', payload)
      // Update poll with new vote counts
      setAllPolls(prevPolls => 
        prevPolls.map(poll => 
          poll._id === payload.pollId 
            ? { 
                ...poll, 
                options: payload.options || poll.options,
                totalVotes: payload.totalVotes || poll.totalVotes
              }
            : poll
        )
      )
    }

    socket.on('poll-updated', onPollUpdate)
    socket.on('vote-updated', onVoteUpdate)

    return () => {
      socket.off('poll-updated', onPollUpdate)
      socket.off('vote-updated', onVoteUpdate)
    }
  }, [])

  useEffect(() => {
    fetchPolls()
  }, [])

  // Refresh when refreshKey changes (when new poll is created)
  useEffect(() => {
    if (refreshKey > 0) {
      fetchPolls()
    }
  }, [refreshKey])


  if (loading) return <div className="card"><p>Loading...</p></div>

  const calculatePercentage = (votes, total) => {
    if (total === 0) return 0
    return Math.round((votes / total) * 100)
  }

  const renderPollResults = (poll) => {
    const totalVotes = poll.totalVotes || 0
    
    return (
      <div className="poll-card">
        {/* Question header - dark strip */}
        <div className="poll-header">
          <div className="question-text">"{poll.question}"</div>
        </div>

        {/* Options body */}
        <div className="poll-body">
          {poll.options.map((option, optionIndex) => {
            const percentage = calculatePercentage(option.votes, totalVotes)
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
                        aria-hidden
                      />
                    </div>
                    <div className="percent">{percentage}%</div>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Total votes info */}
          <div className="total-votes">
            Total votes: {totalVotes}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="history-page">
      <div className="history-center">
        {/* Page Title */}
        <div className="history-title">
          <h1>View Poll History</h1>
        </div>
        
        {/* Back button */}
        <div className="back-button-container">
          <button 
            className="back-btn" 
            onClick={() => navigate('/teacher')}
            aria-label="back to create poll"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" style={{ marginRight: 8 }}>
              <path fill="#fff" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
            </svg>
            Back to Create Poll
          </button>
        </div>

        {allPolls.length === 0 ? (
          <div className="no-polls">No polls available</div>
        ) : (
          <div className="polls-list">
            {/* Show all polls with results */}
            {allPolls.map((poll, index) => (
              <div key={poll._id} className="poll-container">
                {/* Question Number */}
                <div className="question-number">
                  Question {index + 1}
                </div>
                
                {/* Poll Results Card */}
                {renderPollResults(poll)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat Widget */}
      <ChatWidget />

      {/* Styles matching LivePollResults */}
      <style>{`
        :root{
          --page-white: #ffffff;
          --muted: #6b7280;
          --border-purple: rgba(124,58,237,0.15);
          --purple-strong: #7C3AED; /* main purple */
          --purple-2: #5BA0FF; /* gradient end */
          --dark-header-start: #3a3a3a;
          --dark-header-end: #6f6f6f;
          --card-shadow: rgba(16,24,40,0.04);
          --track-bg: #f4f4f6;
        }

        /* PAGE */
        .history-page{
          min-height: 100vh;
          background: var(--page-white);
          position: relative;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
          color: #0f1724;
          box-sizing: border-box;
          padding: 28px 36px;
        }

        /* Center container */
        .history-center{
          max-width: 800px;
          margin: 0 auto;
        }

        /* Title */
        .history-title{
          text-align: center;
          margin-bottom: 24px;
        }
        .history-title h1{
          font-size: 28px;
          font-weight: 700;
          color: #0f1724;
          margin: 0;
        }

        /* Back button */
        .back-button-container{
          display: flex;
          justify-content: flex-start;
          margin-bottom: 32px;
        }
        .back-btn{
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(90deg, var(--purple-strong), var(--purple-2));
          color: #fff;
          border: none;
          padding: 10px 18px;
          border-radius: 999px;
          font-weight: 600;
          box-shadow: 0 8px 24px rgba(124,58,237,0.12);
          cursor: pointer;
          font-size: 14px;
        }
        .back-btn:hover{
          transform: translateY(-1px);
          box-shadow: 0 12px 30px rgba(124,58,237,0.16);
        }
        .back-btn svg { opacity: 0.95; }

        /* Polls list */
        .polls-list{
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Poll container */
        .poll-container{
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* Question number */
        .question-number{
          font-size: 18px;
          font-weight: 700;
          color: #0f1724;
          margin-bottom: 8px;
        }

        /* Individual poll card - matches LivePollResults exactly */
        .poll-card{
          width: 100%;
          border-radius: 8px;
          border: 2px solid rgba(124,58,237,0.12);
          padding: 0;
          box-shadow: 0 6px 24px var(--card-shadow);
          background: transparent;
        }

        /* Header: dark strip across top with rounded top corners */
        .poll-header{
          border-top-left-radius: 6px;
          border-top-right-radius: 6px;
          padding: 12px 16px;
          background: linear-gradient(90deg, var(--dark-header-start), var(--dark-header-end));
          color: #fff;
          font-weight: 600;
          font-size: 14px;
        }
        .question-text{ 
          padding-left: 6px; 
        }

        /* Body: white-ish panel with internal padding */
        .poll-body{
          padding: 18px;
          background: #fff;
          border-bottom-left-radius: 6px;
          border-bottom-right-radius: 6px;
        }

        /* Each option row - matches LivePollResults exactly */
        .option-row{
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

        .option-row .left{
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 260px;
        }

        /* Numbered circle - matches LivePollResults exactly */
        .num{
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

        .opt-label{
          font-size: 15px;
          color: #0f1724;
        }

        /* Right side: progress + percent */
        .right { 
          display: flex; 
          align-items: center; 
          gap: 12px; 
          width: 360px; 
        }

        .progress-wrap{ 
          display: flex; 
          align-items: center; 
          gap: 12px; 
          width: 100%; 
        }

        .progress-track{
          flex: 1;
          height: 28px;
          background: var(--track-bg);
          border-radius: 6px;
          overflow: hidden;
          border: 1px solid rgba(124,58,237,0.08);
          display: flex;
          align-items: center;
        }

        .progress-fill{
          height: 100%;
          background: linear-gradient(90deg, var(--purple-strong), var(--purple-2));
          border-top-right-radius: 6px;
          border-bottom-right-radius: 6px;
          border-top-left-radius: 6px;
          border-bottom-left-radius: 6px;
          transition: width 500ms ease;
        }

        .percent{
          min-width: 44px;
          text-align: right;
          font-weight: 700;
          color: #0f1724;
        }

        /* Total votes info */
        .total-votes{
          margin-top: 16px;
          padding: 12px;
          backgroundColor: #f8f9fa;
          borderRadius: 8px;
          text-align: center;
          color: #6b7280;
          fontSize: 14px;
        }


        .no-polls{
          text-align: center;
          color: var(--muted);
          font-size: 16px;
          margin-top: 48px;
        }


        /* Responsive */
        @media (max-width: 860px) {
          .history-page { padding: 18px; }
          .right { width: 46%; }
          .poll-card { width: 100%; }
        }
      `}</style>
    </div>
  )
}

export default PastResults
