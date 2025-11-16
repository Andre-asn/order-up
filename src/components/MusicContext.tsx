import songWav from '../assets/song.wav'
import { useState, useRef, useEffect, createContext, useContext } from 'react'
import type { ReactNode } from 'react'

interface MusicContextType {
	isMusicPlaying: boolean
	toggleMusic: () => Promise<void>
}

const MusicContext = createContext<MusicContextType | undefined>(undefined)

export function MusicProvider({ children }: { children: ReactNode }) {
	const [isMusicPlaying, setIsMusicPlaying] = useState(() => {
		const savedMusicPreference = localStorage.getItem('musicEnabled')
		return savedMusicPreference !== null ? savedMusicPreference === 'true' : true
	})
	const audioRef = useRef<HTMLAudioElement | null>(null)

	useEffect(() => {
		const savedMusicPreference = localStorage.getItem('musicEnabled')
		const shouldPlayMusic = savedMusicPreference !== null ? savedMusicPreference === 'true' : true

		audioRef.current = new Audio(songWav)
		audioRef.current.volume = 0.4
		audioRef.current.loop = true

		if (shouldPlayMusic) {
			audioRef.current.play().catch(() => {
				setIsMusicPlaying(false)
			})
		} else {
			setIsMusicPlaying(false)
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

	return (
		<MusicContext.Provider value={{ isMusicPlaying, toggleMusic }}>
			{children}
		</MusicContext.Provider>
	)
}

export function useMusic() {
	const context = useContext(MusicContext)
	if (context === undefined) {
		throw new Error('useMusic must be used within a MusicProvider')
	}
	return context
}