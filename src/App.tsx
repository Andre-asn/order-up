import MainMenu from './pages/MainMenu'
import RoomWrapper from './pages/RoomWrapper'
import GameOverScreen from './pages/GameOverScreen'
import TutorialPage from './pages/TutorialPage'
import { Routes, Route } from 'react-router-dom'
import { MusicProvider } from './components/MusicContext'

function App() {
  return (
    <MusicProvider>
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


