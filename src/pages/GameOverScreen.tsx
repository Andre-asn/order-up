import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import '../styles/game.css'
import a1 from '../assets/Untitled-1.gif'
import a2 from '../assets/Untitled-2.gif'
import a3 from '../assets/Untitled-3.gif'
import a4 from '../assets/Untitled-4.gif'
import a5 from '../assets/Untitled-5.gif'
import a6 from '../assets/Untitled-6.gif'
import a7 from '../assets/Untitled-7.gif'
import a8 from '../assets/Untitled-8.gif'
import soupGif from '../assets/soup.gif'

type Player = {
    playerId: string
    name: string
    isHost: boolean
}

type GameOverData = {
    winner: 'chefs' | 'impastas'
    impastas: string[]
    headChef: string | null
    yourRole: 'chef' | 'impasta'
    players: Player[]
    roundSuccessful: [boolean, number | null][]
    playerCount: number
    currentRound: number
}

export default function GameOverScreen() {
    const navigate = useNavigate()
    const location = useLocation()
    const [timeRemaining, setTimeRemaining] = useState(30)
    const chefAvatars = [a1, a2, a3, a4, a5, a6, a7, a8]
    const gameOverData = location.state as GameOverData | null

    useEffect(() => {
        if (!gameOverData) {
            navigate('/')
            return
        }

        const timer = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    clearInterval(timer)
                    navigate('/')
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [navigate, gameOverData])

    if (!gameOverData) {
        return <div>Loading...</div>
    }

    return (
        <div className="game-root">
            {/* Background Soup */}
            <div className="game-background">
                <img src={soupGif} alt="" className="game-background-soup" />
            </div>

            <div className="game-over-screen">
                <div className="winner-announcement">
                    {gameOverData.winner === 'chefs' ? 'CHEFS WIN!' : 'IMPASTAS WIN!'}
                </div>

                <div className="impasta-reveal">
                    <div className="reveal-title">The impastas were:</div>
                    <div className="impasta-list">
                        {gameOverData.impastas.map((impastaId: string) => {
                            const player = gameOverData.players.find((p: Player) => p.playerId === impastaId)
                            const index = gameOverData.players.findIndex((p: Player) => p.playerId === impastaId)
                            if (!player) return null

                            return (
                                <div key={impastaId} className="impasta-card">
                                    <img src={chefAvatars[index % 8]} alt={player.name} className="impasta-avatar" />
                                    <div className="impasta-name">{player.name}</div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {gameOverData.headChef && (
                    <div className="impasta-reveal">
                        <div className="reveal-title">The Head Chef was:</div>
                        <div className="impasta-list">
                            {(() => {
                                const player = gameOverData.players.find((p: Player) => p.playerId === gameOverData.headChef)
                                const index = gameOverData.players.findIndex((p: Player) => p.playerId === gameOverData.headChef)
                                if (!player) return null

                                return (
                                    <div key={gameOverData.headChef} className="impasta-card">
                                        <img src={chefAvatars[index % 8]} alt={player.name} className="impasta-avatar" />
                                        <div className="impasta-name">{player.name}</div>
                                    </div>
                                )
                            })()}
                        </div>
                    </div>
                )}

                <RoundTracker
                    rounds={gameOverData.roundSuccessful}
                    currentRound={gameOverData.currentRound}
                    playerCount={gameOverData.playerCount}
                />

                <div className="game-over-timer">
                    Returning to menu in {timeRemaining}s
                </div>

                <button className="game-btn btn-primary" onClick={() => navigate('/')}>
                    Return to Menu
                </button>
            </div>
        </div>
    )
}

function RoundTracker({ rounds, currentRound, playerCount }: { rounds: [boolean, number | null][], currentRound: number, playerCount: number }) {
    const [hoveredRound, setHoveredRound] = useState<number | null>(null)

    const handleRoundClick = (r: number, showThreshold: boolean) => {
        if (showThreshold) {
            setHoveredRound(hoveredRound === r ? null : r)
        }
    }

    return (
        <div className="round-tracker">
            {[1, 2, 3, 4, 5].map(r => {
                const result = rounds[r - 1]
                const isCurrent = r === currentRound
                const isComplete = result && result[1] !== null
                const threshold = getFailureThresholdForRound(r, playerCount)
                const showThreshold = threshold > 1

                return (
                    <div
                        key={r}
                        className="round-dot-container"
                        onMouseEnter={() => setHoveredRound(r)}
                        onMouseLeave={() => setHoveredRound(null)}
                        onClick={() => handleRoundClick(r, showThreshold)}
                    >
                        <div
                            className={`round-dot ${isCurrent ? 'current' : ''} ${isComplete ? (result[0] ? 'success' : 'failure') : ''}`}
                        >
                            {r}
                            {showThreshold && <span className="threshold-marker">{threshold}</span>}
                        </div>
                        {hoveredRound === r && showThreshold && (
                            <div className="threshold-tooltip">
                                {threshold} rotten ingredient{threshold !== 1 ? 's' : ''} needed for Disaster!
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

function getFailureThresholdForRound(round: number, playerCount: number): number {
    const thresholds: { [key: number]: number[] } = {
        6: [1, 1, 1, 1, 1],
        7: [1, 1, 1, 2, 1],
        8: [1, 1, 1, 2, 1]
    }
    return thresholds[playerCount]?.[round - 1] || 1
}
