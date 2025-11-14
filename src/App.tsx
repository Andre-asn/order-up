import LobbyScreen from './pages/LobbyScreen'
import MainMenu from './pages/MainMenu'
import GameScreen from './pages/GameScreen'
import GameOverScreen from './pages/GameOverScreen'
import { Routes, Route } from 'react-router-dom'
import { MusicProvider } from './components/MusicContext'

function App() {
  return (
    <MusicProvider>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/room/:roomId" element={<LobbyScreen />} />
        <Route path="/game/:roomId" element={<GameScreen />} />
        <Route path="/gameover" element={<GameOverScreen />} />
      </Routes>
    </MusicProvider>
  )
}

export default App


