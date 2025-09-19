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
      // Send the name to backend (empty string if no name provided)
      const effectiveName = name.trim() || ''
      const { data } = await authAPI.login(effectiveName, 'student')
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

      // Navigate to student dashboard
      navigate('/student')
    } catch (error) {
      console.error('Login error:', error)
      
      // Check if user is kicked out
      if (error.response?.status === 403) {
        // User is kicked out, redirect to kicked-out page
        navigate('/kicked-out', { replace: true })
        return
      }
      
      alert('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    navigate('/', { replace: true })
  }

  return (
    <div className="student-onboarding-page">
      <div className="student-container">
        {/* Brand pill */}
        <div className="brand-pill">✦ Intervue Poll</div>

        {/* Heading */}
        <div className="heading">
          <h1 className="main-title">
            Let's <span className="bold">Get Started</span>
          </h1>
          <p className="lead">
            If you are a student, you'll be able to submit your answers, participate in live polls, and see how your responses compare with your classmates.
          </p>
        </div>

        {/* Name input form */}
        <div className="form-section">
          <h2 className="form-heading">Enter your name</h2>
          
          <form onSubmit={handleSubmit} className="name-form">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name (optional)"
              className="name-input"
              maxLength={50}
            />
            
            <div className="button-group">
              <button
                type="button"
                onClick={handleBack}
                className="back-button"
                disabled={loading}
              >
                Back
              </button>
              
              <button
                type="submit"
                className="continue-button"
                disabled={loading}
              >
                {loading ? 'Connecting...' : 'Continue'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Styles matching homepage */}
      <style>{`
        .student-onboarding-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
        }

        .student-container {
          max-width: 600px;
          width: 100%;
          text-align: center;
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

        .heading {
          margin-bottom: 48px;
        }

        .main-title {
          font-size: 3.5rem;
          font-weight: 800;
          margin: 0 0 20px 0;
          line-height: 1.1;
          text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }

        .main-title .bold {
          background: linear-gradient(45deg, #ff6b6b, #ffa500);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: none;
        }

        .lead {
          font-size: 1.25rem;
          font-weight: 400;
          line-height: 1.6;
          margin: 0;
          opacity: 0.9;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .form-section {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 40px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 16px 48px rgba(0, 0, 0, 0.1);
        }

        .form-heading {
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0 0 24px 0;
          color: white;
        }

        .name-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .name-input {
          width: 100%;
          padding: 16px 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          font-size: 16px;
          font-weight: 500;
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
          box-sizing: border-box;
        }

        .name-input::placeholder {
          color: rgba(255, 255, 255, 0.6);
        }

        .name-input:focus {
          outline: none;
          border-color: rgba(255, 255, 255, 0.6);
          background: rgba(255, 255, 255, 0.15);
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
        }

        .button-group {
          display: flex;
          gap: 16px;
          justify-content: center;
        }

        .back-button {
          padding: 14px 28px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
          min-width: 120px;
        }

        .back-button:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.5);
          transform: translateY(-2px);
        }

        .back-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .continue-button {
          padding: 14px 28px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(45deg, #ff6b6b, #ffa500);
          color: white;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 8px 24px rgba(255, 107, 107, 0.3);
          min-width: 120px;
        }

        .continue-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(255, 107, 107, 0.4);
        }

        .continue-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        /* Responsive design */
        @media (max-width: 768px) {
          .main-title {
            font-size: 2.5rem;
          }
          
          .lead {
            font-size: 1.1rem;
          }
          
          .form-section {
            padding: 32px 24px;
          }
          
          .button-group {
            flex-direction: column;
            align-items: center;
          }
          
          .back-button,
          .continue-button {
            width: 100%;
            max-width: 200px;
          }
        }

        @media (max-width: 480px) {
          .main-title {
            font-size: 2rem;
          }
          
          .lead {
            font-size: 1rem;
          }
          
          .student-onboarding-page {
            padding: 15px;
          }
          
          .form-section {
            padding: 24px 20px;
          }
        }
      `}</style>
    </div>
  )
}

export default StudentOnboarding
