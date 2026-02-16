import React, { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import {
  subscribeToRoom,
  updateRoom,
  addQuestion,
  subscribeToQuestions,
  deleteQuestion,
  updateQuestion,
  clearResponses,
  subscribeToResponses,
} from '../lib/firebase'
import ResultsChart from './ResultsChart'
import { QRCodeSVG } from 'qrcode.react'

export default function Presenter() {
  const { roomCode } = useParams()
  const [room, setRoom] = useState(null)
  const [questions, setQuestions] = useState([])
  const [activeResponses, setActiveResponses] = useState([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState('')

  // New question form state
  const [newText, setNewText] = useState('')
  const [newType, setNewType] = useState('single') // 'single' | 'multi'
  const [newOptions, setNewOptions] = useState(['', ''])

  // Edit question state
  const [editingQuestionId, setEditingQuestionId] = useState(null)
  const [editText, setEditText] = useState('')
  const [editType, setEditType] = useState('single')
  const [editOptions, setEditOptions] = useState(['', ''])

  // Check if presenter is already unlocked or no password needed
  useEffect(() => {
    if (!room) return
    if (!room.presenterPassword) {
      setUnlocked(true)
      return
    }
    const key = `livepoll_presenter_unlocked_${roomCode}`
    if (sessionStorage.getItem(key) === 'true') {
      setUnlocked(true)
    }
  }, [room, roomCode])

  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    setPasswordError('')
    if (passwordInput === room.presenterPassword) {
      sessionStorage.setItem(`livepoll_presenter_unlocked_${roomCode}`, 'true')
      setUnlocked(true)
    } else {
      setPasswordError('Incorrect password. Try again.')
    }
  }

  // Subscribe to room
  useEffect(() => {
    return subscribeToRoom(roomCode, setRoom)
  }, [roomCode])

  // Subscribe to questions
  useEffect(() => {
    return subscribeToQuestions(roomCode, setQuestions)
  }, [roomCode])

  // Subscribe to responses for the active question
  useEffect(() => {
    if (!room?.activeQuestionId) {
      setActiveResponses([])
      return
    }
    return subscribeToResponses(roomCode, room.activeQuestionId, setActiveResponses)
  }, [roomCode, room?.activeQuestionId])

  // Auto-cancel edit if the question becomes active
  useEffect(() => {
    if (editingQuestionId && editingQuestionId === room?.activeQuestionId) {
      setEditingQuestionId(null)
    }
  }, [room?.activeQuestionId, editingQuestionId])

  const activeQuestion = questions.find((q) => q.id === room?.activeQuestionId)

  // ---- Actions ----
  const handleActivate = async (questionId) => {
    await updateRoom(roomCode, {
      activeQuestionId: questionId,
      showResults: false,
    })
  }

  const handleToggleResults = async () => {
    await updateRoom(roomCode, { showResults: !room?.showResults })
  }

  const handleCloseQuestion = async () => {
    await updateRoom(roomCode, { activeQuestionId: null, showResults: false })
  }

  const handleDeleteQuestion = async (qId) => {
    if (room?.activeQuestionId === qId) {
      await updateRoom(roomCode, { activeQuestionId: null, showResults: false })
    }
    await deleteQuestion(roomCode, qId)
  }

  const handleAddOption = () => {
    if (newOptions.length < 10) {
      setNewOptions([...newOptions, ''])
    }
  }

  const handleRemoveOption = (idx) => {
    if (newOptions.length > 2) {
      setNewOptions(newOptions.filter((_, i) => i !== idx))
    }
  }

  const handleCreateQuestion = async (e) => {
    e.preventDefault()
    const text = newText.trim()
    const options = newOptions.map((o) => o.trim()).filter(Boolean)
    if (!text) return
    if (options.length < 2) {
      alert('Add at least 2 options')
      return
    }
    await addQuestion(roomCode, { text, type: newType, options })
    setNewText('')
    setNewType('single')
    setNewOptions(['', ''])
    setShowCreateForm(false)
  }

  // ---- Edit question ----
  const handleStartEdit = (question) => {
    setEditingQuestionId(question.id)
    setEditText(question.text)
    setEditType(question.type)
    setEditOptions([...question.options])
  }

  const handleCancelEdit = () => {
    setEditingQuestionId(null)
    setEditText('')
    setEditType('single')
    setEditOptions(['', ''])
  }

  const handleSaveEdit = async (questionId) => {
    const text = editText.trim()
    const options = editOptions.map((o) => o.trim()).filter(Boolean)
    if (!text) return
    if (options.length < 2) {
      alert('Add at least 2 options')
      return
    }
    await updateQuestion(roomCode, questionId, { text, type: editType, options })
    handleCancelEdit()
  }

  const handleEditAddOption = () => {
    if (editOptions.length < 10) {
      setEditOptions([...editOptions, ''])
    }
  }

  const handleEditRemoveOption = (idx) => {
    if (editOptions.length > 2) {
      setEditOptions(editOptions.filter((_, i) => i !== idx))
    }
  }

  const handleClearResponses = async (questionId) => {
    if (!window.confirm('Clear all responses for this question? This cannot be undone.')) return
    await clearResponses(roomCode, questionId)
  }

  // Compute tallies for the active question
  const tallies = computeTallies(activeQuestion, activeResponses)

  if (!room) {
    return (
      <div className="container" style={{ textAlign: 'center', paddingTop: 60 }}>
        Loading room...
      </div>
    )
  }

  if (!unlocked) {
    return (
      <div className="container">
        <div className="card" style={{ maxWidth: 400, margin: '60px auto', textAlign: 'center' }}>
          <h3 style={{ marginBottom: 16 }}>Presenter Access</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: '0.9rem' }}>
            Enter the presenter password for room <strong>{roomCode}</strong>.
          </p>
          <form onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <input
                className="input"
                type="password"
                placeholder="Password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                autoFocus
              />
            </div>
            {passwordError && (
              <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: 12 }}>
                {passwordError}
              </p>
            )}
            <button className="btn btn-primary" type="submit" style={{ width: '100%' }}>
              Unlock
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Join URL for participants
  const joinUrl = `${window.location.origin}/join/${roomCode}`

  return (
    <div className="container-wide">
      {/* Room info bar */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <QRCodeSVG value={joinUrl} size={80} />
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ROOM CODE</div>
            <div className="room-code-small">{roomCode}</div>
          </div>
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'right' }}>
          Join at: <strong>{joinUrl}</strong>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Left: Question list */}
        <div>
          <div className="card">
            <div className="card-header">
              <h3>Questions ({questions.length})</h3>
              <button className="btn btn-primary btn-sm" onClick={() => setShowCreateForm(!showCreateForm)}>
                {showCreateForm ? 'Cancel' : '+ Add Question'}
              </button>
            </div>

            {showCreateForm && (
              <form onSubmit={handleCreateQuestion} style={{ marginBottom: 20 }}>
                <div className="form-group">
                  <label>Question text</label>
                  <input
                    className="input"
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    placeholder="What do you think about...?"
                  />
                </div>
                <div className="form-group">
                  <label>Type</label>
                  <select className="select" value={newType} onChange={(e) => setNewType(e.target.value)}>
                    <option value="single">Single choice</option>
                    <option value="multi">Select all that apply</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Options (2–10)</label>
                  {newOptions.map((opt, i) => (
                    <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                      <input
                        className="input"
                        value={opt}
                        onChange={(e) => {
                          const copy = [...newOptions]
                          copy[i] = e.target.value
                          setNewOptions(copy)
                        }}
                        placeholder={`Option ${i + 1}`}
                      />
                      {newOptions.length > 2 && (
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => handleRemoveOption(i)}>
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  {newOptions.length < 10 && (
                    <button type="button" className="btn btn-outline btn-sm" onClick={handleAddOption}>
                      + Add option
                    </button>
                  )}
                </div>
                <button type="submit" className="btn btn-primary">Create Question</button>
              </form>
            )}

            {questions.length === 0 && !showCreateForm && (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
                No questions yet. Add one to get started.
              </p>
            )}

            {questions.map((q) => (
              <div key={q.id} className={`question-item ${q.id === room.activeQuestionId ? 'active' : ''} ${editingQuestionId === q.id ? 'editing' : ''}`}>
                {editingQuestionId === q.id ? (
                  <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(q.id) }} style={{ width: '100%' }}>
                    <div className="form-group">
                      <label>Question text</label>
                      <input
                        className="input"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        placeholder="What do you think about...?"
                        autoFocus
                      />
                    </div>
                    <div className="form-group">
                      <label>Type</label>
                      <select className="select" value={editType} onChange={(e) => setEditType(e.target.value)}>
                        <option value="single">Single choice</option>
                        <option value="multi">Select all that apply</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Options (2–10)</label>
                      {editOptions.map((opt, i) => (
                        <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                          <input
                            className="input"
                            value={opt}
                            onChange={(e) => {
                              const copy = [...editOptions]
                              copy[i] = e.target.value
                              setEditOptions(copy)
                            }}
                            placeholder={`Option ${i + 1}`}
                          />
                          {editOptions.length > 2 && (
                            <button type="button" className="btn btn-danger btn-sm" onClick={() => handleEditRemoveOption(i)}>
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      {editOptions.length < 10 && (
                        <button type="button" className="btn btn-outline btn-sm" onClick={handleEditAddOption}>
                          + Add option
                        </button>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="submit" className="btn btn-primary btn-sm">Save</button>
                      <button type="button" className="btn btn-outline btn-sm" onClick={handleCancelEdit}>Cancel</button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="q-text">
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{q.text}</div>
                      <span className="q-type">{q.type === 'multi' ? 'Select all' : 'Single choice'}</span>
                      <span className="q-type" style={{ marginLeft: 4 }}>{q.options.length} options</span>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexDirection: 'column' }}>
                      {q.id !== room.activeQuestionId ? (
                        <button className="btn btn-primary btn-sm" onClick={() => handleActivate(q.id)}>
                          Activate
                        </button>
                      ) : (
                        <button className="btn btn-outline btn-sm" onClick={handleCloseQuestion}>
                          Deactivate
                        </button>
                      )}
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => handleStartEdit(q)}
                        disabled={q.id === room.activeQuestionId}
                      >
                        Edit
                      </button>
                      <button className="btn btn-outline btn-sm" onClick={() => handleClearResponses(q.id)}>
                        Clear
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteQuestion(q.id)}>
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Active question & results */}
        <div>
          <div className="card">
            {!activeQuestion ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                <p>Select a question to activate it.</p>
                <p style={{ fontSize: '0.85rem', marginTop: 8 }}>
                  Participants will see it on their devices.
                </p>
              </div>
            ) : (
              <>
                <h3 style={{ marginBottom: 4 }}>{activeQuestion.text}</h3>
                <span className="q-type" style={{ marginBottom: 12, display: 'inline-block' }}>
                  {activeQuestion.type === 'multi' ? 'Select all that apply' : 'Single choice'}
                </span>
                <div className="response-count">
                  {activeResponses.length} response{activeResponses.length !== 1 ? 's' : ''}
                </div>

                <div className="controls-bar">
                  <button className="btn btn-primary btn-sm" onClick={handleToggleResults}>
                    {room.showResults ? 'Hide Results' : 'Show Results'}
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => setFullscreen(true)}>
                    Fullscreen Results
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={handleCloseQuestion}>
                    Close Question
                  </button>
                </div>

                {room.showResults && <ResultsChart question={activeQuestion} tallies={tallies} total={activeResponses.length} />}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen results overlay */}
      {fullscreen && activeQuestion && (
        <div className="fullscreen-results">
          <button className="btn btn-outline close-btn" onClick={() => setFullscreen(false)}>
            ✕ Close
          </button>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <h2 style={{ marginBottom: 8 }}>{activeQuestion.text}</h2>
            <div className="response-count" style={{ fontSize: '1rem' }}>
              {activeResponses.length} response{activeResponses.length !== 1 ? 's' : ''}
            </div>
            <ResultsChart question={activeQuestion} tallies={tallies} total={activeResponses.length} />
          </div>
        </div>
      )}
    </div>
  )
}

function computeTallies(question, responses) {
  if (!question) return {}
  const tallies = {}
  question.options.forEach((opt) => (tallies[opt] = 0))
  responses.forEach((r) => {
    (r.selectedOptions || []).forEach((opt) => {
      if (tallies[opt] !== undefined) tallies[opt]++
    })
  })
  return tallies
}
