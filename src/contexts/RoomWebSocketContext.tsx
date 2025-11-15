import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

type WebSocketContextType = {
    ws: WebSocket | null
    error: string
    setError: (error: string) => void
    playerId: string
    roomId: string
}

const RoomWebSocketContext = createContext<WebSocketContextType | null>(null)

export function useRoomWebSocket() {
    const context = useContext(RoomWebSocketContext)
    if (!context) {
        throw new Error('useRoomWebSocket must be used within RoomWebSocketProvider')
    }
    return context
}

type Props = {
    roomId: string
    playerId: string
    children: ReactNode
}

export function RoomWebSocketProvider({ roomId, playerId, children }: Props) {
    const [ws, setWs] = useState<WebSocket | null>(null)
    const [error, setError] = useState<string>('')
    const mountedRef = useRef(true)
    const reconnectTimeoutRef = useRef<number | null>(null)
    const wsRef = useRef<WebSocket | null>(null)

    useEffect(() => {
        if (!roomId || !playerId) {
            setError('Missing room code or player ID')
            return
        }

        let reconnectAttempts = 0
        const maxReconnectAttempts = 5

        const connect = () => {
            const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3000'
            const wsProtocol = API_BASE.startsWith('https') ? 'wss' : 'ws'
            const wsHost = API_BASE.replace(/^https?:\/\//, '')
            const wsUrl = `${wsProtocol}://${wsHost}/room/${roomId}?playerId=${playerId}`

            const websocket = new WebSocket(wsUrl)
            wsRef.current = websocket

            websocket.onopen = () => {
                if (mountedRef.current) {
                    setError('')
                    reconnectAttempts = 0
                }
            }

            websocket.onmessage = (event) => {
                if (!mountedRef.current) return

                const payload = JSON.parse(event.data)

                if (payload.type === 'keepalive') {
                    if (websocket.readyState === WebSocket.OPEN) {
                        websocket.send(JSON.stringify({ type: 'keepalive_ack' }))
                    }
                    return
                }

                console.log(`[WebSocketContext] ${playerId} received raw message:`, payload.type)
                window.dispatchEvent(new CustomEvent('room-message', { detail: payload }))
            }

            websocket.onerror = () => {
            }

            websocket.onclose = (event) => {
                if (!mountedRef.current) return

                if (event.code === 1000) return

                if (reconnectAttempts < maxReconnectAttempts) {
                    reconnectAttempts++
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts - 1), 10000)

                    reconnectTimeoutRef.current = window.setTimeout(() => {
                        if (mountedRef.current) {
                            connect()
                        }
                    }, delay)
                } else {
                    setError('Connection lost. Please refresh the page.')
                }
            }

            setWs(websocket)
        }

        connect()

        return () => {
            mountedRef.current = false
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current)
            }
            if (wsRef.current) {
                wsRef.current.close(1000)
            }
        }
    }, [roomId, playerId])

    return (
        <RoomWebSocketContext.Provider value={{ ws, error, setError, playerId, roomId }}>
            {children}
        </RoomWebSocketContext.Provider>
    )
}
