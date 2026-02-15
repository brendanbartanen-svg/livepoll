import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createRoom, getRoom } from '../lib/firebase'

export default function Home() {
  const navigate = useNavigate()
  const [joinCode, setJoinCode] = useState('')
  const [creating, setCreating] = useState(false)
  const [joinError, setJoinError] = useState('')
  const [password, setPassword] = useState('')

  const handleCreate = async () => {
    setCreating(true)
    try {
      const code = await createRoom(password)
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
      </div>
    </div>
  )
}
