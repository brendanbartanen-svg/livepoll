import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { createRoom, getRoom } from '../lib/firebase'

const RECENT_ROOMS_KEY = 'wahoopoll_recent_rooms'

function getRecentRooms() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_ROOMS_KEY) || '[]')
  } catch {
    return []
  }
}

function saveRecentRoom(code) {
  const rooms = getRecentRooms().filter((r) => r.code !== code)
  rooms.unshift({ code, createdAt: Date.now() })
  // Keep only the 10 most recent
  localStorage.setItem(RECENT_ROOMS_KEY, JSON.stringify(rooms.slice(0, 10)))
}

export default function Home() {
  const navigate = useNavigate()
  const [joinCode, setJoinCode] = useState('')
  const [creating, setCreating] = useState(false)
  const [joinError, setJoinError] = useState('')
  const [password, setPassword] = useState('')
  const [recentRooms, setRecentRooms] = useState([])

  useEffect(() => {
    setRecentRooms(getRecentRooms())
  }, [])

  const handleCreate = async () => {
    setCreating(true)
    try {
      const code = await createRoom(password)
      saveRecentRoom(code)
      navigate(`/present/${code}`)
    } catch (err) {
      alert('Failed to create room: ' + err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleJoin = async (e) => {
    e.preventDefault()
    setJoinError('')
    const code = joinCode.trim().toUpperCase()
    if (code.length !== 4) {
      setJoinError('Enter a 4-character room code')
      return
    }
    try {
      const room = await getRoom(code)
      if (!room) {
        setJoinError('Room not found. Check the code and try again.')
        return
      }
      navigate(`/join/${code}`)
    } catch (err) {
      setJoinError('Error joining: ' + err.message)
    }
  }

  return (
    <div className="container">
      <div className="home-hero">
        <img src="/wahoo_poll.png" alt="WahooPoll" style={{ height: 120, marginBottom: 24 }} />
        <h2>Polling for Your Classroom</h2>
        <p>Create a poll and get real-time responses from your audience.</p>

        <div style={{ maxWidth: 320, margin: '0 auto 16px' }}>
          <div className="form-group">
            <label>Presenter Password (optional)</label>
            <input
              className="input"
              type="password"
              placeholder="Set a password for the presenter view"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <div className="home-actions">
          <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
            {creating ? 'Creating...' : 'Create a Poll Session'}
          </button>
        </div>

        <div style={{ margin: '40px 0 16px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          — or join an existing session —
        </div>

        <form className="join-form" onSubmit={handleJoin}>
          <input
            className="input"
            type="text"
            maxLength={4}
            placeholder="CODE"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          />
          <button className="btn btn-outline" type="submit">Join</button>
        </form>
        {joinError && (
          <p style={{ color: 'var(--danger)', marginTop: 8, fontSize: '0.85rem' }}>{joinError}</p>
        )}

        {recentRooms.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 12 }}>
              — your recent sessions —
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {recentRooms.map((r) => (
                <Link
                  key={r.code}
                  to={`/present/${r.code}`}
                  className="btn btn-outline btn-sm"
                  style={{ textDecoration: 'none', letterSpacing: '0.05em', fontWeight: 700 }}
                >
                  {r.code}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
