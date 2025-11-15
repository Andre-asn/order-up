import '../styles/main-menu.css'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useMusic } from '../components/MusicContext'
import soupGif from '../assets/soup.gif'
import kitchenBg from '../assets/kitchen-background.gif'
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

function IconMusicOn({ size = 24, className = '' }: { size?: number; className?: string }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
			<path fillRule="evenodd" clipRule="evenodd" d="M11.5534 3.06413C11.8249 3.18423 12 3.45315 12 3.75001V20.25C12 20.5469 11.8249 20.8158 11.5534 20.9359C11.2819 21.056 10.9652 21.0047 10.7455 20.805L5.46004 16H2.75C1.7835 16 1 15.2165 1 14.25V9.75001C1 8.78352 1.7835 8.00001 2.75 8.00001H5.46004L10.7455 3.19506C10.9652 2.99537 11.2819 2.94403 11.5534 3.06413ZM10.5 5.44543L6.2545 9.30497C6.11645 9.43047 5.93657 9.50001 5.75 9.50001H2.75C2.61193 9.50001 2.5 9.61194 2.5 9.75001V14.25C2.5 14.3881 2.61193 14.5 2.75 14.5H5.75C5.93657 14.5 6.11645 14.5696 6.2545 14.6951L10.5 18.5546V5.44543Z" fill="#1F2328"/>
			<path d="M18.7175 4.22183C19.0104 3.92893 19.4853 3.92893 19.7782 4.22183C24.0739 8.51759 24.0739 15.4824 19.7782 19.7782C19.4853 20.0711 19.0104 20.0711 18.7175 19.7782C18.4246 19.4853 18.4246 19.0104 18.7175 18.7175C22.4275 15.0075 22.4275 8.99247 18.7175 5.28249C18.4246 4.98959 18.4246 4.51472 18.7175 4.22183Z" fill="#1F2328"/>
			<path d="M16.2426 7.75738C15.9497 7.46449 15.4748 7.46449 15.182 7.75738C14.8891 8.05027 14.8891 8.52515 15.182 8.81804C16.9393 10.5754 16.9393 13.4246 15.182 15.182C14.8891 15.4749 14.8891 15.9498 15.182 16.2427C15.4748 16.5356 15.9497 16.5356 16.2426 16.2427C18.5858 13.8995 18.5858 10.1005 16.2426 7.75738Z" fill="#1F2328"/>
		</svg>
	)
}

function IconMusicOff({ size = 24, className = '' }: { size?: number; className?: string }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
			<path fillRule="evenodd" clipRule="evenodd" d="M12 3.75001C12 3.45315 11.8249 3.18423 11.5534 3.06413C11.2819 2.94403 10.9652 2.99537 10.7455 3.19506L5.46004 8.00001H2.75C1.7835 8.00001 1 8.78352 1 9.75001V14.25C1 15.2165 1.7835 16 2.75 16H5.46004L10.7455 20.805C10.9652 21.0047 11.2819 21.056 11.5534 20.9359C11.8249 20.8158 12 20.5469 12 20.25V3.75001ZM6.2545 9.30497L10.5 5.44543V18.5546L6.2545 14.6951C6.11645 14.5696 5.93657 14.5 5.75 14.5H2.75C2.61193 14.5 2.5 14.3881 2.5 14.25V9.75001C2.5 9.61194 2.61193 9.50001 2.75 9.50001H5.75C5.93657 9.50001 6.11645 9.43047 6.2545 9.30497Z" fill="#1F2328"/>
			<path d="M16.2803 8.21967C15.9874 7.92678 15.5126 7.92678 15.2197 8.21967C14.9268 8.51256 14.9268 8.98744 15.2197 9.28033L17.9393 12L15.2197 14.7197C14.9268 15.0126 14.9268 15.4874 15.2197 15.7803C15.5126 16.0732 15.9874 16.0732 16.2803 15.7803L19 13.0607L21.7197 15.7803C22.0126 16.0732 22.4874 16.0732 22.7803 15.7803C23.0732 15.4874 23.0732 15.0126 22.7803 14.7197L20.0607 12L22.7803 9.28033C23.0732 8.98744 23.0732 8.51256 22.7803 8.21967C22.4874 7.92678 22.0126 7.92678 21.7197 8.21967L19 10.9393L16.2803 8.21967Z" fill="#1F2328"/>
		</svg>
	)
}

export default function MainMenu() {
    const navigate = useNavigate()
    const { isMusicPlaying, toggleMusic } = useMusic()
    const [showCreate, setShowCreate] = useState(false)
    const [showJoin, setShowJoin] = useState(false)
    const [hostName, setHostName] = useState('')
    const [gamemode, setGamemode] = useState<'classic' | 'hidden' | 'headChef'>('classic')
    const [error, setError] = useState<string | null>(null)
    const [joinError, setJoinError] = useState<string | null>(null)
    const [joinName, setJoinName] = useState('')
    const [joinRoom, setJoinRoom] = useState('')
    const [isCreating, setIsCreating] = useState(false)
    const [isJoining, setIsJoining] = useState(false)

    const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3000'

    const submitCreate = async () => {
        if (isCreating) return

        setError(null)
        const trimmed = hostName.trim()
        if (trimmed.length < 1 || trimmed.length > 10) {
            setError('Name must be 1-10 characters')
            return
        }

        setIsCreating(true)
        try {
        const res = await fetch(`${API_BASE}/room/create`, {
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
        if (roomId && playerId) {
            try { localStorage.setItem('playerId', String(playerId)) } catch {}
            navigate(
            `/room/${encodeURIComponent(roomId)}`,
            { state: { lobbyData: data } }
            )
        } else {
            setError('Unexpected server response')
            setIsCreating(false)
        }
        } catch (e: any) {
            setError(e?.message ?? 'Failed to create lobby')
            setIsCreating(false)
        }
    }

    const handleJoinGame = () => {
        setShowJoin(true)
    }

    const submitJoin = async () => {
        if (isJoining) return

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

        setIsJoining(true)
        try {
        const res = await fetch(`${API_BASE}/room/join`, {
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
            navigate(`/room/${encodeURIComponent(roomId)}`,
            { state: { lobbyData: data } })
        } else {
            setJoinError('Unexpected server response')
            setIsJoining(false)
        }
        } catch (e: any) {
            setJoinError(e?.message ?? 'Failed to join lobby')
            setIsJoining(false)
        }
    }

  return (
    <div className="menu-root">
      {/* Kitchen Background */}
      <div className="menu-background">
        <img src={kitchenBg} alt="" className="menu-background-kitchen" />
      </div>

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

                <button onClick={() => {}} className="menu-btn btn-light">
                  <span className="btn-content">TUTORIAL</span>
                  <span className="btn-corner corner-tr" />
                  <span className="btn-corner corner-bl" />
                </button>
              </div>
            </div>
            <div className="music-container">
              <button className="music-toggle" onClick={toggleMusic} aria-label="Toggle music">
                <span className="music-toggle-text">Music</span>
                {isMusicPlaying ? <IconMusicOn /> : <IconMusicOff />}
              </button>
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
              <button className="menu-btn btn-light" onClick={() => setShowCreate(false)} disabled={isCreating}>Cancel</button>
              <button className="menu-btn btn-dark" onClick={submitCreate} disabled={isCreating}>
                {isCreating ? 'Creating...' : 'Create'}
              </button>
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
              <button className="menu-btn btn-light" onClick={() => setShowJoin(false)} disabled={isJoining}>Cancel</button>
              <button className="menu-btn btn-dark" onClick={submitJoin} disabled={isJoining}>
                {isJoining ? 'Joining...' : 'Join'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


