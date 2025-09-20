import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { setUser } from '../../store/userSlice'
import { authAPI } from '../../services/api'
import socketService from '../../services/socket'

const StudentOnboarding = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e && e.preventDefault()

    setLoading(true)

    try {
      const effectiveName = name.trim() || ''
      const { data } = await authAPI.login(effectiveName, 'student')
      const { user } = data

      dispatch(setUser({ userId: user.id, name: user.name, role: user.role }))

      const socket = socketService.connect()
      socket.once('connect', async () => {
        try {
          await authAPI.updateSocket(user.id, socket.id)
        } catch (e) {
          console.error('Failed to update socket on server', e)
        }
      })

      navigate('/student')
    } catch (error) {
      console.error('Login error:', error)

      if (error.response?.status === 403) {
        navigate('/kicked-out', { replace: true })
        return
      }

      alert('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="student-onboarding">
      <div className="content">
        {/* Brand pill */}
        <div className="brand-pill">✦ Intervue Poll</div>

        {/* Heading */}
        <h1 className="title">
          Let’s <span>Get Started</span>
        </h1>
        <p className="subtitle">
          If you're a student, you'll be able to <b>submit your answers</b>, participate in live polls, and see how your responses compare with your classmates
        </p>

        {/* Input form */}
        <form onSubmit={handleSubmit} className="form">
          <label className="label">Enter your Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Rahul Bajaj"
            className="input"
            maxLength={50}
          />
          <button type="submit" className="continue" disabled={loading}>
            {loading ? 'Connecting...' : 'Continue'}
          </button>
        </form>
      </div>

      <style>{`
        .student-onboarding {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: #fff;
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .content {
          text-align: center;
          max-width: 600px;
          width: 100%;
          padding: 20px;
        }

        .brand-pill {
          display: inline-block;
          padding: 6px 14px;
          border-radius: 999px;
          background: #6b46c1;
          color: #fff;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 32px;
        }

        .title {
          font-size: 32px;
          font-weight: 400;
          margin-bottom: 12px;
          color: #000;
        }

        .title span {
          font-weight: 700;
        }

        .subtitle {
          font-size: 16px;
          color: #444;
          margin-bottom: 36px;
          line-height: 1.6;
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: 16px;
          max-width: 480px;
          margin: 0 auto;
        }

        .label {
          font-size: 14px;
          font-weight: 500;
          text-align: left;
          margin-bottom: 4px;
          color: #000;
        }

        .input {
          width: 100%;
          padding: 14px 16px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 16px;
          color: #000;
          outline: none;
          background: #f9f9f9;
        }

        .input:focus {
          border-color: #6b46c1;
          background: #fff;
        }

        .continue {
          width: 180px;
          height: 44px;
          margin: 12px auto 0;
          border: none;
          border-radius: 999px;
          background: linear-gradient(90deg, #7c5cff 0%, #7c5cff 60%, #5767D0 100%);
          color: #fff;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          transition: transform .12s ease, box-shadow .12s ease, opacity .12s ease;
          box-shadow: 0 8px 22px rgba(92,72,214,0.12);
        }

        .continue:active {
          transform: translateY(1px);
        }

        .continue:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}

export default StudentOnboarding
