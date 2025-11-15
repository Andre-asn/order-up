import { useEffect, useState, useRef, useMemo } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useMusic } from '../components/MusicContext'
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
import ambienceWav from '../assets/ambience.wav'

type Player = {
    playerId: string
    name: string
    isHost: boolean
}

type GamePhase = 'proposing' | 'voting' | 'cooking' | 'redemption' | 'game_over'

type GameState = {
    roomId: string
    players: Player[]
    gamemode: string
    round: number
    roundSuccessful: [boolean, number | null][]
    currentPhase: GamePhase
    phaseDeadline: number | null
    proponentOrder: string[]
    currentProponentIndex: number
    rejectionCount: number
    roundProposal: Array<{
        proponent: string
        proposal: string[]
        votes: Array<{ playerId: string, inFavor: boolean }>
    }>
    ingredientSelections: Array<{ playerId: string, ingredient: string }>
}

type RoleInfo = {
    yourRole: 'chef' | 'impasta'
    isHeadChef: boolean
    isHiddenImpasta: boolean
    knownImpastas: string[]
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

export default function GameScreen() {
    const { roomId } = useParams()
    const [params] = useSearchParams()
    const navigate = useNavigate()

    const [currentPlayerId] = useState(() => params.get('playerId') || localStorage.getItem('playerId') || '')
    const [ws, setWs] = useState<WebSocket | null>(null)
    const [game, setGame] = useState<GameState | null>(null)
    const [role, setRole] = useState<RoleInfo | null>(null)
    const [error, setError] = useState<string>('')
    const [selectedChefs, setSelectedChefs] = useState<string[]>([])
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
    const [showRoundResult, setShowRoundResult] = useState(false)
    const [lastRoundResult, setLastRoundResult] = useState<{ success: boolean, rottenCount: number } | null>(null)
    const [isRedemptionImpasta, setIsRedemptionImpasta] = useState(false)
    const [voteSent, setVoteSent] = useState(false)
    const [ingredientSent, setIngredientSent] = useState(false)
    const [proposalSent, setProposalSent] = useState(false)

    const mountedRef = useRef(true)
    const reconnectTimeoutRef = useRef<number | null>(null)
    const heartbeatIntervalRef = useRef<number | null>(null)
    const chefAvatars = [a1, a2, a3, a4, a5, a6, a7, a8]

    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [isMusicPlaying, setIsMusicPlaying] = useState(true)
    const { isMusicPlaying: isBackgroundMusicPlaying, toggleMusic: toggleBackgroundMusic } = useMusic()

    useEffect(() => {
		const savedMusicPreference = localStorage.getItem('musicEnabled')
		const shouldPlayMusic = savedMusicPreference !== null ? savedMusicPreference === 'true' : true

		audioRef.current = new Audio(ambienceWav)
		audioRef.current.volume = 0.10
		audioRef.current.loop = true

		if (shouldPlayMusic) {
			audioRef.current.play().catch(() => {
				setIsMusicPlaying(false)
			})
			setIsMusicPlaying(true)
		}

		return () => {
			if (audioRef.current) {
				audioRef.current.pause()
				audioRef.current = null
			}
		}
	}, [])

	const toggleMusic = async () => {
		if (!audioRef.current) return

		if (isMusicPlaying) {
			audioRef.current.pause()
			setIsMusicPlaying(false)
			localStorage.setItem('musicEnabled', 'false')
		} else {
			try {
				await audioRef.current.play()
				setIsMusicPlaying(true)
				localStorage.setItem('musicEnabled', 'true')
			} catch (err) {
			}
		}
	}

    useEffect(() => {
        if (!roomId || !currentPlayerId) {
            setError('Missing room code or player ID')
            return
        }

        let reconnectAttempts = 0
        const maxReconnectAttempts = 5

        const connect = () => {
            // Get WebSocket URL from API_BASE environment variable
            const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3000'
            const wsProtocol = API_BASE.startsWith('https') ? 'wss' : 'ws'
            const wsHost = API_BASE.replace(/^https?:\/\//, '')
            const wsUrl = `${wsProtocol}://${wsHost}/room/${roomId}?playerId=${currentPlayerId}`
            const websocket = new WebSocket(wsUrl)

            websocket.onopen = () => {
                if (mountedRef.current) {
                    setError('')
                    reconnectAttempts = 0

                    // Send immediate ping on connection
                    console.log('[Heartbeat] Connection opened, sending initial ping')
                    websocket.send(JSON.stringify({ type: 'ping' }))

                    // Start heartbeat to prevent Heroku idle timeout (55s)
                    // Send every 25 seconds to be safe (well under 55s limit)
                    heartbeatIntervalRef.current = window.setInterval(() => {
                        if (websocket.readyState === WebSocket.OPEN) {
                            console.log('[Heartbeat] Sending ping')
                            websocket.send(JSON.stringify({ type: 'ping' }))
                        }
                    }, 25000) // Send ping every 25 seconds
                }
            }

            websocket.onmessage = (event) => {
                if (!mountedRef.current) return
                const payload = JSON.parse(event.data)

                switch (payload.type) {
                    case 'pong':
                        console.log('[Heartbeat] Received pong from server')
                        break

                    case 'keepalive':
                        // Server-initiated keepalive to prevent Heroku timeout
                        break

                    case 'game_update':
                        setGame(payload.game)
                        break

                    case 'role_reveal':
                        setRole({
                            yourRole: payload.yourRole,
                            isHeadChef: payload.isHeadChef,
                            isHiddenImpasta: payload.isHiddenImpasta || false,
                            knownImpastas: payload.knownImpastas || []
                        })
                        break

                    case 'phase_change':
                        if (payload.newPhase !== 'cooking') {
                            setSelectedChefs([])
                        }
                        // Reset state when phase changes
                        if (payload.newPhase !== 'voting') {
                            setVoteSent(false)
                        }
                        if (payload.newPhase !== 'cooking') {
                            setIngredientSent(false)
                        }
                        if (payload.newPhase !== 'proposing') {
                            setProposalSent(false)
                        }
                        break

                    case 'proposal_started':
                        setSelectedChefs([])
                        setVoteSent(false)
                        setProposalSent(false)
                        break

                    case 'round_complete':
                        setLastRoundResult({ success: payload.success, rottenCount: payload.rottenCount })
                        setShowRoundResult(true)
                        setTimeout(() => {
                            setShowRoundResult(false)
                        }, 4000)
                        break

                    case 'game_over':
                        websocket.close(1000)

                        const gameOverState = {
                            winner: payload.winner,
                            impastas: payload.impastas || [],
                            headChef: payload.headChef || null,
                            yourRole: role?.yourRole || 'chef',
                            players: payload.players || [],
                            roundSuccessful: payload.roundSuccessful || [],
                            playerCount: payload.players?.length || 6,
                            currentRound: payload.round || 1
                        }

                        navigate('/gameover', {
                            state: gameOverState
                        })
                        break

                    case 'redemption_selected':
                        setIsRedemptionImpasta(true)
                        break

                    case 'error':
                        setError(payload.message)
                        break
                }
            }

            websocket.onerror = () => {
                if (mountedRef.current) {
                    console.error('WebSocket error occurred')
                }
            }

            websocket.onclose = (event) => {
                if (!mountedRef.current) return

                // Clear heartbeat interval
                if (heartbeatIntervalRef.current) {
                    clearInterval(heartbeatIntervalRef.current)
                    heartbeatIntervalRef.current = null
                }

                // Don't reconnect if close was clean (user left intentionally or game over)
                if (event.code === 1000) return

                // Attempt to reconnect if connection dropped unexpectedly
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
            if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current)
            }
            if (ws) {
                ws.close(1000)
            }
        }
    }, [roomId, currentPlayerId])

    useEffect(() => {
        if (!game?.phaseDeadline) {
            setTimeRemaining(null)
            return
        }

        const interval = setInterval(() => {
            const remaining = Math.max(0, Math.ceil((game.phaseDeadline! - Date.now()) / 1000))
            setTimeRemaining(remaining)
            if (remaining === 0) {
                clearInterval(interval)
            }
        }, 100)

        return () => clearInterval(interval)
    }, [game?.phaseDeadline])

    const currentProponent = useMemo(() => {
        if (!game) return null
        return game.proponentOrder[game.currentProponentIndex]
    }, [game])

    const isProponent = currentProponent === currentPlayerId

    const currentProposal = useMemo(() => {
        if (!game || game.roundProposal.length === 0) return null
        return game.roundProposal[game.round - 1]
    }, [game])

    const hasVoted = useMemo(() => {
        if (!currentProposal) return false
        return voteSent || currentProposal.votes.some(v => v.playerId === currentPlayerId)
    }, [currentProposal, currentPlayerId, voteSent])

    const isSelectedChef = useMemo(() => {
        if (!currentProposal) return false
        return currentProposal.proposal.includes(currentPlayerId)
    }, [currentProposal, currentPlayerId])

    const hasSelectedIngredient = useMemo(() => {
        if (!game) return false
        return ingredientSent || game.ingredientSelections.some(s => s.playerId === currentPlayerId)
    }, [game, currentPlayerId, ingredientSent])

    const handleProposeChefs = () => {
        if (!ws || !roomId || selectedChefs.length === 0 || ws.readyState !== WebSocket.OPEN) return

        // Optimistically mark as proposed to prevent double-click
        setProposalSent(true)

        ws.send(JSON.stringify({
            type: 'propose_chefs',
            roomId,
            playerId: currentPlayerId,
            proposedChefs: selectedChefs
        }))
    }

    const handleSkipProposal = () => {
        if (!ws || !roomId || ws.readyState !== WebSocket.OPEN) return

        // Optimistically mark as proposed to prevent double-click
        setProposalSent(true)

        ws.send(JSON.stringify({
            type: 'skip_proposal',
            roomId,
            playerId: currentPlayerId
        }))
    }

    const handleVote = (inFavor: boolean) => {
        if (!ws || !roomId || ws.readyState !== WebSocket.OPEN) return

        // Optimistically mark as voted to prevent double-click
        setVoteSent(true)

        ws.send(JSON.stringify({
            type: 'vote',
            roomId,
            playerId: currentPlayerId,
            inFavor
        }))
    }

    const handleSelectIngredient = (ingredient: 'healthy' | 'rotten') => {
        if (!ws || !roomId || ws.readyState !== WebSocket.OPEN) return

        // Optimistically mark as selected to prevent double-click
        setIngredientSent(true)

        ws.send(JSON.stringify({
            type: 'select_ingredient',
            roomId,
            playerId: currentPlayerId,
            ingredient
        }))
    }

    const handleKillChef = (targetChefId: string) => {
        if (!ws || !roomId || ws.readyState !== WebSocket.OPEN) return

        ws.send(JSON.stringify({
            type: 'kill_chef',
            roomId,
            playerId: currentPlayerId,
            targetChefId
        }))
    }

    const toggleChefSelection = (playerId: string) => {
        if (!game) return
        const requiredChefs = getRequiredChefsForRound(game.round, game.players.length)

        if (selectedChefs.includes(playerId)) {
            setSelectedChefs(selectedChefs.filter(id => id !== playerId))
        } else if (selectedChefs.length < requiredChefs) {
            setSelectedChefs([...selectedChefs, playerId])
        }
    }

    if (error) {
        return (
            <div className="game-root">
                <div className="modal-backdrop">
                    <div className="modal">
                        <h2 className="modal-title">Error</h2>
                        <p>{error}</p>
                        <button className="game-btn" onClick={() => navigate('/')}>
                            Return to Menu
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (!game || !role) {
        return (
            <div className="game-root">
                <div className="game-loading">Loading game...</div>
            </div>
        )
    }

    return (
        <div className="game-root">
            <div className="game-background">
                <img src={soupGif} alt="" className="game-background-soup" />
            </div>

            <div className="game-header">
                <div className="game-header-left">
                    <div className="game-title">Shift {game.round}/5</div>
                    <div className="game-role">
                        <span className={role.yourRole === 'impasta' ? 'role-impasta' : 'role-chef'}>
                            {role.isHeadChef ? 'HEAD CHEF' : role.isHiddenImpasta ? 'HIDDEN IMPASTA' : role.yourRole.toUpperCase()}
                        </span>
                        <button className="ambience-toggle" onClick={toggleMusic} aria-label="Toggle sound">
                            <span className="music-toggle-text">Ambience</span>
                            {isMusicPlaying ? <IconMusicOn /> : <IconMusicOff />}
                        </button>
                        <button className="ambience-toggle" onClick={toggleBackgroundMusic} aria-label="Toggle music">
                            <span className="music-toggle-text">Music</span>
                            {isBackgroundMusicPlaying ? <IconMusicOn /> : <IconMusicOff />}
                        </button>
                    </div>
                </div>
                {timeRemaining !== null && (
                    <div className="game-timer">{timeRemaining}s</div>
                )}
            </div>

            <RoundTracker rounds={game.roundSuccessful} currentRound={game.round} playerCount={game.players.length} />

            {showRoundResult && lastRoundResult && (
                <div className="round-result-popup">
                    <div className={`round-result ${lastRoundResult.success ? 'success' : 'failure'}`}>
                        {lastRoundResult.success ? 'Perfetto!' : 'Disaster!'}
                        <div className="rotten-count">
                            {lastRoundResult.rottenCount ?? 0} rotten ingredient{(lastRoundResult.rottenCount ?? 0) !== 1 ? 's' : ''} {(lastRoundResult.rottenCount ?? 0) !== 1 ? 'were' : 'was'} found!
                        </div>
                    </div>
                </div>
            )}

            <div className="game-layout-wrapper">
                <ProponentOrderPanel
                    game={game}
                    currentProponentIndex={game.currentProponentIndex}
                />

                <div className="game-content">
                {game.currentPhase === 'proposing' && (
                    <ProposingPhase
                        game={game}
                        isProponent={isProponent}
                        selectedChefs={selectedChefs}
                        onToggleChef={toggleChefSelection}
                        onPropose={handleProposeChefs}
                        onSkip={handleSkipProposal}
                        currentPlayerId={currentPlayerId}
                        chefAvatars={chefAvatars}
                        knownImpastas={role.knownImpastas}
                        role={role}
                        proposalSent={proposalSent}
                    />
                )}

                {game.currentPhase === 'voting' && currentProposal && (
                    <VotingPhase
                        game={game}
                        proposal={currentProposal}
                        hasVoted={hasVoted}
                        onVote={handleVote}
                        currentPlayerId={currentPlayerId}
                        chefAvatars={chefAvatars}
                        knownImpastas={role.knownImpastas}
                        role={role}
                    />
                )}

                {game.currentPhase === 'cooking' && currentProposal && (
                    <CookingPhase
                        isSelectedChef={isSelectedChef}
                        hasSelectedIngredient={hasSelectedIngredient}
                        role={role}
                        onSelectIngredient={handleSelectIngredient}
                    />
                )}

                {game.currentPhase === 'redemption' && (
                    <RedemptionPhase
                        game={game}
                        isRedemptionImpasta={isRedemptionImpasta}
                        onKillChef={handleKillChef}
                        chefAvatars={chefAvatars}
                        role={role}
                        currentPlayerId={currentPlayerId}
                    />
                )}
                </div>

                <RoundHistoryPanel
                    game={game}
                    chefAvatars={chefAvatars}
                />
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

function ProposingPhase({ game, isProponent, selectedChefs, onToggleChef, onPropose, onSkip, currentPlayerId, chefAvatars, knownImpastas, role, proposalSent }: any) {
    const requiredChefs: number = getRequiredChefsForRound(game.round, game.players.length)
    const currentProponent: string = game.proponentOrder[game.currentProponentIndex]
    const proponentName: string = game.players.find((p: Player) => p.playerId === currentProponent)?.name

    return (
        <div className="phase-container">
            <div className="phase-title">
                {isProponent ? (
                    <>🍲 Select {requiredChefs} chefs to cook</>
                ) : (
                    <><strong>{proponentName}</strong> is proposing <strong>{requiredChefs}</strong> chefs for this shift.</>
                )}
            </div>

            <div className="players-selection-grid">
                {game.players.map((player: Player, index: number) => {
                    const isSelected = selectedChefs.includes(player.playerId)
                    const isYou = player.playerId === currentPlayerId
                    const isKnownImpasta = knownImpastas.includes(player.playerId)
                    const isYouAndImpasta = isYou && role.yourRole === 'impasta'

                    return (
                        <div
                            key={player.playerId}
                            className={`player-select-card ${isSelected ? 'selected' : ''} ${!isProponent ? 'disabled' : ''} ${isYou ? 'you' : ''}`}
                            onClick={() => isProponent && onToggleChef(player.playerId)}
                        >
                            <img src={chefAvatars[index % 8]} alt={player.name} className="player-avatar" />
                            <div className={`player-name ${isKnownImpasta || isYouAndImpasta ? 'impasta-name' : ''}`}>
                                {player.name}
                            </div>
                        </div>
                    )
                })}
            </div>

            {isProponent && (
                <div className="action-buttons">
                    <button
                        className="game-btn btn-primary"
                        onClick={onPropose}
                        disabled={selectedChefs.length !== requiredChefs || proposalSent}
                    >
                        Propose Team ({selectedChefs.length}/{requiredChefs})
                    </button>
                    <button className="game-btn btn-secondary" onClick={onSkip} disabled={proposalSent}>
                        Skip Turn
                    </button>
                </div>
            )}

            <div className="rejection-counter">
                <div className="rejection-label">Burn Rate: {game.rejectionCount}/5</div>
                <div className="rejection-bar">
                    {game.rejectionCount >= 4 && (
                        <div className="rejection-stop-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 7C12.4142 7 12.75 7.33579 12.75 7.75V12.25C12.75 12.6642 12.4142 13 12 13C11.5858 13 11.25 12.6642 11.25 12.25V7.75C11.25 7.33579 11.5858 7 12 7Z" fill="currentColor"/>
                                <path d="M12 17C12.5523 17 13 16.5523 13 16C13 15.4477 12.5523 15 12 15C11.4477 15 11 15.4477 11 16C11 16.5523 11.4477 17 12 17Z" fill="currentColor"/>
                                <path fillRule="evenodd" clipRule="evenodd" d="M7.32754 1.46967C7.46819 1.32902 7.65895 1.25 7.85786 1.25H16.1421C16.341 1.25 16.5318 1.32902 16.6725 1.46967L22.5303 7.32754C22.671 7.46819 22.75 7.65895 22.75 7.85786V16.1421C22.75 16.341 22.671 16.5318 22.5303 16.6725L16.6725 22.5303C16.5318 22.671 16.341 22.75 16.1421 22.75H7.85786C7.65895 22.75 7.46819 22.671 7.32753 22.5303L1.46967 16.6725C1.32902 16.5318 1.25 16.341 1.25 16.1421V7.85786C1.25 7.65895 1.32902 7.46819 1.46967 7.32754L7.32754 1.46967ZM8.16853 2.75L2.75 8.16853L2.75 15.8315L8.16852 21.25H15.8315L21.25 15.8315V8.16852L15.8315 2.75L8.16853 2.75Z" fill="currentColor"/>
                            </svg>
                        </div>
                    )}
                    <div 
                        className="rejection-fill" 
                        style={{ width: `${(game.rejectionCount / 5) * 100}%` }}
                    />
                </div>
            </div>
        </div>
    )
}

function VotingPhase({ game, proposal, hasVoted, onVote, currentPlayerId, chefAvatars, knownImpastas, role }: any) {
    const proponentName = game.players.find((p: Player) => p.playerId === proposal.proponent)?.name || 'Unknown'

    return (
        <div className="phase-container">
            <div className="phase-title">
                Vote on {proponentName}'s proposal
            </div>

            <div className="voting-layout">
                <div className="voting-left">
                    <div className="proposed-chefs">
                        <div className="proposed-label">Proposed Chefs:</div>
                        <div className="proposed-chefs-list">
                            {proposal.proposal.map((chefId: string) => {
                                const chef = game.players.find((p: Player) => p.playerId === chefId)
                                const index = game.players.findIndex((p: Player) => p.playerId === chefId)
                                const isKnownImpasta = knownImpastas.includes(chefId)
                                const isYouAndImpasta = chefId === currentPlayerId && role.yourRole === 'impasta'
                                if (!chef) return null

                                return (
                                    <div key={chefId} className="proposed-chef">
                                        <img src={chefAvatars[index % 8]} alt={chef.name} className="chef-avatar" />
                                        <div className={`chef-name ${isKnownImpasta || isYouAndImpasta ? 'impasta-name' : ''}`}>
                                            {chef.name}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                <div className="voting-right">
                    <div className="votes-label">Votes:</div>
                    <div className="votes-grid">
                        {game.players.map((player: Player) => {
                            const vote = proposal.votes.find((v: { playerId: string, inFavor: boolean }) => v.playerId === player.playerId)
                            if (!vote) {
                                return (
                                    <div key={player.playerId} className="vote-item pending">
                                        <span className="vote-player">{player.name}</span>
                                        <span className="vote-choice">-</span>
                                    </div>
                                )
                            }

                            return (
                                <div key={player.playerId} className={`vote-item ${vote.inFavor ? 'approve' : 'reject'}`}>
                                    <span className="vote-player">{player.name}</span>
                                    <span className="vote-choice">{vote.inFavor ? '✓' : '✗'}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {!hasVoted ? (
                <div className="vote-buttons">
                    <button className="game-btn vote-yes" onClick={() => onVote(true)}>
                        APPROVE
                    </button>
                    <button className="game-btn vote-no" onClick={() => onVote(false)}>
                        REJECT
                    </button>
                </div>
            ) : (
                <div className="waiting-message">
                    Waiting for other players to vote...
                </div>
            )}

            <div className="vote-count">
                {proposal.votes.length}/{game.players.length} voted
            </div>
        </div>
    )
}

function CookingPhase({ isSelectedChef, hasSelectedIngredient, role, onSelectIngredient }: any) {
    const canChooseRotten = role.yourRole === 'impasta'

    return (
        <div className="phase-container">
            <div className="phase-title">
                🍲 Cooking in progress...
            </div>

            {isSelectedChef && !hasSelectedIngredient ? (
                <div className="ingredient-selection">
                    <div className="ingredient-prompt">Choose your ingredient:</div>
                    <div className="ingredient-buttons">
                        <button
                            className="game-btn ingredient-healthy"
                            onClick={() => onSelectIngredient('healthy')}
                        >
                            Healthy
                        </button>
                        {canChooseRotten && (
                            <button
                                className="game-btn ingredient-rotten"
                                onClick={() => onSelectIngredient('rotten')}
                            >
                            Rotten
                            </button>
                        )}
                    </div>
                </div>
            ) : (
                <div className="waiting-message">
                    {isSelectedChef
                        ? 'Ingredient selected. Waiting for others...'
                        : 'Waiting for chefs to finish cooking...'}
                </div>
            )}
        </div>
    )
}

function RedemptionPhase({ game, isRedemptionImpasta, onKillChef, chefAvatars, role, currentPlayerId }: any) {
    const [selectedTarget, setSelectedTarget] = useState<string | null>(null)

    const handleSelectTarget = (chefId: string) => {
        if (!isRedemptionImpasta) return
        setSelectedTarget(chefId)
    }

    const handleConfirmKill = () => {
        if (selectedTarget) {
            onKillChef(selectedTarget)
        }
    }

    const allImpastas = [...(role.knownImpastas || []), currentPlayerId]

    return (
        <div className="phase-container">
            <div className="phase-title">
                {isRedemptionImpasta ? (
                    <>⚔️ REDEMPTION: Choose a chef to eliminate!</>
                ) : (
                    <>The impastas are deciding...</>
                )}
            </div>

            {isRedemptionImpasta ? (
                <>
                    <div className="redemption-message">
                        You have been chosen for redemption! If you kill the Head Chef, the impastas win!
                    </div>

                    <div className="players-selection-grid">
                        {game.players.map((player: Player, index: number) => {
                            const isImpasta = allImpastas.includes(player.playerId)
                            const isSelected = selectedTarget === player.playerId

                            return (
                                <div
                                    key={player.playerId}
                                    className={`player-select-card ${isSelected ? 'selected' : ''} ${isImpasta ? 'disabled' : ''}`}
                                    onClick={() => !isImpasta && handleSelectTarget(player.playerId)}
                                >
                                    <img src={chefAvatars[index % 8]} alt={player.name} className="player-avatar" />
                                    <div className="player-name">
                                        {player.name}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <button
                        className="game-btn btn-primary redemption-confirm-btn"
                        onClick={handleConfirmKill}
                        disabled={!selectedTarget}
                    >
                        Ice them
                    </button>
                </>
            ) : (
                <div className="waiting-message">
                    An impasta is choosing which chef to eliminate...
                </div>
            )}
        </div>
    )
}

function ProponentOrderPanel({ game, currentProponentIndex }: { game: GameState, currentProponentIndex: number }) {
    return (
        <div className="info-panel proponent-panel">
            <div className="info-panel-title">Proponent Order</div>
            <div className="proponent-list">
                {game.proponentOrder.map((playerId, index) => {
                    const player = game.players.find(p => p.playerId === playerId)
                    const isCurrent = index === currentProponentIndex

                    return (
                        <div key={playerId} className={`proponent-item ${isCurrent ? 'current' : ''}`}>
                            <span className="proponent-number">{index + 1}</span>
                            <span className="proponent-name">{player?.name || 'Unknown'}</span>
                            {isCurrent && <span className="current-indicator">← Current</span>}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function RoundHistoryPanel({ game, chefAvatars }: { game: GameState, chefAvatars: string[] }) {
    const completedRounds = game.round - 1

    if (completedRounds === 0) {
        return (
            <div className="info-panel history-panel">
                <div className="info-panel-title">Shift History</div>
                <div className="no-history">No shifts completed yet</div>
            </div>
        )
    }

    return (
        <div className="info-panel history-panel">
            <div className="info-panel-title">Shift History</div>
            <div className="history-list">
                {Array.from({ length: completedRounds }).map((_, idx) => {
                    const roundNum = idx + 1
                    const proposal = game.roundProposal[idx]
                    const result = game.roundSuccessful[idx]

                    if (!proposal || !result) return null

                    const proponent = game.players.find(p => p.playerId === proposal.proponent)
                    const success = result[0]
                    const rottenCount = result[1]

                    return (
                        <div key={roundNum} className={`history-item ${success ? 'success' : 'failure'}`}>
                            <div className="history-header">
                                <span className="history-round">Shift {roundNum}</span>
                                <span className={`history-result ${success ? 'success' : 'failure'}`}>
                                    {success ? `Perfetto! (${rottenCount} rotten)` : `Disaster! (${rottenCount} rotten)`}
                                </span>
                            </div>

                            <div className="history-content">
                                <div className="history-left">
                                    <div className="history-proponent">
                                        Proponent: <strong>{proponent?.name || 'Unknown'}</strong>
                                    </div>

                                    <div className="history-proposal">
                                        <div className="proposal-label">Proposed Chefs:</div>
                                        <div className="proposal-chefs">
                                            {proposal.proposal.map(chefId => {
                                                const chef = game.players.find(p => p.playerId === chefId)
                                                const chefIndex = game.players.findIndex(p => p.playerId === chefId)
                                                return (
                                                    <div key={chefId} className="mini-chef">
                                                        <img
                                                            src={chefAvatars[chefIndex % 8]}
                                                            alt={chef?.name}
                                                            className="mini-chef-avatar"
                                                        />
                                                        <span className="mini-chef-name">{chef?.name}</span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className="history-right">
                                    <div className="history-votes">
                                        <div className="votes-label">Votes:</div>
                                        <div className="votes-grid">
                                            {game.players.map(player => {
                                                const vote = proposal.votes.find(v => v.playerId === player.playerId)
                                                if (!vote) return null

                                                return (
                                                    <div key={player.playerId} className={`vote-item ${vote.inFavor ? 'approve' : 'reject'}`}>
                                                        <span className="vote-player">{player.name}</span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function getRequiredChefsForRound(round: number, playerCount: number): number {
    const configs: { [key: number]: number[] } = {
        6: [2, 3, 4, 3, 4],
        7: [2, 3, 3, 4, 4],
        8: [3, 4, 4, 5, 5]
    }
    return configs[playerCount]?.[round - 1] || 2
}

function getFailureThresholdForRound(round: number, playerCount: number): number {
    const thresholds: { [key: number]: number[] } = {
        6: [1, 1, 1, 1, 1],
        7: [1, 1, 1, 2, 1],
        8: [1, 1, 1, 2, 1]
    }
    return thresholds[playerCount]?.[round - 1] || 1
}
