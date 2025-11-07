import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import '../styles/lobby.css'
import a1 from '../assets/Untitled-1.gif'
import a2 from '../assets/Untitled-2.gif'
import a3 from '../assets/Untitled-3.gif'
import a4 from '../assets/Untitled-4.gif'
import a5 from '../assets/Untitled-5.gif'
import a6 from '../assets/Untitled-6.gif'
import a7 from '../assets/Untitled-7.gif'
import a8 from '../assets/Untitled-8.gif'

export default function LobbyScreen() {
    const [params] = useSearchParams()
    const [roomCode] = useState<string>(params.get('roomId') ?? 'ABC123')

    // Avatar images imported from src/assets
    const chefAvatars = [a1, a2, a3, a4, a5, a6, a7, a8]

	const [players] = useState<Array<{
		id: string
		name: string
		isHost: boolean
		avatarIndex?: number
		isEmpty?: boolean
	}>>([
		{ id: '1', name: 'Chef Mario', isHost: true, avatarIndex: 0 },
		{ id: '2', name: 'Sous Sally', isHost: false, avatarIndex: 4 },
		{ id: '3', name: 'Baker Bob', isHost: false, avatarIndex: 7 },
		{ id: '4', name: 'Waiting for chef...', isHost: false, isEmpty: true },
		{ id: '5', name: 'Waiting for chef...', isHost: false, isEmpty: true },
		{ id: '6', name: 'Waiting for chef...', isHost: false, isEmpty: true },
		{ id: '7', name: 'Waiting for chef...', isHost: false, isEmpty: true },
		{ id: '8', name: 'Waiting for chef...', isHost: false, isEmpty: true },
	])

	const totalPlayers = players.filter((p) => !p.isEmpty).length

	return (
		<div className="lobby-root">
			{/* Title */}
			<div className="lobby-title-wrap">
				<h1 className="lobby-title">Kitchen</h1>
				<div className="room-code">
					{roomCode}
					<span className="rc-dot tl" />
					<span className="rc-dot tr" />
					<span className="rc-dot bl" />
					<span className="rc-dot br" />
				</div>
			</div>

			{/* Players Grid */}
			<div className="players-grid">
				{players.map((player, index) => {
					const cardClasses = [
						'player-card',
						index % 2 === 0 ? 'rot-neg' : 'rot-pos',
						player.isEmpty ? 'empty' : '',
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
							<div className={"player-name" + (player.isEmpty ? ' empty' : '')}>{player.name}</div>
							{player.isHost && !player.isEmpty && <div className="host-badge">HOST</div>}
						</div>
					)
				})}
			</div>

			{/* Status Bar */}
			<div className="status-bar">
				{totalPlayers}/8 chefs in kitchen • Need {Math.max(0, 6 - totalPlayers)} more to start!
			</div>

			{/* Actions */}
			<div className="actions">
				<button
					className="start-btn"
					disabled={totalPlayers < 6}
					onMouseDown={(e) => {
						if (totalPlayers >= 6) {
							e.currentTarget.style.transform = 'translate(3px, 3px) rotate(1deg)'
							e.currentTarget.style.boxShadow = '3px 3px 0px black'
						}
					}}
					onMouseUp={(e) => {
						if (totalPlayers >= 6) {
							e.currentTarget.style.transform = 'rotate(1deg)'
							e.currentTarget.style.boxShadow = '6px 6px 0px black'
						}
					}}
				>
					🔥 START COOKING! 🔥
				</button>
				<button className="leave-btn">Leave Kitchen</button>
			</div>
		</div>
	)
}


