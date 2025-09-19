import React, { useEffect, useState } from 'react'
import { pollsAPI } from '../../services/api'
import socketService from '../../services/socket'
import PollResults from '../Shared/PollResults'

const ResultsPanel = ({ pollId }) => {
  const [results, setResults] = useState(null)

  const refresh = async () => {
    const { data } = await pollsAPI.getResults(pollId)
    setResults(data.results)
  }

  useEffect(() => {
    if (!pollId) return
    refresh()
    const socket = socketService.getSocket() || socketService.connect()
    
    // Join the poll room to receive updates
    socketService.joinPoll(pollId, 'teacher')
    
    const onUpdate = (payload) => {
      if (payload.pollId === pollId) setResults(payload.results)
    }
    socket.on('poll-updated', onUpdate)
    
    return () => {
      socket.off('poll-updated', onUpdate)
      socketService.leavePoll(pollId)
    }
  }, [pollId])

  if (!pollId) return null

  return (
    <div className="mt-6">
      <PollResults results={results} />
      <div className="mt-3 flex gap-2">
        <button className="btn btn-secondary" onClick={refresh}>Refresh</button>
      </div>
    </div>
  )
}

export default ResultsPanel


