import React, { useEffect, useState } from 'react'
import { pollsAPI } from '../../services/api'
import socketService from '../../services/socket'
import ResultsPanel from './ResultsPanel'

const Pill = ({ text }) => (
  <span style={{
    backgroundColor: 'var(--light-gray)',
    color: 'var(--dark-gray)',
    borderRadius: 9999,
    padding: '4px 10px',
    fontSize: 12,
  }}>{text}</span>
)

const ActivePolls = () => {
  const [polls, setPolls] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPollId, setSelectedPollId] = useState(null)

  const fetchActive = async () => {
    setLoading(true)
    try {
      const { data } = await pollsAPI.getAll()
      setPolls(data.polls || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActive()
    const socket = socketService.getSocket() || socketService.connect()
    const onNew = (payload) => {
      // if a new poll comes, refresh list
      fetchActive()
    }
    socket.on('new-poll-available', onNew)
    return () => {
      socket.off('new-poll-available', onNew)
    }
  }, [])

  const startPoll = async (id) => {
    await pollsAPI.updateStatus(id, 'active')
    socketService.changePollStatus(id, 'active')
    fetchActive()
  }

  const closePoll = async (id) => {
    await pollsAPI.updateStatus(id, 'closed')
    socketService.changePollStatus(id, 'closed')
    fetchActive()
  }

  if (loading) return <div className="card"><p>Loading...</p></div>

  return (
    <div className="card">
      <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--secondary-blue)' }}>Active/Recent Polls</h3>
      {polls.length === 0 ? (
        <p style={{ color: 'var(--medium-gray)' }}>No polls yet</p>
      ) : (
        <div className="space-y-4">
          {polls.map((p) => (
            <div key={p._id} className="flex items-center justify-between">
              <div>
                <div className="font-semibold" style={{ color: 'var(--dark-gray)' }}>{p.question}</div>
                <div className="flex gap-2 mt-1">
                  <Pill text={`Status: ${p.status}`} />
                  {p.timeLimit ? <Pill text={`Time: ${p.timeLimit}m`} /> : null}
                  <Pill text={`Votes: ${p.totalVotes}`} />
                </div>
              </div>
              <div className="flex gap-2">
                {p.status !== 'active' && p.status !== 'closed' && (
                  <button className="btn btn-primary" onClick={() => startPoll(p._id)}>Start</button>
                )}
                {p.status === 'active' && (
                  <button className="btn btn-danger" onClick={() => closePoll(p._id)}>Close</button>
                )}
                <button className="btn btn-secondary" onClick={() => setSelectedPollId(p._id)}>View Results</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {selectedPollId ? (
        <div className="mt-6">
          <h4 className="text-lg font-semibold mb-2" style={{ color: 'var(--primary-purple)' }}>Live Results</h4>
          {/* Lazy import avoided for simplicity */}
          <ResultsPanel pollId={selectedPollId} />
        </div>
      ) : null}
    </div>
  )
}

export default ActivePolls


