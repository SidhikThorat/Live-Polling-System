import React from 'react'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'

const ProtectedRoute = ({ role, children }) => {
  const { isAuthenticated, role: userRole } = useSelector((s) => s.user)

  if (!isAuthenticated) return <Navigate to="/" replace />
  if (role && userRole !== role) return <Navigate to={userRole === 'teacher' ? '/teacher' : '/student'} replace />

  return children
}

export default ProtectedRoute


