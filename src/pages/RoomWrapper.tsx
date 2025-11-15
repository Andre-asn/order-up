import { useParams, useSearchParams, Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import { RoomWebSocketProvider } from '../contexts/RoomWebSocketContext'
import LobbyScreen from './LobbyScreen'
import GameScreen from './GameScreen'

export default function RoomWrapper() {
    const { roomId } = useParams()
    const [params] = useSearchParams()

    // Capture playerId once on mount and persist it
    const [playerId] = useState(() => {
        const urlPlayerId = params.get('playerId')
        if (urlPlayerId) {
            // Store in sessionStorage (per-tab) instead of localStorage (shared across tabs)
            sessionStorage.setItem(`playerId_${roomId}`, urlPlayerId)
            return urlPlayerId
        }
        // Try to get from sessionStorage for this room
        const storedPlayerId = sessionStorage.getItem(`playerId_${roomId}`)
        if (storedPlayerId) {
            return storedPlayerId
        }
        // Fallback to localStorage (for backwards compatibility)
        return localStorage.getItem('playerId') || ''
    })

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
