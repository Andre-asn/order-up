import LobbyScreen from './pages/LobbyScreen'
import MainMenu from './pages/MainMenu'
import { Routes, Route } from 'react-router-dom'

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainMenu />} />
      <Route path="/lobby" element={<LobbyScreen />} />
    </Routes>
  )
}

export default App


