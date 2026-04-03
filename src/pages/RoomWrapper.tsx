import { useParams, useSearchParams, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { RoomWebSocketProvider } from '../contexts/RoomWebSocketContext'
import LobbyScreen from './LobbyScreen'
import GameScreen from './GameScreen'

export const SESSION_KEY = 'order_up_session'

export default function RoomWrapper() {
    const { roomId } = useParams()
    const [params] = useSearchParams()
    const location = useLocation()

    // Capture playerId once on mount — prefer URL param, then localStorage
    const [playerId] = useState(() => {
        const urlPlayerId = params.get('playerId')
        if (urlPlayerId) {
            localStorage.setItem(`playerId_${roomId}`, urlPlayerId)
            return urlPlayerId
        }
        return localStorage.getItem(`playerId_${roomId}`) || localStorage.getItem('playerId') || ''
    })

    // Persist session so a closed tab can rejoin. Cleanup runs on intentional navigation
    // away (React unmount) but NOT on tab close, so the session survives a tab close.
    useEffect(() => {
        if (!roomId || !playerId) return
        const screen = location.pathname.endsWith('/game') ? 'game' : 'lobby'
        localStorage.setItem(SESSION_KEY, JSON.stringify({ roomId, playerId, screen }))
        return () => {
            localStorage.removeItem(SESSION_KEY)
        }
    }, [location.pathname, roomId, playerId])

    // If missing required params, redirect to home
    if (!roomId || !playerId) {
        return <Navigate to="/" replace />
    }

    return (
        <RoomWebSocketProvider roomId={roomId} playerId={playerId}>
            <Routes>
                <Route path="/" element={<LobbyScreen />} />
                <Route path="/game" element={<GameScreen />} />
            </Routes>
        </RoomWebSocketProvider>
    )
}
