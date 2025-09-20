import React, { useEffect } from 'react'
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import Layout from './components/Shared/Layout'
import RoleSelection from './components/Auth/RoleSelection'
import StudentOnboarding from './components/Auth/StudentOnboarding'
import KickedOut from './components/Auth/KickedOut'
import TeacherDashboard from './components/Teacher/TeacherDashboard'
import CreatePollForm from './components/Teacher/CreatePollForm'
import LivePollResults from './components/Teacher/LivePollResults'
import PastResults from './components/Teacher/PastResults'
import StudentDashboard from './components/Student/StudentDashboard'
import ProtectedRoute from './components/Shared/ProtectedRoute'
import socketService from './services/socket'
import { authAPI } from './services/api'
import { logout } from './store/userSlice'

function App() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, role, userId } = useSelector((state) => state.user)

  // Restore authentication and socket connection on app load
  useEffect(() => {
    const restoreAuth = async () => {
      if (isAuthenticated && userId) {
        try {
          // Connect socket and update socketId on server
          const socket = socketService.connect()
          socket.once('connect', async () => {
            try {
              await authAPI.updateSocket(userId, socket.id)
              console.log('Socket connection restored for user:', userId)
            } catch (e) {
              console.error('Failed to update socket on server:', e)
            }
          })

          // Listen for kickout events
          socket.on('removed', (data) => {
            console.log('User was kicked out:', data)
            if (role === 'student') {
              navigate('/kicked-out', { replace: true })
            }
          })
        } catch (error) {
          console.error('Failed to restore socket connection:', error)
        }
      }
    }

    restoreAuth()
  }, [isAuthenticated, userId, role, navigate])

  // Check user status on app load and when user state changes
  useEffect(() => {
    if (isAuthenticated && role === 'student' && userId && location.pathname !== '/kicked-out') {
      checkUserStatusOnLoad()
    }
  }, [isAuthenticated, role, userId, location.pathname])

  // Check user status on load (for existing sessions)
  const checkUserStatusOnLoad = async () => {
    try {
      const response = await authAPI.getUser(userId)
      const user = response.data.user
      
      if (!user.isActive) {
        // User is kicked out, clear auth and redirect to kicked-out page
        dispatch(logout())
        navigate('/kicked-out', { replace: true })
      }
    } catch (error) {
      console.error('Failed to check user status on load:', error)
      // If user doesn't exist or other error, clear auth
      dispatch(logout())
      navigate('/', { replace: true })
    }
  }

  // Redirect to appropriate route if authenticated and on home page
  useEffect(() => {
    if (isAuthenticated && location.pathname === '/') {
      // Check if user is kicked out
      checkUserStatus()
    }
  }, [isAuthenticated, role, location.pathname, navigate])

  // Check user status and redirect accordingly
  const checkUserStatus = async () => {
    try {
      if (role === 'student' && userId) {
        const response = await authAPI.getUser(userId)
        const user = response.data.user
        
        if (!user.isActive) {
          // User is kicked out, redirect to kicked-out page
          navigate('/kicked-out', { replace: true })
          return
        }
      }
      
      // User is active, redirect to appropriate dashboard
      navigate(role === 'teacher' ? '/teacher' : '/student', { replace: true })
    } catch (error) {
      console.error('Failed to check user status:', error)
      // On error, redirect to appropriate dashboard
      navigate(role === 'teacher' ? '/teacher' : '/student', { replace: true })
    }
  }

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<RoleSelection />} />
        <Route path="/student/onboarding" element={<StudentOnboarding />} />
        <Route path="/kicked-out" element={<KickedOut />} />
        <Route
          path="/teacher"
          element={
            <ProtectedRoute role="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/poll/:pollId"
          element={
            <ProtectedRoute role="teacher">
              <LivePollResults />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/history"
          element={
            <ProtectedRoute role="teacher">
              <PastResults />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student"
          element={
            <ProtectedRoute role="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  )
}

export default App
