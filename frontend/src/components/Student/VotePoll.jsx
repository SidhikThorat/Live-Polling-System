import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import socketService from '../../services/socket'
import { pollsAPI, votesAPI } from '../../services/api'
import PollResults from '../Shared/PollResults'

const VotePoll = ({ poll, onBack }) => {
  const { userId } = useSelector((s) => s.user)
  const [selected, setSelected] = useState(null)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    const init = async () => {
      try {
        const socket = socketService.getSocket() || socketService.connect()
        socketService.joinPoll(poll._id, userId)
        socket.on('poll-updated', (data) => {
          if (data.pollId === poll._id) setResults(data.results)
        })
        const { data } = await pollsAPI.getResults(poll._id)
        if (mounted) setResults(data.results)
      } catch (e) {
        setError('Failed to load poll')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    init()
    return () => { mounted = false }
  }, [poll._id, userId])

  const submit = async () => {
    setError('')
    if (selected === null) return setError('Select an option')
    try {
      await votesAPI.submit({ pollId: poll._id, userId, optionIndex: selected })
      // Fetch results immediately after successful vote
      const { data } = await pollsAPI.getResults(poll._id)
      setResults(data.results)
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to vote')
    }
  }

  if (loading) return <div className="card"><p>Loading...</p></div>

  return (
    <div className="card">
      <button className="btn btn-secondary mb-4" onClick={onBack}>Back</button>
      <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--primary-purple)' }}>{poll.question}</h3>
      {error ? <p style={{ color: 'var(--dark-purple)' }} className="mb-2">{error}</p> : null}
      <div className="space-y-3 mb-4">
        {poll.options.map((opt, idx) => (
          <label key={idx} className="flex items-center gap-3">
            <input
              type="radio"
              name="opt"
              checked={selected === idx}
              onChange={() => setSelected(idx)}
            />
            <span style={{ color: 'var(--dark-gray)' }}>{typeof opt === 'string' ? opt : opt.text}</span>
          </label>
        ))}
      </div>
      <button className="btn btn-primary" onClick={submit}>Submit Vote</button>
      {results ? <div className="mt-6"><PollResults results={results} /></div> : null}
    </div>
  )
}

export default VotePoll


