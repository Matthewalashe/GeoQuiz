import { Routes, Route, useLocation } from 'react-router-dom'
import Header from './components/Header.jsx'
import Landing from './components/Landing.jsx'
import CategorySelector from './components/CategorySelector.jsx'
import GameScreen from './components/GameScreen.jsx'
import ResultsScreen from './components/ResultsScreen.jsx'
import Leaderboard from './components/Leaderboard.jsx'
import About from './components/About.jsx'
import Challenge from './components/Challenge.jsx'

export default function App() {
  const location = useLocation()
  const isGamePage = location.pathname === '/game'

  return (
    <div className={`app ${isGamePage ? 'fullscreen-game' : ''}`}>
      {!isGamePage && <Header />}
      <main className={isGamePage ? 'app-main-full' : 'app-main'}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/play" element={<CategorySelector />} />
          <Route path="/game" element={<GameScreen />} />
          <Route path="/results" element={<ResultsScreen />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/about" element={<About />} />
          <Route path="/challenge" element={<Challenge />} />
        </Routes>
      </main>
      {!isGamePage && (
        <footer className="app-footer">
          <p>
            GeoQuiz v2.0 — Lagos Edition &nbsp;|&nbsp;
            By <a href="https://wa.me/2348184495633" target="_blank" rel="noopener noreferrer">WhiteArts Technologies</a> &nbsp;|&nbsp;
            Conceived by LASPIC &nbsp;|&nbsp;
            <a href="mailto:donghinny91@gmail.com">Contact</a>
          </p>
        </footer>
      )}
    </div>
  )
}
