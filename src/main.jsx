import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './styles.css'
import Home from './components/Home'
import Presenter from './components/Presenter'
import Participant from './components/Participant'

function App() {
  return (
    <BrowserRouter>
      <div>
        <header className="app-header">
          <a href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img src="/wahoo_poll.png" alt="WahooPoll" style={{ height: 40 }} />
          </a>
        </header>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/present/:roomCode" element={<Presenter />} />
          <Route path="/join/:roomCode" element={<Participant />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
