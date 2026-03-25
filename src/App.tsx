import MainMenu from './pages/MainMenu'
import RoomWrapper from './pages/RoomWrapper'
import GameOverScreen from './pages/GameOverScreen'
import TutorialPage from './pages/TutorialPage'
import { Routes, Route } from 'react-router-dom'
import { MusicProvider } from './components/MusicContext'

function App() {
  return (
    <MusicProvider>
      <div className="orientation-warning">
        <span className="orientation-warning-icon">📱</span>
        <p className="orientation-warning-title">Please rotate your device</p>
        <p className="orientation-warning-subtitle">Order Up! is best played in portrait mode</p>
      </div>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/tutorial" element={<TutorialPage />} />
        <Route path="/room/:roomId/*" element={<RoomWrapper />} />
        <Route path="/gameover" element={<GameOverScreen />} />
      </Routes>
    </MusicProvider>
  )
}

export default App


