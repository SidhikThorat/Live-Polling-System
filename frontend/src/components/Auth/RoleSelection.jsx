import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { setUser } from '../../store/userSlice'
import { authAPI } from '../../services/api'
import socketService from '../../services/socket'

const RoleSelection = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e && e.preventDefault()

    if (!selectedRole) {
      alert('Please select a role')
      return
    }

    if (selectedRole === 'student') {
      // Redirect students to onboarding page
      navigate('/student/onboarding')
      return
    }

    // For teachers, proceed with login
    setLoading(true)

    try {
      const { data } = await authAPI.login('', selectedRole) // Empty name for teacher
      const { user } = data

      // Save to Redux
      dispatch(setUser({ userId: user.id, name: user.name, role: user.role }))

      // Connect socket and update socketId on server
      const socket = socketService.connect()
      socket.once('connect', async () => {
        try {
          await authAPI.updateSocket(user.id, socket.id)
        } catch (e) {
          console.error('Failed to update socket on server', e)
        }
      })

      // Navigate to teacher dashboard
      navigate('/teacher')
    } catch (error) {
      console.error('Login error:', error)
      alert('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="role-page-root">
      <div className="role-container">
        {/* Brand pill */}
        <div className="brand-pill">✦ Intervue Poll</div>

        {/* Heading */}
        <div className="heading">
          <h1>
            Welcome to the <span className="highlight">Live Polling System</span>
          </h1>
          <p className="sub">Please select the role that best describes you to begin using the live polling system</p>
        </div>

        <form onSubmit={handleSubmit} className="content-wrap">
          {/* Cards */}
          <div className="cards-grid">
            <button
              type="button"
              className={`card ${selectedRole === 'student' ? 'selected' : ''}`}
              onClick={() => setSelectedRole('student')}
            >
              <div className="card-title">I'm a Student</div>
              <div className="card-desc">Participate in polls, submit answers and view live results.</div>
            </button>

            <button
              type="button"
              className={`card ${selectedRole === 'teacher' ? 'selected' : ''}`}
              onClick={() => setSelectedRole('teacher')}
            >
              <div className="card-title">I'm a Teacher</div>
              <div className="card-desc">Create and manage polls, monitor student responses in real-time.</div>
            </button>
          </div>

          {/* Continue Button */}
          <div className="cta-row">
            <button
              type="submit"
              disabled={loading}
              className="continue-btn"
            >
              {loading ? 'Please wait…' : 'Continue'}
            </button>
          </div>
        </form>
      </div>

      {/* Component-scoped styles */}
      <style>{`
        :root{
          --bg: #f6f8fb; /* very light */
          --panel-bg: #ffffff;
          --muted: #8b8b9f;
          --text-dark: #111827;
          --border: #e7e9ef;
          --purple-a: #7c5cff;
          --blue-b: #5ba0ff;
          --gradient: linear-gradient(135deg, var(--purple-a), var(--blue-b));
        }

        /* full page */
        .role-page-root{
          min-height: 100vh;
          display:flex;
          align-items:center;
          justify-content:center;
          background: var(--bg);
          padding: 48px 24px;
          box-sizing: border-box;
        }

        .role-container{
          width:100%;
          max-width: 980px;
          background: transparent;
          padding: 20px 28px;
          box-sizing: border-box;
        }

        /* brand pill */
        .brand-pill{
          display:inline-flex;
          align-items:center;
          gap:8px;
          margin: 0 auto 18px;
          padding:6px 14px;
          border-radius:999px;
          background: var(--gradient);
          color: #fff;
          font-size:13px;
          font-weight:600;
          width: fit-content;
        }

        /* heading */
        .heading{
          text-align:center;
          margin-bottom: 22px;
        }
        .heading h1{
          margin:0;
          font-size:34px;
          font-weight:700;
          color: var(--text-dark);
          line-height:1.15;
        }
        .heading .highlight{
          color: var(--text-dark);
        }
        .sub{
          margin-top:10px;
          color: var(--muted);
          font-size:14px;
        }

        .content-wrap{
          margin-top: 8px;
        }


        /* cards grid */
        .cards-grid{
          display:grid;
          grid-template-columns: 1fr;
          gap:18px;
          margin-bottom:26px;
          justify-items:center;
        }
        @media(min-width:768px){
          .cards-grid{
            grid-template-columns: 1fr 1fr;
          }
        }

        /* card base */
        .card{
          width:420px;
          max-width:100%;
          text-align:left;
          padding:20px 22px;
          border-radius:12px;
          border: 2px solid var(--border);
          background: var(--panel-bg);
          box-shadow: 0 6px 20px rgba(15,23,42,0.04);
          cursor:pointer;
          transition:
            transform .12s ease,
            box-shadow .12s ease,
            border-color .12s ease,
            background .12s ease;
          display:block;
        }
        .card:active{ transform: translateY(1px); }

        .card-title{
          font-weight:700;
          color: var(--text-dark);
          margin-bottom:8px;
          font-size:16px;
        }
        .card-desc{
          color: var(--muted);
          font-size:13px;
          line-height:1.4;
        }

        /* selected card */
        .card.selected{
          border-image: none;
          border-color: transparent;
          position: relative;
        }
        .card.selected::before{
          content: "";
          position: absolute;
          inset: -2px;
          border-radius: 14px;
          padding: 2px;
          background: var(--gradient);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
        /* glow */
        .card.selected{
          box-shadow: 0 12px 40px rgba(92,72,214,0.14);
        }

        /* cta */
        .cta-row{
          display:flex;
          justify-content:center;
        }
        .continue-btn{
          width:180px;
          height:44px;
          border-radius:999px;
          border: none;
          cursor:pointer;
          font-weight:700;
          color:#fff;
          background: var(--gradient);
          box-shadow: 0 8px 22px rgba(92,72,214,0.12);
          transition: transform .12s ease, box-shadow .12s ease, opacity .12s ease;
        }
        .continue-btn:active{ transform: translateY(1px); }
        .continue-btn:disabled{
          opacity:0.6;
          cursor: not-allowed;
        }

        /* small screens tweak */
        @media(max-width:420px){
          .brand-pill{ font-size:12px; padding:6px 10px; }
          .heading h1{ font-size:24px; }
          .card{ padding:16px; }
          .continue-btn{ width:160px; }
        }
      `}</style>
    </div>
  )
}

export default RoleSelection
