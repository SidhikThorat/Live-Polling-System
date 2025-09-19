import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { pollsAPI } from '../../services/api'
import socketService from '../../services/socket'

const LivePollResults = () => {
  const { pollId } = useParams()
  const navigate = useNavigate()
  const [poll, setPoll] = useState(null)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchPollAndResults = async () => {
    try {
      setLoading(true)
      setError('')
      
      // Fetch poll details
      const pollResponse = await pollsAPI.getById(pollId)
      setPoll(pollResponse.data.poll)
      
      // Fetch initial results
      const resultsResponse = await pollsAPI.getResults(pollId)
      setResults(resultsResponse.data.results)
    } catch (err) {
      console.error('Failed to fetch poll data:', err)
      setError('Failed to load poll data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!pollId) return
    
    fetchPollAndResults()
    
    // Set up real-time updates
    const socket = socketService.getSocket() || socketService.connect()
    
    // Join the poll room to receive updates
    socketService.joinPoll(pollId, 'teacher')
    
    const onUpdate = (payload) => {
      if (payload.pollId === pollId) {
        setResults(payload.results)
      }
    }
    
    socket.on('poll-updated', onUpdate)
    
    return () => {
      socket.off('poll-updated', onUpdate)
      socketService.leavePoll(pollId)
    }
  }, [pollId])

  const handleAskNew = () => {
    navigate('/teacher')
  }

  const handleViewHistory = () => {
    // Navigate to past results or show history modal
    // For now, just show an alert
    alert('Past results feature coming soon!')
  }

  const handleChat = () => {
    // Open chat popup
    // For now, just show an alert
    alert('Chat feature coming soon!')
  }

  if (loading) {
    return (
      <div className="pr-page">
        <div className="pr-center">
          <div style={{ textAlign: 'center', color: '#6b7280' }}>
            Loading poll results...
          </div>
        </div>
      </div>
    )
  }

  if (error || !poll || !results) {
    return (
      <div className="pr-page">
        <div className="pr-center">
          <div style={{ textAlign: 'center', color: '#ef4444' }}>
            {error || 'Poll not found'}
          </div>
          <button 
            className="ask-btn" 
            onClick={handleAskNew}
            style={{ marginTop: '20px' }}
          >
            Back to Create Poll
          </button>
        </div>
      </div>
    )
  }

  // Transform results to match the expected format
  const formattedOptions = results.options.map(opt => ({
    label: opt.text,
    percent: Math.round(opt.percentage)
  }))

  return (
    <div className="pr-page">
      {/* View history pill top-right */}
      <button className="view-history" onClick={handleViewHistory} aria-label="view poll history">
        <svg width="14" height="14" viewBox="0 0 24 24" style={{ marginRight: 8 }}>
          <path fill="#fff" d="M12 5a7 7 0 1 0 7 7h-2a5 5 0 1 1-5-5V5z"/>
        </svg>
        View Poll history
      </button>

      {/* Centered poll card */}
      <div className="pr-center">
        <div className="pr-card">
          {/* question header */}
          <div className="pr-header">
            <div className="question-text">"{results.question}"</div>
          </div>

          {/* options box */}
          <div className="pr-body">
            {formattedOptions.map((opt, i) => (
              <div className="option-row" key={i}>
                <div className="left">
                  <div className="num">{i + 1}</div>
                  <div className="opt-label">{opt.label}</div>
                </div>

                <div className="right">
                  <div className="progress-wrap">
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{ width: `${Math.max(0, Math.min(100, opt.percent))}%` }}
                        aria-hidden
                      />
                    </div>
                    <div className="percent">{opt.percent}%</div>
                  </div>
                </div>
              </div>
            ))}

            {/* Total votes info */}
            <div style={{ 
              marginTop: '16px', 
              padding: '12px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '8px',
              textAlign: 'center',
              color: '#6b7280',
              fontSize: '14px'
            }}>
              Total votes: {results.totalVotes}
            </div>
          </div>
        </div>

        {/* Ask new question pill below card (centered horizontally with card) */}
        <div className="ask-row">
          <button className="ask-btn" onClick={handleAskNew} aria-label="ask new question">
            + Ask a new question
          </button>
        </div>
      </div>

      {/* chat bubble bottom-right */}
      <button className="chat-btn" onClick={handleChat} aria-label="chat">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M21 15a2 2 0 0 1-2 2H8l-5 3V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" fill="#fff"/>
        </svg>
      </button>

      {/* Styles (scoped inline) */}
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
        .pr-page{
          min-height: 100vh;
          background: var(--page-white);
          position: relative;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
          color: #0f1724;
          box-sizing: border-box;
          padding: 28px 36px;
        }

        /* top-right view history pill */
        .view-history{
          position: absolute;
          right: 40px;
          top: 28px;
          display:inline-flex;
          align-items:center;
          gap:6px;
          background: linear-gradient(90deg,var(--purple-strong), var(--purple-2));
          color: #fff;
          border: none;
          padding: 10px 18px;
          border-radius: 999px;
          font-weight:600;
          box-shadow: 0 8px 24px rgba(124,58,237,0.12);
          cursor: pointer;
        }

        .view-history svg { opacity: 0.95; }

        /* center container that places the card at center-left of page like screenshot */
        .pr-center{
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:center;
          margin-top: 36px;
        }

        /* card */
        .pr-card{
          width: 700px;
          border-radius: 8px;
          border: 2px solid rgba(124,58,237,0.12);
          padding: 0;
          box-shadow: 0 6px 24px var(--card-shadow);
          background: transparent;
        }

        /* header: dark strip across top with rounded top corners */
        .pr-header{
          border-top-left-radius: 6px;
          border-top-right-radius: 6px;
          padding: 12px 16px;
          background: linear-gradient(90deg, var(--dark-header-start), var(--dark-header-end));
          color: #fff;
          font-weight:600;
          font-size:14px;
        }
        .question-text{ padding-left:6px; }

        /* body: white-ish panel with internal padding and big spacing */
        .pr-body{
          padding: 18px;
          background: #fff;
          border-bottom-left-radius: 6px;
          border-bottom-right-radius: 6px;
        }

        /* each option row */
        .option-row{
          display:flex;
          align-items:center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px;
          border-radius:8px;
          border: 1px solid rgba(124,58,237,0.06);
          margin-bottom: 12px;
          background: #fff;
        }

        .option-row:last-child { margin-bottom: 0; }

        .option-row .left{
          display:flex;
          align-items:center;
          gap:12px;
          min-width: 260px;
        }

        .num{
          width:34px;
          height:34px;
          border-radius:999px;
          display:flex;
          align-items:center;
          justify-content:center;
          background: var(--purple-strong);
          color: #fff;
          font-weight:700;
          box-shadow: 0 6px 14px rgba(124,58,237,0.12);
          font-size:14px;
          flex-shrink:0;
        }

        .opt-label{
          font-size:15px;
          color:#0f1724;
        }

        /* right side: progress + percent */
        .right { display:flex; align-items:center; gap:12px; width: 360px; }

        .progress-wrap{ display:flex; align-items:center; gap:12px; width:100%; }

        .progress-track{
          flex:1;
          height: 28px;
          background: var(--track-bg);
          border-radius: 6px;
          overflow: hidden;
          border: 1px solid rgba(124,58,237,0.08);
          display:flex;
          align-items:center;
        }

        .progress-fill{
          height:100%;
          background: linear-gradient(90deg, var(--purple-strong), var(--purple-2));
          border-top-right-radius: 6px;
          border-bottom-right-radius: 6px;
          border-top-left-radius: 6px;
          border-bottom-left-radius: 6px;
          transition: width 500ms ease;
        }

        .percent{
          min-width:44px;
          text-align:right;
          font-weight:700;
          color:#0f1724;
        }

        /* Ask new question pill centered under card */
        .ask-row{
          margin-top: 22px;
          display:flex;
          justify-content:center;
        }
        .ask-btn{
          background: linear-gradient(90deg,var(--purple-strong), var(--purple-2));
          color:#fff;
          border:none;
          padding:12px 26px;
          border-radius:999px;
          font-weight:700;
          box-shadow: 0 8px 24px rgba(124,58,237,0.12);
          cursor:pointer;
        }

        /* chat bubble bottom-right */
        .chat-btn{
          position: fixed;
          right: 18px;
          bottom: 18px;
          width:46px;
          height:46px;
          border-radius:999px;
          border:none;
          background: linear-gradient(90deg,var(--purple-strong), var(--purple-2));
          box-shadow: 0 10px 30px rgba(124,58,237,0.12);
          display:flex;
          align-items:center;
          justify-content:center;
          cursor:pointer;
        }
        .chat-btn svg { display:block; }

        /* small screens */
        @media (max-width: 860px) {
          .pr-card { width: 92%; }
          .right { width: 46%; }
        }
      `}</style>
    </div>
  )
}

export default LivePollResults
