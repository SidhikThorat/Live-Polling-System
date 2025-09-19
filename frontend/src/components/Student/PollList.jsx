import React, { useEffect, useState } from 'react'
import { pollsAPI } from '../../services/api'
import socketService from '../../services/socket'

const PollList = ({ onSelect }) => {
  const [polls, setPolls] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchActive = async () => {
    setLoading(true)
    try {
      const { data } = await pollsAPI.getActive()
      setPolls(data.polls || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActive()
    const socket = socketService.getSocket() || socketService.connect()
    const onStatus = () => fetchActive()
    const onNew = () => fetchActive()
    socket.on('poll-status-updated', onStatus)
    socket.on('new-poll-available', onNew)
    return () => {
      socket.off('poll-status-updated', onStatus)
      socket.off('new-poll-available', onNew)
    }
  }, [])

  if (loading) return <div className="card"><p>Loading...</p></div>

  return (
    <div className="card">
      <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--secondary-blue)' }}>Available Polls</h3>
      {polls.length === 0 ? (
        <p style={{ color: 'var(--medium-gray)' }}>No active polls</p>
      ) : (
        <div className="space-y-3">
          {polls.map((p) => (
            <div key={p._id} className="flex items-center justify-between">
              <div>
                <div className="font-semibold" style={{ color: 'var(--dark-gray)' }}>{p.question}</div>
              </div>
              <button className="btn btn-primary" onClick={() => onSelect(p)}>
                Vote
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PollList


