import React, { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { pollsAPI } from '../../services/api'
import socketService from '../../services/socket'

const CHAR_LIMIT = 100

export default function CreatePollForm({ onCreated }) {
  const { userId } = useSelector((s) => s.user || {})
  const navigate = useNavigate()
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [timeLimit, setTimeLimit] = useState('60') // defaults to 60s as screenshot
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [correctIndex, setCorrectIndex] = useState(null) // single correct option or null

  const charCount = question.length
  const cleanedOptions = useMemo(() => options.map((o) => o.trim()), [options])

  const updateOption = (idx, value) => {
    const next = [...options]
    next[idx] = value
    setOptions(next)
  }

  const addOption = () => setOptions((opts) => [...opts, ''])

  const removeOption = (idx) => {
    setOptions((opts) => opts.filter((_, i) => i !== idx))
    // adjust correctIndex if needed
    setCorrectIndex((ci) => {
      if (ci == null) return null
      if (ci === idx) return null
      if (ci > idx) return ci - 1
      return ci
    })
  }

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    setError('')
    if (!question.trim()) return setError('Question is required')
    const cleaned = options.map((o) => o.trim()).filter(Boolean)
    if (cleaned.length < 2) return setError('At least 2 options are required')

    setLoading(true)
    try {
      const payload = {
        question: question.trim(),
        options: cleaned,
        createdBy: userId,
        timeLimit: timeLimit ? Number(timeLimit) : undefined,
        ...(correctIndex != null ? { correctIndex } : {}),
      }

      const { data } = await pollsAPI.create(payload)
      const poll = data.poll
      
      // Auto-activate the poll so students can see it
      await pollsAPI.updateStatus(poll._id, 'active')
      
      // notify via socket
      socketService.broadcastNewPoll(poll)
      socketService.changePollStatus(poll._id, 'active')

      // Navigate to live results page
      navigate(`/teacher/poll/${poll._id}`)
    } catch (err) {
      console.error(err)
      setError('Failed to create poll')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-poll-page">
      {/* Top-left brand pill */}
      <div className="brand-pill">✦ Intervue Poll</div>

      {/* Heading */}
      <header className="hero">
        <h1 className="title">
          Let’s <span className="title-strong">Get Started</span>
        </h1>
        <p className="subtitle">
          you’ll have the ability to create and manage polls, ask questions, and monitor your students' responses in
          real-time.
        </p>
      </header>

      {/* Form card */}
      <main className="form-wrap">
        <form id="create-poll-form" className="form-card" onSubmit={handleSubmit} aria-label="create-poll">
          {error ? <div className="error">{error}</div> : null}

          {/* Question label + timer */}
          <div className="row label-row">
            <div className="label-left">
              <label className="label-main">Enter your question</label>
            </div>

            <div className="label-right">
              <select
                className="timer"
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value)}
                aria-label="time-limit"
              >
                <option value="60">60 seconds ▾</option>
                <option value="120">2 minutes</option>
                <option value="300">5 minutes</option>
                <option value="600">10 minutes</option>
                <option value="">No limit</option>
              </select>
            </div>
          </div>

          {/* Editor area */}
          <div className="editor-wrap">
            <textarea
              className="editor"
              aria-label="question"
              maxLength={CHAR_LIMIT}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Type your question..."
            />
            <div className="char-count">{charCount}/{CHAR_LIMIT}</div>
          </div>

          {/* Options + correctness */}
          <div className="row options-row">
            <div className="options-left">
              <label className="label-small">Edit Options</label>

              <div className="options-list">
                {options.map((opt, idx) => (
                  <div className="option-line" key={idx}>
                    <div className="option-num">{idx + 1}</div>
                    <input
                      className="option-input"
                      value={opt}
                      placeholder={`Option ${idx + 1}`}
                      onChange={(e) => updateOption(idx, e.target.value)}
                      aria-label={`option-${idx + 1}`}
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        className="btn-remove"
                        aria-label={`Remove option ${idx + 1}`}
                        onClick={() => removeOption(idx)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button type="button" className="add-btn" onClick={addOption}>
                + Add More option
              </button>
            </div>

            <div className="options-right">
              <label className="label-small">Is it Correct?</label>

              <div className="correct-list">
                {options.map((_, idx) => (
                  <div className="correct-line" key={idx}>
                    <label className="radio-label">
                      <input
                        type="radio"
                        name="correct"
                        checked={correctIndex === idx}
                        onChange={() => setCorrectIndex(idx)}
                        aria-label={`mark-option-${idx + 1}-yes`}
                      />
                      <span>Yes</span>
                    </label>

                    <label className="radio-label">
                      <input
                        type="radio"
                        name={`not-correct-${idx}`}
                        checked={correctIndex !== idx}
                        onChange={() => setCorrectIndex(null)}
                        aria-label={`mark-option-${idx + 1}-no`}
                      />
                      <span>No</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* spacing so lower border lines up with screenshot */}
          <div style={{ height: 36 }} />
        </form>
      </main>

      {/* Thin footer-like separator above the Ask button */}
      <div className="footer-separator" aria-hidden="true" />

      {/* Floating Ask button (bottom-right) */}
      <button
        className="ask-btn"
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        aria-label="ask-question"
      >
        {loading ? 'Please wait…' : 'Ask Question'}
      </button>

      {/* Styles — scoped to component */}
      <style>{`
        /* Container page */
        .create-poll-page {
          min-height: 100vh;
          background: #ffffff;
          padding: 28px 56px;
          box-sizing: border-box;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
          color: #111827;
          position: relative;
        }

        /* Brand pill (top-left) */
        .brand-pill {
          display:inline-flex;
          gap:8px;
          align-items:center;
          padding:6px 12px;
          border-radius:999px;
          background: linear-gradient(135deg,#7C3AED 0%,#5BA0FF 100%);
          color:#fff;
          font-weight:600;
          font-size:13px;
          margin-left: 12px;
        }

        /* Heading */
        .hero { margin-top: 18px; max-width: 1180px; }
        .title {
          margin: 12px 0 4px 12px;
          font-size: 36px;
          font-weight: 700;
          line-height: 1.02;
          color: #0f1724;
        }
        .title-strong { font-weight: 800; }
        .subtitle {
          margin: 0 0 22px 12px;
          color: #6b7280;
          font-size: 14px;
          max-width: 920px;
        }

        /* Main form wrapper (centered width like screenshot) */
        .form-wrap {
          max-width: 1180px;
          margin-top: 10px;
        }

        /* Form card (transparent background like screenshot — inner elements styled exactly) */
        .form-card {
          width: 100%;
          padding: 14px 0 26px 0;
          box-sizing: border-box;
        }

        .error {
          color: #9b2c2c;
          margin: 0 12px 12px 12px;
          font-weight:600;
        }

        /* label row: left label and right timer */
        .label-row {
          display:flex;
          align-items:center;
          justify-content:space-between;
          margin: 12px;
        }
        .label-main {
          font-weight:700;
          font-size:15px;
          color:#111827;
        }

        .timer {
          border: 3px solid #FFD85A;
          background: #fff;
          padding: 8px 12px;
          border-radius: 4px;
          font-weight:700;
          font-size:14px;
          min-width: 140px;
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6'><polygon points='0,0 10,0 5,6' fill='%23724bff'/></svg>");
          background-repeat: no-repeat;
          background-position: right 10px center;
          background-size: 10px 6px;
        }

        /* editor area (big pale box) */
        .editor-wrap {
          margin: 0 12px 6px 12px;
          position: relative;
        }
        .editor {
          width: 100%;
          min-height: 120px;
          background: #f6f6f6;
          border: 1px solid #f6f6f6;
          border-radius: 4px;
          padding: 18px;
          font-size: 14px;
          color: #111827;
          resize: vertical;
          outline: none;
        }
        .editor:focus {
          box-shadow: 0 12px 30px rgba(124,58,237,0.06);
          border-color: #efeaff;
        }
        .char-count {
          position: absolute;
          right: 18px;
          bottom: 12px;
          font-size: 12px;
          color: #111827;
          opacity: 0.9;
        }

        /* Options area: left options and right 'Is it correct' column */
        .options-row {
          display: flex;
          gap: 48px;
          margin: 18px 12px 8px 12px;
          align-items: flex-start;
        }
        .options-left {
          flex:1;
        }
        .options-right {
          width: 280px;
          flex-shrink:0;
        }

        .label-small { display:block; margin-bottom:10px; font-weight:700; color:#111827; }

        .options-list { display:flex; flex-direction:column; gap:14px; }

        .option-line {
          display:flex;
          align-items:center;
          gap:12px;
        }
        .option-num {
          width:28px;
          height:28px;
          border-radius:999px;
          background: #7C3AED;
          color: white;
          display:flex;
          align-items:center;
          justify-content:center;
          font-weight:700;
          font-size:13px;
          box-shadow: 0 4px 10px rgba(124,58,237,0.12);
          flex-shrink:0;
        }
        .option-input {
          flex:1;
          padding: 12px 14px;
          border-radius: 4px;
          background: #f6f6f6;
          border: none;
          font-size: 14px;
          outline: none;
        }
        .option-input::placeholder { color:#a8a8a8; }

        .btn-remove {
          background: transparent;
          border: none;
          color: #818181;
          cursor: pointer;
          font-size: 14px;
          padding: 6px;
        }

        .add-btn {
          margin-top: 14px;
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid #7C3AED;
          background: transparent;
          color: #7C3AED;
          font-weight:700;
          cursor:pointer;
        }

        /* right column correctness radios */
        .correct-list { display:flex; flex-direction:column; gap:18px; }
        .correct-line { display:flex; gap:18px; align-items:center; }

        .radio-label {
          display:inline-flex;
          gap:8px;
          align-items:center;
          font-size:14px;
          cursor:pointer;
          color:#111827;
        }

        /* custom radio appearance */
        .radio-label input[type="radio"]{
          appearance:none;
          -webkit-appearance:none;
          width:18px;
          height:18px;
          border-radius:50%;
          border:2px solid #d6d6db;
          display:inline-block;
          position:relative;
        }
        .radio-label input[type="radio"]:checked{
          border-color: #7C3AED;
          background: radial-gradient(circle at center, #7C3AED 0 60%, #ffffff 61%);
        }

        /* floating Ask Question (bottom-right) */
        .ask-btn {
          position: fixed;
          right: 28px;
          bottom: 18px;
          height:44px;
          min-width:160px;
          padding: 0 22px;
          border-radius:999px;
          border: none;
          color: #fff;
          font-weight:700;
          background: linear-gradient(90deg,#7C3AED 0%, #5BA0FF 100%);
          box-shadow: 0 10px 30px rgba(124,58,237,0.12);
          cursor: pointer;
          z-index: 50;
        }
        .ask-btn:disabled { opacity:0.6; cursor:not-allowed; }

        /* bottom border line like screenshot separation */
        :root { --bottom-gap: 78px; }

        /* footer-like thin separator above the floating button */
        .footer-separator {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 72px; /* just above the Ask button */
          height: 1px;
          background: #000;
          opacity: 0.2;
          z-index: 40;
        }
        /* small responsive adjustments */
        @media (max-width: 980px) {
          .create-poll-page { padding: 18px; }
          .options-row { flex-direction: column; gap: 18px; }
          .options-right { width: 100%; }
          .timer { min-width: 120px; }
          .title { font-size: 28px; }
        }
      `}</style>
    </div>
  )
}
