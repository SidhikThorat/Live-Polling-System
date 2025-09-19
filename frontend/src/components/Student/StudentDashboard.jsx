import React, { useState } from 'react'
import PollList from './PollList'
import VotePoll from './VotePoll'

const StudentDashboard = () => {
  const [activePoll, setActivePoll] = useState(null)
  return (
    <div className="fade-in">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--secondary-blue)' }}>
          Student Dashboard
        </h2>
        <p className="text-gray-600">Participate in polls and view results</p>
      </div>

      {!activePoll ? (
        <PollList onSelect={(p) => setActivePoll(p)} />
      ) : (
        <VotePoll poll={activePoll} onBack={() => setActivePoll(null)} />
      )}

      {/* Recent Activity */}
      <div className="mt-8">
        <div className="card">
          <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--dark-gray)' }}>
            Recent Activity
          </h3>
          <div className="text-center py-8 text-gray-500">
            <p>No recent activity to display</p>
            <p className="text-sm mt-2">Wait for your teacher to create a poll!</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default StudentDashboard
