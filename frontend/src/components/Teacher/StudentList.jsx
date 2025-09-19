import React, { useEffect, useState } from 'react'
import { studentsAPI } from '../../services/api'

const StudentList = () => {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await studentsAPI.list()
      setStudents(data.students || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const remove = async (id) => {
    await studentsAPI.remove(id)
    load()
  }

  if (loading) return <div className="card"><p>Loading...</p></div>

  return (
    <div className="card">
      <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--dark-purple)' }}>Students</h3>
      {students.length === 0 ? (
        <p style={{ color: 'var(--medium-gray)' }}>No active students</p>
      ) : (
        <div className="space-y-2">
          {students.map((s) => (
            <div key={s._id} className="flex items-center justify-between">
              <div style={{ color: 'var(--dark-gray)' }}>{s.name}</div>
              <button className="btn btn-danger" onClick={() => remove(s._id)}>Remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default StudentList


