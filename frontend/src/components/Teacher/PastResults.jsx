import React, { useEffect, useState } from 'react'
import { pollsAPI } from '../../services/api'
import PollResults from '../Shared/PollResults'

const PastResults = () => {
  const [polls, setPolls] = useState([])
  const [selectedPoll, setSelectedPoll] = useState(null)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchPolls = async () => {
    setLoading(true)
    try {
      const { data } = await pollsAPI.getAll()
      // Filter for closed polls
      const closedPolls = data.polls.filter(p => p.status === 'closed')
      setPolls(closedPolls)
    } finally {
      setLoading(false)
    }
  }

  const fetchResults = async (pollId) => {
    try {
      const { data } = await pollsAPI.getResults(pollId)
      setResults(data.results)
    } catch (error) {
      console.error('Failed to fetch results:', error)
    }
  }

  useEffect(() => {
    fetchPolls()
  }, [])

  const handlePollSelect = (poll) => {
    setSelectedPoll(poll)
    fetchResults(poll._id)
  }

  if (loading) return <div className="card"><p>Loading...</p></div>

  return (
    <div className="card">
      <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--dark-purple)' }}>
        Past Poll Results
      </h3>
      
      {polls.length === 0 ? (
        <p style={{ color: 'var(--medium-gray)' }}>No past polls available</p>
      ) : (
        <div className="space-y-4">
          {/* Poll List */}
          <div className="space-y-2">
            {polls.map((poll) => (
              <div
                key={poll._id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedPoll?._id === poll._id
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handlePollSelect(poll)}
              >
                <div className="font-medium" style={{ color: 'var(--dark-gray)' }}>
                  {poll.question}
                </div>
                <div className="text-sm" style={{ color: 'var(--medium-gray)' }}>
                  Total votes: {poll.totalVotes} • Closed: {new Date(poll.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>

          {/* Results Display */}
          {selectedPoll && results && (
            <div className="mt-6 p-4 border rounded-lg" style={{ backgroundColor: 'var(--light-gray)' }}>
              <h4 className="font-semibold mb-3" style={{ color: 'var(--primary-purple)' }}>
                Results for: {selectedPoll.question}
              </h4>
              <PollResults results={results} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default PastResults
