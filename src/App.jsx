import { Routes, Route, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Header from './components/Header.jsx'
import Landing from './components/Landing.jsx'
import CategorySelector from './components/CategorySelector.jsx'
import GameScreen from './components/GameScreen.jsx'
import ResultsScreen from './components/ResultsScreen.jsx'
import Leaderboard from './components/Leaderboard.jsx'
import About from './components/About.jsx'
import Challenge from './components/Challenge.jsx'
import Dashboard from './components/Dashboard.jsx'
import Achievements from './components/Achievements.jsx'
import InstallPrompt from './components/InstallPrompt.jsx'
import PageTransition from './components/PageTransition.jsx'
import { processDailyLogin } from './engine/xp.js'

function SplashScreen({ onDone }) {
  const [progress, setProgress] = useState(0)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    let p = 0
    const interval = setInterval(() => {
      p += Math.random() * 8 + 3
      if (p >= 100) {
        p = 100
        clearInterval(interval)
        setTimeout(() => setFadeOut(true), 400)
        setTimeout(() => onDone(), 1000)
      }
      setProgress(Math.min(p, 100))
    }, 120)
    return () => clearInterval(interval)
  }, [onDone])

  return (
    <div className={`splash-screen ${fadeOut ? 'fade-out' : ''}`}>
      <div className="splash-logo">
        <span className="splash-dot" />
        GeoQuiz
      </div>
      <div className="splash-tagline">Explore Nigeria</div>
      <div className="splash-bar-wrap">
        <div className="splash-bar" style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}

export default function App() {
  const location = useLocation()
  const isGamePage = location.pathname === '/game'
  const [showSplash, setShowSplash] = useState(() => {
    // Only show splash on fresh app loads, not on navigations
    const shown = sessionStorage.getItem('geoquiz_splash')
    return !shown
  })

  const [dailyToast, setDailyToast] = useState(null)

  function handleSplashDone() {
    setShowSplash(false)
    sessionStorage.setItem('geoquiz_splash', '1')
  }

  // Process daily login XP
  useEffect(() => {
    const result = processDailyLogin()
    if (!result.alreadyLoggedIn) {
      setDailyToast(result)
      setTimeout(() => setDailyToast(null), 4000)
    }
  }, [])

  return (
    <div className={`app ${isGamePage ? 'fullscreen-game' : ''}`}>
      {showSplash && <SplashScreen onDone={handleSplashDone} />}

      {/* Daily login XP toast */}
      {dailyToast && (
        <div className="daily-toast">
          <div className="daily-toast-inner">
            {dailyToast.streakSaved
              ? <span>❄️ Streak saved! {dailyToast.streakDays} days ({dailyToast.freezesLeft} freezes left)</span>
              : <span>⚡ +{dailyToast.totalXPEarned} XP · 🔥 {dailyToast.streakDays} day streak</span>
            }
          </div>
        </div>
      )}

      {!isGamePage && <Header />}
      <InstallPrompt />
      <main className={isGamePage ? 'app-main-full' : 'app-main'}>
        <PageTransition>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/play" element={<CategorySelector />} />
            <Route path="/game" element={<GameScreen />} />
            <Route path="/results" element={<ResultsScreen />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/about" element={<About />} />
            <Route path="/challenge" element={<Challenge />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/achievements" element={<Achievements />} />
          </Routes>
        </PageTransition>
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
