import React, { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { subscribeToRoom, subscribeToQuestions, submitResponse } from '../lib/firebase'

// Generate a stable participant ID per browser session
function getParticipantId() {
  let id = sessionStorage.getItem('livepoll_pid')
  if (!id) {
    id = 'p_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
    sessionStorage.setItem('livepoll_pid', id)
  }
  return id
}

export default function Participant() {
  const { roomCode } = useParams()
  const [room, setRoom] = useState(null)
  const [questions, setQuestions] = useState([])
  const [selected, setSelected] = useState([]) // selected option texts
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [lastQuestionId, setLastQuestionId] = useState(null)

  const participantId = useMemo(() => getParticipantId(), [])

  useEffect(() => {
    return subscribeToRoom(roomCode, setRoom)
  }, [roomCode])

  useEffect(() => {
    return subscribeToQuestions(roomCode, setQuestions)
  }, [roomCode])

  const activeQuestion = questions.find((q) => q.id === room?.activeQuestionId)

  // Reset selection when active question changes
  useEffect(() => {
    if (room?.activeQuestionId && room.activeQuestionId !== lastQuestionId) {
      setSelected([])
      setSubmitted(false)
      setLastQuestionId(room.activeQuestionId)
    }
  }, [room?.activeQuestionId, lastQuestionId])

  const handleToggleOption = (option) => {
    if (submitted) return
    if (activeQuestion.type === 'single') {
      setSelected([option])
    } else {
      // multi-select toggle
      setSelected((prev) =>
        prev.includes(option) ? prev.filter((o) => o !== option) : [...prev, option]
      )
    }
  }

  const handleSubmit = async () => {
    if (selected.length === 0 || submitting) return
    setSubmitting(true)
    try {
      await submitResponse(roomCode, room.activeQuestionId, participantId, selected)
      setSubmitted(true)
    } catch (err) {
      alert('Error submitting: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!room) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: 60 }}>
        Connecting to room <strong>{roomCode}</strong>...
      </div>
    )
  }

  return (
    <div className="container">
      <div className="card" style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ROOM</div>
        <div className="room-code-small">{roomCode}</div>
      </div>

      {!activeQuestion ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>Waiting for a question...</div>
          <p style={{ color: 'var(--text-muted)' }}>
            The presenter hasn't activated a question yet. Hang tight!
          </p>
        </div>
      ) : submitted ? (
        <div className="card submitted-msg">
          <div className="checkmark">✓</div>
          <h3>Response submitted!</h3>
          <p style={{ marginTop: 8, color: 'var(--text-muted)' }}>
            Waiting for the next question...
          </p>
        </div>
      ) : (
        <div className="card">
          <h3 style={{ marginBottom: 4 }}>{activeQuestion.text}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
            {activeQuestion.type === 'multi'
              ? 'Select all that apply'
              : 'Choose one'}
          </p>

          {activeQuestion.options.map((opt) => (
            <button
              key={opt}
              className={`option-btn ${selected.includes(opt) ? 'selected' : ''}`}
              onClick={() => handleToggleOption(opt)}
            >
              {activeQuestion.type === 'multi' && (
                <span style={{ marginRight: 8, fontWeight: 700 }}>
                  {selected.includes(opt) ? '☑' : '☐'}
                </span>
              )}
              {activeQuestion.type === 'single' && (
                <span style={{ marginRight: 8, fontWeight: 700 }}>
                  {selected.includes(opt) ? '●' : '○'}
                </span>
              )}
              {opt}
            </button>
          ))}

          <button
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 12 }}
            onClick={handleSubmit}
            disabled={selected.length === 0 || submitting}
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      )}
    </div>
  )
}
