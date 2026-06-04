import './auth.css'
import './resultcard.css'
// eslint-disable-next-line
import { Routes, Route, useLocation } from 'react-router-dom'
import { useState, useEffect, Component } from 'react'

// ─── ERROR BOUNDARY ───────────────────────────────────────
// Catches ANY React rendering crash and shows a recovery UI
// instead of a blank white page.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack)
  }
  render() {
    if (this.state.hasError) {
      const errMsg = this.state.error?.message || 'Unknown error'
      return (
        <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'Inter, sans-serif', color: '#fff', background: '#1a1a2e', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h2 style={{ color: '#C8963E', marginBottom: '1rem' }}>Something went wrong</h2>
          <p style={{ color: '#aaa', marginBottom: '0.5rem' }}>We hit a bump. Tap reload to continue.</p>
          <p style={{ color: '#666', fontSize: '12px', marginBottom: '1.5rem', maxWidth: '300px', wordBreak: 'break-word' }}>{errMsg}</p>
          <button onClick={() => {
            try { localStorage.clear(); sessionStorage.clear(); } catch(e) {}
            if (window.caches) { caches.keys().then(k => k.forEach(n => caches.delete(n))); }
            if (navigator.serviceWorker) { navigator.serviceWorker.getRegistrations().then(r => r.forEach(sw => sw.unregister())); }
            setTimeout(() => window.location.reload(), 300);
          }} style={{ padding: '12px 32px', borderRadius: '25px', background: '#C8963E', color: '#fff', border: 'none', fontSize: '16px', cursor: 'pointer' }}>Clear &amp; Reload</button>
        </div>
      )
    }
    return this.props.children
  }
}
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
import Community from './components/Community.jsx'
import PostCards from './components/PostCards.jsx'
import PuzzleGame from './components/PuzzleGame.jsx'
import WordGame from './components/WordGame.jsx'
import Rewards from './components/Rewards.jsx'
import StoryMode from './components/StoryMode.jsx'
import CrosswordGame from './components/CrosswordGame.jsx'
import ColoringGame from './components/ColoringGame.jsx'
import TriviaGame from './components/TriviaGame.jsx'
import AdventureGame from './components/AdventureGame.jsx'
import Discovery from './components/Discovery.jsx'
import DealsPage from './components/DealsPage.jsx'
import Explore from './components/Explore.jsx'
import ListingDetail from './components/ListingDetail.jsx'
import PassLanding from './components/PassLanding.jsx'
import ListBusiness from './components/ListBusiness.jsx'
import ListBusinessLanding from './components/ListBusinessLanding.jsx'
import Handymen from './components/Handymen.jsx'
import Notifications from './components/Notifications.jsx'
import InstallPrompt from './components/InstallPrompt.jsx'
import PageTransition from './components/PageTransition.jsx'
import Auth from './components/Auth.jsx'
import AdminDashboard from './components/admin/AdminDashboard.jsx'
import { processDailyLogin } from './engine/xp.js'
import { scheduleNotifChecks, getNotifPermission } from './engine/notifications.js'
import { supabase, getProfile, ensureProfile, syncLocalProgress } from './lib/supabase.js'

// Dark mode hook
function useTheme() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('geoquiz_theme')
    if (saved) return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('geoquiz_theme', theme)
  }, [theme])
  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark')
  return { theme, toggle }
}

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
        <img src="/wanda-logo.png" alt="Wanda" className="splash-logo-img" />
      </div>
      <div className="splash-tagline">Experience Nigeria</div>
      <div className="splash-bar-wrap">
        <div className="splash-bar" style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}

export default function App() {
  const location = useLocation()
  const GAME_ROUTES = ['/game', '/crossword', '/coloring', '/puzzle', '/wordgame', '/trivia', '/adventure']
  const isGamePage = GAME_ROUTES.includes(location.pathname)
  const isAdminPage = location.pathname === '/admin'
  const isDashboardPage = location.pathname === '/dashboard'
  const isStandalonePage = isAdminPage || isDashboardPage
  const { theme, toggle: toggleTheme } = useTheme()
  const [showSplash, setShowSplash] = useState(() => {
    // Only show splash on fresh app loads, not on navigations
    const shown = sessionStorage.getItem('geoquiz_splash')
    return !shown
  })

  const [dailyToast, setDailyToast] = useState(null)
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)

  function handleSplashDone() {
    setShowSplash(false)
    sessionStorage.setItem('geoquiz_splash', '1')
  }

  // Auth & Profile management
  useEffect(() => {
    if (!supabase) return // No Supabase configured — skip auth

    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) handleAuthUser(session.user)
    }).catch(err => console.warn('[Auth] getSession failed:', err))

    // Listen for ALL auth changes (login, signup, OAuth callback, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth]', event, session?.user?.email || 'no user')
      setSession(session)
      if (session?.user) {
        handleAuthUser(session.user)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  /**
   * Called after ANY successful auth. Guarantees a profile exists.
   * This is the safety net — if the DB trigger failed, this creates the profile.
   */
  async function handleAuthUser(user) {
    try {
      // ensureProfile: checks if profile exists, creates it if not
      const p = await ensureProfile(user)
      setProfile(p)

      // Sync local XP progress (once per device)
      const alreadySynced = localStorage.getItem('geoquiz_synced')
      if (!alreadySynced && p) {
        await syncLocalProgress(user.id)
        // Re-fetch to get updated XP
        try {
          const updated = await getProfile(user.id)
          setProfile(updated)
        } catch { /* use what we have */ }
      }
    } catch (err) {
      console.warn('handleAuthUser error:', err.message)
      // Last resort fallback — at least show something
      setProfile({
        id: user.id,
        email: user.email || '',
        username: user.user_metadata?.username || user.email?.split('@')[0] || 'Explorer',
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '🧭',
        role: 'user',
        total_xp: 0,
        streak_days: 0,
        level: 1,
      })
    }
  }

  // Process daily login XP
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const result = processDailyLogin()
    if (!result.alreadyLoggedIn) {
      setDailyToast(result)
      setTimeout(() => setDailyToast(null), 4000)
    }
    // Start notification scheduler
    if (getNotifPermission() === 'granted') scheduleNotifChecks()
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */  

  return (
    <ErrorBoundary>
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

      {!isGamePage && !isStandalonePage && <Header theme={theme} toggleTheme={toggleTheme} session={session} profile={profile} />}
      {!isStandalonePage && <InstallPrompt />}
      <main className={isGamePage ? 'app-main-full' : isStandalonePage ? '' : 'app-main'}>
        <PageTransition>
          <Routes>
            <Route path="/" element={<Landing session={session} profile={profile} />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/explore/:id" element={<ListingDetail />} />
            <Route path="/play" element={<CategorySelector />} />
            <Route path="/game" element={<GameScreen />} />
            <Route path="/results" element={<ResultsScreen />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/about" element={<About />} />
            <Route path="/challenge" element={<Challenge />} />
            <Route path="/dashboard" element={<Dashboard session={session} profile={profile} />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/community" element={<Community session={session} profile={profile} />} />
            <Route path="/postcards" element={<PostCards />} />
            <Route path="/puzzle" element={<PuzzleGame />} />
            <Route path="/wordgame" element={<WordGame />} />
            <Route path="/crossword" element={<CrosswordGame />} />
            <Route path="/coloring" element={<ColoringGame />} />
            <Route path="/trivia" element={<TriviaGame />} />
            <Route path="/adventure" element={<AdventureGame />} />
            <Route path="/rewards" element={<Rewards session={session} profile={profile} />} />
            <Route path="/story" element={<StoryMode />} />
            <Route path="/discovery" element={<Discovery />} />
            <Route path="/deals" element={<DealsPage />} />
            <Route path="/pass" element={<PassLanding />} />
            <Route path="/list-your-business" element={<ListBusinessLanding />} />
            <Route path="/list-your-business/form" element={<ListBusiness />} />
            <Route path="/handymen" element={<Handymen />} />
            <Route path="/notifications" element={<Notifications session={session} />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<AdminDashboard session={session} profile={profile} />} />
          </Routes>
        </PageTransition>
      </main>
      {!isGamePage && !isStandalonePage && (
        <footer className="app-footer">
          <p>
            Wanda — Experience Nigeria &nbsp;|&nbsp;
            By <a href="https://wa.me/2348184495633" target="_blank" rel="noopener noreferrer">WhiteArts Technologies</a> &nbsp;|&nbsp;
            <a href="mailto:donghinny91@gmail.com">Contact</a>
          </p>
        </footer>
      )}
    </div>
    </ErrorBoundary>
  )
}
