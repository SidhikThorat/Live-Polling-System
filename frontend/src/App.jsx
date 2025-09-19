import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Shared/Layout'
import RoleSelection from './components/Auth/RoleSelection'
import TeacherDashboard from './components/Teacher/TeacherDashboard'
import CreatePollForm from './components/Teacher/CreatePollForm'
import LivePollResults from './components/Teacher/LivePollResults'
import StudentDashboard from './components/Student/StudentDashboard'
import ProtectedRoute from './components/Shared/ProtectedRoute'

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<RoleSelection />} />
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
          path="/student"
          element={
            <ProtectedRoute role="student">
              <Layout><StudentDashboard /></Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  )
}

export default App
