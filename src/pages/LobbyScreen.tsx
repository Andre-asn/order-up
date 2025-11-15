import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useRoomWebSocket } from '../contexts/RoomWebSocketContext'

import '../styles/lobby.css'
import a1 from '../assets/Untitled-1.gif'
import a2 from '../assets/Untitled-2.gif'
import a3 from '../assets/Untitled-3.gif'
import a4 from '../assets/Untitled-4.gif'
import a5 from '../assets/Untitled-5.gif'
import a6 from '../assets/Untitled-6.gif'
import a7 from '../assets/Untitled-7.gif'
import a8 from '../assets/Untitled-8.gif'

type ApiPlayer = { 
    playerId: string
    name: string
    isHost: boolean
}

type ApiLobby = { 
    roomId: string
    hostId: string
    players: ApiPlayer[]
    gamemode: 'classic' | 'hidden' | 'headChef'
    roomStatus: 'waiting' | 'playing' | 'finished'
    createdAt: number
}

export default function LobbyScreen() {
    const location = useLocation() as { state?: any }
    const navigate = useNavigate()
    const { ws, error, setError, playerId: currentPlayerId, roomId } = useRoomWebSocket()

    const initial = location.state?.lobbyData
    const [lobby, setLobby] = useState<ApiLobby | null>(initial?.lobby ?? null)

    const chefAvatars = [a1, a2, a3, a4, a5, a6, a7, a8]

    // Listen for WebSocket messages
    useEffect(() => {
        const handleMessage = (event: Event) => {
            const customEvent = event as CustomEvent
            const payload = customEvent.detail

            switch (payload.type) {
                case 'lobby_update':
                    setLobby(payload.lobby)
                    break

                case 'game_starting':
                    console.log(`[LobbyScreen] ${currentPlayerId} received game_starting, navigating to game`)
                    navigate('game')
                    break

                case 'game_update':
                case 'role_reveal':
                case 'phase_change':
                    console.log(`[LobbyScreen] ${currentPlayerId} received ${payload.type} - forwarding to GameScreen via window event`)
                    break

                case 'error':
                    setError(payload.message)
                    break
            }
        }

        window.addEventListener('room-message', handleMessage)
        return () => window.removeEventListener('room-message', handleMessage)
    }, [navigate, setError])

    const derivedHostId = useMemo(() => {
        const id = lobby?.hostId
        const ids = new Set((lobby?.players ?? []).map(p => p.playerId))
        if (id && ids.has(id)) return id
        return lobby?.players?.[0]?.playerId
    }, [lobby])

    const players = useMemo(() => {
        const list = lobby?.players ?? []
        const real = list.map((p, idx) => ({
            id: p.playerId,
            name: p.name,
            isHost: p.playerId === derivedHostId,
            avatarIndex: idx % 8,
            isEmpty: false as const,
        }))
        
        const remaining = Math.max(0, 8 - real.length)
        const empties = Array.from({ length: remaining }).map((_, i) => ({
            id: `empty-${i}`,
            name: 'Waiting for chef...',
            isHost: false,
            isEmpty: true as const,
        }))
        
        return [...real, ...empties]
    }, [lobby, derivedHostId])

    const totalPlayers = players.filter((p) => !p.isEmpty).length
    const isHost = lobby?.hostId === currentPlayerId
    const canStart = totalPlayers >= 6 && totalPlayers <= 8 && isHost

    const handleStartGame = () => {
        if (!ws || !canStart || ws.readyState !== WebSocket.OPEN) return

        ws.send(JSON.stringify({
            type: 'start_game',
            roomId: roomId,
            playerId: currentPlayerId,
        }))
    }

    const handleLeave = () => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'player_left',
                roomId: roomId,
                playerId: currentPlayerId,
            }))

            // Give the message time to be sent before closing the connection
            setTimeout(() => {
                navigate('/')
            }, 100)
        } else {
            navigate('/')
        }
    }

    return (
        <div className="lobby-root">
            {error && (
                <div className="modal-backdrop">
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h2 className="modal-title">An error has occurred</h2>
                        <div className="modal-actions">
                            <button className="lobby-modal-btn" onClick={() => navigate('/')}>
                                Return to Menu
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="lobby-title-wrap">
                <h1 className="lobby-title">Kitchen</h1>
                <div className="room-code">
                    {roomId}
                    <span className="rc-dot tl" />
                    <span className="rc-dot tr" />
                    <span className="rc-dot bl" />
                    <span className="rc-dot br" />
                </div>
            </div>

            {lobby?.gamemode && (
                <div className="lobby-corner right">Mode: {lobby.gamemode.toUpperCase()}</div>
            )}

            <div className="players-grid">
                {players.map((player, index) => {
                    const isYou = !player.isEmpty && player.id === currentPlayerId
                    const cardClasses = [
                        'player-card',
                        index % 2 === 0 ? 'rot-neg' : 'rot-pos',
                        player.isEmpty ? 'empty' : '',
                        isYou ? 'you' : '',
                    ]
                        .filter(Boolean)
                        .join(' ')

                    return (
                        <div key={player.id} className={cardClasses}>
                            <div className={"avatar" + (player.isEmpty ? ' empty' : '')}>
                                {player.isEmpty ? (
                                    <div className="avatar-placeholder">👨‍🍳</div>
                                ) : (
                                    <img
                                        src={chefAvatars[player.avatarIndex ?? 0]}
                                        alt={`Chef ${player.name}`}
                                        className="avatar-img"
                                    />
                                )}
                            </div>
                            <div className={"player-name" + (player.isEmpty ? ' empty' : '')}>
                                {player.name}
                            </div>
                            {player.isHost && !player.isEmpty && (
                                <div className="host-badge">HOST</div>
                            )}
                        </div>
                    )
                })}
            </div>

            <div className="status-bar">
                {totalPlayers}/8 chefs in kitchen • 
                {totalPlayers < 6 
                    ? ` Need ${6 - totalPlayers} more to start!`
                    : ' Ready to cook!'
                }
            </div>

            <div className="actions">
                <button
                    className="start-btn"
                    disabled={!canStart}
                    onClick={handleStartGame}
                    onMouseDown={(e) => {
                        if (canStart) {
                            e.currentTarget.style.transform = 'translate(3px, 3px) rotate(1deg)'
                            e.currentTarget.style.boxShadow = '3px 3px 0px black'
                        }
                    }}
                    onMouseUp={(e) => {
                        if (canStart) {
                            e.currentTarget.style.transform = 'rotate(1deg)'
                            e.currentTarget.style.boxShadow = '6px 6px 0px black'
                        }
                    }}
                >
                    🔥 START COOKING! 🔥
                    {!isHost && totalPlayers >= 6 && ' (Host Only)'}
                </button>
                <button className="leave-btn" onClick={handleLeave}>
                    Leave Kitchen
                </button>
            </div>
        </div>
    )
}