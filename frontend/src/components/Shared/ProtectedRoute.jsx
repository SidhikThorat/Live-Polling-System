import React, { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Navigate } from 'react-router-dom'
import { authAPI } from '../../services/api'
import { logout } from '../../store/userSlice'

const ProtectedRoute = ({ role, children }) => {
  const { isAuthenticated, role: userRole, userId } = useSelector((s) => s.user)
  const dispatch = useDispatch()
  const [isLoading, setIsLoading] = useState(true)
  const [isKickedOut, setIsKickedOut] = useState(false)

  useEffect(() => {
    const checkUserStatus = async () => {
      if (isAuthenticated && userRole === 'student' && userId) {
        try {
          const response = await authAPI.getUser(userId)
          const user = response.data.user
          
          if (!user.isActive) {
            // User is kicked out, clear auth and set flag
            dispatch(logout())
            setIsKickedOut(true)
            return
          }
        } catch (error) {
          console.error('Failed to check user status in ProtectedRoute:', error)
          // If user doesn't exist or other error, clear auth
          dispatch(logout())
          setIsKickedOut(true)
          return
        }
      }
      setIsLoading(false)
    }

    checkUserStatus()
  }, [isAuthenticated, userRole, userId, dispatch])

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (isKickedOut) {
    return <Navigate to="/kicked-out" replace />
  }

  if (!isAuthenticated) return <Navigate to="/" replace />
  if (role && userRole !== role) return <Navigate to={userRole === 'teacher' ? '/teacher' : '/student'} replace />

  return children
}

export default ProtectedRoute


