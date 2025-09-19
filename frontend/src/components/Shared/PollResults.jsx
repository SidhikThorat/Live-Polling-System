import React from 'react'

const barBg = {
  backgroundColor: 'var(--light-gray)'
}
const barFill = (pct) => ({
  width: `${pct}%`,
  background: 'linear-gradient(135deg, var(--primary-purple), var(--secondary-blue))',
  height: 10,
  borderRadius: 9999,
})

const PollResults = ({ results }) => {
  if (!results) return null
  const { question, options = [], totalVotes = 0 } = results
  return (
    <div className="card">
      <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--secondary-blue)' }}>Results</h3>
      <div className="mb-4" style={{ color: 'var(--dark-gray)' }}>{question}</div>
      <div className="space-y-3">
        {options.map((opt, idx) => (
          <div key={idx}>
            <div className="flex justify-between mb-1" style={{ color: 'var(--dark-gray)' }}>
              <span>{opt.text}</span>
              <span>{opt.votes} ({opt.percentage}%)</span>
            </div>
            <div style={{ ...barBg, height: 10, borderRadius: 9999 }}>
              <div style={barFill(opt.percentage)} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4" style={{ color: 'var(--medium-gray)' }}>Total votes: {totalVotes}</div>
    </div>
  )
}

export default PollResults


