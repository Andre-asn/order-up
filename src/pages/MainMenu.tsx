import '../styles/main-menu.css'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import soupGif from '../assets/soup.gif'
import u1 from '../assets/Untitled-1.gif'
import u2 from '../assets/Untitled-2.gif'
import u3 from '../assets/Untitled-3.gif'
import u4 from '../assets/Untitled-4.gif'
import u5 from '../assets/Untitled-5.gif'
import u6 from '../assets/Untitled-6.gif'
import u7 from '../assets/Untitled-7.gif'
import u8 from '../assets/Untitled-8.gif'

function IconPlus({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function IconUsers({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M16 11C18.209 11 20 9.209 20 7C20 4.791 18.209 3 16 3C13.791 3 12 4.791 12 7C12 9.209 13.791 11 16 11Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 13C10.209 13 12 11.209 12 9C12 6.791 10.209 5 8 5C5.791 5 4 6.791 4 9C4 11.209 5.791 13 8 13Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 21V20C2 17.791 3.791 16 6 16H10C12.209 16 14 17.791 14 20V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14.5 16H18C20.209 16 22 17.791 22 20V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export default function MainMenu() {
    const navigate = useNavigate()
    const [showCreate, setShowCreate] = useState(false)
    const [showJoin, setShowJoin] = useState(false)
    const [hostName, setHostName] = useState('')
    const [gamemode, setGamemode] = useState<'classic' | 'hidden' | 'headChef'>('classic')
    const [error, setError] = useState<string | null>(null)
    const [joinError, setJoinError] = useState<string | null>(null)
    const [joinName, setJoinName] = useState('')
    const [joinRoom, setJoinRoom] = useState('')

    const API_BASE = (import.meta as any).env?.VITE_API_BASE ?? 'http://localhost:3000'

    const submitCreate = async () => {
        setError(null)
        const trimmed = hostName.trim()
        if (trimmed.length < 1 || trimmed.length > 10) {
        setError('Name must be 1-10 characters')
        return
        }
        try {
        const res = await fetch(`${API_BASE}/lobby/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hostName: trimmed, gamemode }),
        })
        if (!res.ok) {
            const msg = await res.text()
            throw new Error(msg || `HTTP ${res.status}`)
        }
        const data = await res.json()
        const roomId = data.roomId
        const playerId = data.playerId
        console.log('data', data)
        if (roomId && playerId) {
            try { localStorage.setItem('playerId', String(playerId)) } catch {}
            navigate(
            `/lobby?roomId=${encodeURIComponent(roomId)}&playerId=${encodeURIComponent(playerId)}`,
            { state: { lobbyData: data } }
            )
        } else {
            setError('Unexpected server response')
        }
        } catch (e: any) {
            setError(e?.message ?? 'Failed to create lobby')
        }
    }

    const handleJoinGame = () => {
        setShowJoin(true)
    }

    const submitJoin = async () => {
        setJoinError(null)
        const name = joinName.trim()
        const room = joinRoom.trim().toUpperCase()
        if (name.length < 1 || name.length > 10) {
        setJoinError('Name must be 1-10 characters')
        return
        }
        if (!room) {
        setJoinError('Enter room code')
        return
        }
        try {
        const res = await fetch(`${API_BASE}/lobby/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId: room, name }),
        })
        if (!res.ok) {
            const msg = await res.text()
            throw new Error(msg || `HTTP ${res.status}`)
        }
        const data = await res.json()
        const roomId = data?.lobby?.roomId ?? room
        const playerId = data.playerId
        if (roomId && playerId) {
            try { localStorage.setItem('playerId', String(playerId)) } catch {}
            navigate(`/lobby?roomId=${encodeURIComponent(roomId)}&playerId=${encodeURIComponent(playerId)}`,
            { state: { lobbyData: data } })
        } else {
            setJoinError('Unexpected server response')
        }
        } catch (e: any) {
        setJoinError(e?.message ?? 'Failed to join lobby')
        }
    }

  return (
    <div className="menu-root">
      <div className="menu-stage">
        <div className="menu-title">
          <div className="menu-title-row">
            <h1 className="menu-title-text">ORDER UP!</h1>
          </div>
        </div>

        <div className="menu-playfield">
          <div className="menu-faces">
            <img src={u1} alt="Chef 1" className="face face-top" />
            <img src={u2} alt="Chef 2" className="face face-top-right" />
            <img src={u3} alt="Chef 3" className="face face-right" />
            <img src={u4} alt="Chef 4" className="face face-bottom-right" />
            <img src={u5} alt="Chef 5" className="face face-bottom" />
            <img src={u6} alt="Chef 6" className="face face-bottom-left" />
            <img src={u7} alt="Chef 7" className="face face-left" />
            <img src={u8} alt="Chef 8" className="face face-top-left" />
          </div>

          <div className="menu-pot">
            <img src={soupGif} alt="Boiling soup pot" className="pot-img" />

            <div className="menu-buttons">
              <button onClick={() => setShowCreate(true)} className="menu-btn btn-light">
                <span className="btn-content">
                  <IconPlus size={20} className="btn-icon" />
                  CREATE GAME
                </span>
                <span className="btn-corner corner-tr" />
                <span className="btn-corner corner-bl" />
              </button>

              <div className="menu-btn-stack">
                <button onClick={handleJoinGame} className="menu-btn btn-dark">
                  <span className="btn-content">
                    <IconUsers size={20} className="btn-icon" />
                    JOIN GAME
                  </span>
                  <span className="btn-corner corner-tr alt" />
                  <span className="btn-corner corner-bl alt" />
                </button>

                <button onClick={() => console.log('Tutorial...')} className="menu-btn btn-light">
                  <span className="btn-content">TUTORIAL</span>
                  <span className="btn-corner corner-tr" />
                  <span className="btn-corner corner-bl" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showCreate && (
        <div className="modal-backdrop" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Create Game</h2>
            <label className="modal-label">Your Name (1-10)</label>
            <input
              className="modal-input"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              maxLength={10}
              placeholder="Chef Name"
            />
            <label className="modal-label">Gamemode</label>
            <div className="modal-radio">
              <label><input type="radio" name="gm" checked={gamemode==='classic'} onChange={() => setGamemode('classic')} /> Classic</label>
              <label><input type="radio" name="gm" checked={gamemode==='hidden'} onChange={() => setGamemode('hidden')} /> Hidden</label>
              <label><input type="radio" name="gm" checked={gamemode==='headChef'} onChange={() => setGamemode('headChef')} /> Head Chef</label>
            </div>
            {error && <div className="modal-error">{error}</div>}
            <div className="modal-actions">
              <button className="menu-btn btn-light" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="menu-btn btn-dark" onClick={submitCreate}>Create</button>
            </div>
          </div>
        </div>
      )}
      {showJoin && (
        <div className="modal-backdrop" onClick={() => setShowJoin(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">Join Game</h2>
            <label className="modal-label">Your Name (1-10)</label>
            <input
              className="modal-input"
              value={joinName}
              onChange={(e) => setJoinName(e.target.value)}
              maxLength={10}
              placeholder="Chef Name"
            />
            <label className="modal-label">Room Code</label>
            <input
              className="modal-input"
              value={joinRoom}
              onChange={(e) => setJoinRoom(e.target.value.toUpperCase())}
              placeholder="e.g. 5MJ7J0"
            />
            {joinError && <div className="modal-error">{joinError}</div>}
            <div className="modal-actions">
              <button className="menu-btn btn-light" onClick={() => setShowJoin(false)}>Cancel</button>
              <button className="menu-btn btn-dark" onClick={submitJoin}>Join</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


