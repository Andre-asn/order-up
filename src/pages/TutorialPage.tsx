import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/tutorial.css'
import classicVideo from '../assets/classic-mode.mp4'
import hiddenVideo from '../assets/hidden-mode.mp4'
import headChefVideo from '../assets/headchef-mode.mp4'
import tutorialImage from '../assets/tutorial-reference.png'

type GameMode = 'classic' | 'hidden' | 'headChef'

export default function TutorialPage() {
	const navigate = useNavigate()
	const [activeTab, setActiveTab] = useState<GameMode>('classic')
	const [isImageZoomed, setIsImageZoomed] = useState(false)
	const [zoomedVideo, setZoomedVideo] = useState<string | null>(null)

	const staticImage = tutorialImage

	const gameModes: Record<GameMode, { title: string; howToPlay: string[]; roles: string[]; video?: string }> = {
		classic: {
			title: 'Classic Mode',
			howToPlay: [
				'Play 5 rounds of voting and cooking.',
				'Each round, players vote on which chefs will cook.',
				'Selected chefs secretly choose healthy or rotten ingredients.',
				'Chefs win if 3 out of 5 rounds are "Perfecto!" (all healthy).',
				'Impastas win if 3 out of 5 rounds are "Disaster!" (any rotten).',
                'In games of 7-8 players, Shift #4 requires 2 rotten ingredients for a Disaster! (This applies for every mode)'
			],
			roles: [
				'Chef (majority): Can only choose healthy ingredients. Goal is to create perfect soup.',
				'Impasta (2-3 players): Can choose healthy OR rotten ingredients. Goal is to sabotage.',
				'All Impastas know who their teammates are.',
			],
			video: classicVideo,
		},
		hidden: {
			title: 'Hidden Mode',
			howToPlay: [
				'Same core gameplay as Classic Mode.',
				'One of the Impastas are hidden! They don\'t see their teammates, and they don\'t see them',
			],
			roles: [
				'Chef (majority): Can only choose healthy ingredients.',
				'Hidden Impastas (2-3 players): Can choose healthy OR rotten ingredients. They have to figure out their fellow Impastas throughout the game!',
			],
			video: hiddenVideo,
		},
		headChef: {
			title: 'Head Chef Mode',
			howToPlay: [
				'Same core gameplay with a special Head Chef role.',
				'Head Chef knows all Impastas from the start.',
				'Head Chef must guide the team without revealing too much.',
				'If Chefs win, Redemption phase starts, allowing for one random Impasta to attempt to kill the Head Chef. If succssful, the Impastas win instead.',
			],
			roles: [
				'Chef (majority): Can only choose healthy ingredients.',
				'Head Chef (1 Chef): Knows all Impastas. Must guide team strategically.',
				'Impasta (2 players): Can choose healthy OR rotten ingredients. *In an 7-8 player game, there is 1 hidden Impasta.',
				'Hidden Impasta (1 player): They have to find their fellow Impastas throughout the game!',
			],
			video: headChefVideo,
		},
	}

	return (
		<div className="tutorial-page">
			<div className="tutorial-container">
				<div className="tutorial-header">
					<h1 className="tutorial-title">How to Play</h1>
					<button className="tutorial-back-btn" onClick={() => navigate('/')}>
						← Back to Menu
					</button>
				</div>

				<div className="tutorial-tabs">
					{Object.entries(gameModes).map(([mode, info]) => (
						<button
							key={mode}
							className={`tutorial-tab ${activeTab === mode ? 'active' : ''}`}
							onClick={() => setActiveTab(mode as GameMode)}
						>
							{info.title}
						</button>
					))}
				</div>

				<div className="tutorial-content">
					<div className="tutorial-media-section">
						{staticImage && (
							<div className="tutorial-static-image-container">
								<img 
									src={staticImage} 
									alt="Game reference guide" 
									className="tutorial-static-image"
									onClick={() => setIsImageZoomed(true)}
								/>
								<p className="tutorial-image-hint">Click to zoom</p>
							</div>
						)}
						
						<div 
							className="tutorial-video-container"
							onClick={() => gameModes[activeTab].video && setZoomedVideo(gameModes[activeTab].video!)}
						>
							{gameModes[activeTab].video ? (
								<video
									src={gameModes[activeTab].video}
									className="tutorial-video"
									loop
									autoPlay
									muted
									playsInline
								/>
							) : (
								<div className="tutorial-video-placeholder">
									<p>Gameplay clip coming soon</p>
									<p className="tutorial-video-placeholder-sub">Showcasing {gameModes[activeTab].title} mechanics</p>
								</div>
							)}
						</div>
                        <p className="tutorial-image-hint">Click to zoom</p>
					</div>

					<div className="tutorial-text">
						<h2 className="tutorial-mode-title">{gameModes[activeTab].title}</h2>
						
						<div className="tutorial-section">
							<h3 className="tutorial-section-title">How to Play</h3>
							<ul className="tutorial-list">
								{gameModes[activeTab].howToPlay.map((item, idx) => (
									<li key={idx}>{item}</li>
								))}
							</ul>
						</div>

						<div className="tutorial-section">
							<h3 className="tutorial-section-title">Roles</h3>
							<ul className="tutorial-list">
								{gameModes[activeTab].roles.map((item, idx) => (
									<li key={idx}>{item}</li>
								))}
							</ul>
						</div>
					</div>
				</div>

				{isImageZoomed && staticImage && (
					<div className="tutorial-zoom-overlay" onClick={() => setIsImageZoomed(false)}>
						<div className="tutorial-zoom-container" onClick={(e) => e.stopPropagation()}>
							<button className="tutorial-zoom-close" onClick={() => setIsImageZoomed(false)}>×</button>
							<img src={staticImage} alt="Game reference guide (zoomed)" className="tutorial-zoom-image" />
						</div>
					</div>
				)}

				{zoomedVideo && (
					<div className="tutorial-zoom-overlay" onClick={() => setZoomedVideo(null)}>
						<div className="tutorial-zoom-container" onClick={(e) => e.stopPropagation()}>
							<button className="tutorial-zoom-close" onClick={() => setZoomedVideo(null)}>×</button>
							<video
								src={zoomedVideo}
								className="tutorial-zoom-video"
								loop
								autoPlay
								muted
								playsInline
								controls
							/>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

