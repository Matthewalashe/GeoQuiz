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
import InstallPrompt from './components/InstallPrompt.jsx'
import PageTransition from './components/PageTransition.jsx'
import SEO, { SEO_PAGES } from './components/SEO.jsx'

// ─── Lazy-loaded routes for code splitting ───
import { lazy, Suspense } from 'react'
const CategorySelector = lazy(() => import('./components/CategorySelector.jsx'))
const GameScreen = lazy(() => import('./components/GameScreen.jsx'))
const ResultsScreen = lazy(() => import('./components/ResultsScreen.jsx'))
const Leaderboard = lazy(() => import('./components/Leaderboard.jsx'))
const About = lazy(() => import('./components/About.jsx'))
const Challenge = lazy(() => import('./components/Challenge.jsx'))
const Dashboard = lazy(() => import('./components/Dashboard.jsx'))
const Achievements = lazy(() => import('./components/Achievements.jsx'))
const Community = lazy(() => import('./components/Community.jsx'))
const PostCards = lazy(() => import('./components/PostCards.jsx'))
const WordGame = lazy(() => import('./components/WordGame.jsx'))
const Rewards = lazy(() => import('./components/Rewards.jsx'))
const TriviaGame = lazy(() => import('./components/TriviaGame.jsx'))
const PinPointGame = lazy(() => import('./components/PinPointGame.jsx'))
const FlagStackGame = lazy(() => import('./components/FlagStackGame.jsx'))
const Discovery = lazy(() => import('./components/Discovery.jsx'))
const DealsPage = lazy(() => import('./components/DealsPage.jsx'))
const Explore = lazy(() => import('./components/Explore.jsx'))
const ListingDetail = lazy(() => import('./components/ListingDetail.jsx'))
const PassLanding = lazy(() => import('./components/PassLanding.jsx'))
const ListBusiness = lazy(() => import('./components/ListBusiness.jsx'))
const ListBusinessLanding = lazy(() => import('./components/ListBusinessLanding.jsx'))
const Handymen = lazy(() => import('./components/Handymen.jsx'))
const BusinessDetail = lazy(() => import('./components/BusinessDetail.jsx'))
const Notifications = lazy(() => import('./components/Notifications.jsx'))
const PuzzleGame = lazy(() => import('./components/PuzzleGame.jsx'))
const CrosswordGame = lazy(() => import('./components/CrosswordGame.jsx'))
const ColoringGame = lazy(() => import('./components/ColoringGame.jsx'))
const AdventureGame = lazy(() => import('./components/AdventureGame.jsx'))
const StoryMode = lazy(() => import('./components/StoryMode.jsx'))
const Auth = lazy(() => import('./components/Auth.jsx'))
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard.jsx'))
const Flyer = lazy(() => import('./components/Flyer.jsx'))
const CreateEvent = lazy(() => import('./components/CreateEvent.jsx'))
const EventDetail = lazy(() => import('./components/EventDetail.jsx'))
const EventPass = lazy(() => import('./components/EventPass.jsx'))
import { processDailyLogin, getXPData, getLevel, getLevelTitle, getCurrentLeague } from './engine/xp.js'
import { preloadQuestionBank } from './engine/questionBank.js'
import { scheduleNotifChecks, getNotifPermission } from './engine/notifications.js'
import { supabase, getProfile, ensureProfile, syncLocalProgress } from './lib/supabase.js'
import { CelebrationOverlay, useCelebrations, checkMilestones } from './engine/celebrations.jsx'
import { getBalance } from './engine/coinEconomy.js'

// Dark mode hook
function useTheme() {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('geoquiz_theme')
    if (saved) return saved
    return 'light'
  })
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('geoquiz_theme', theme)
  }, [theme])
  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark')
  return { theme, toggle }
}

// Splash screen removed — was causing a brief flash before app loads (bad UX)

export default function App() {
  const location = useLocation()
  const GAME_ROUTES = ['/game', '/quiz', '/wordgame', '/trivia', '/pinpoint', '/flagstack', '/puzzle', '/crossword', '/coloring', '/adventure', '/story', '/postcards']
  const isGamePage = GAME_ROUTES.includes(location.pathname)
  const isAdminPage = location.pathname === '/admin'
  const isDashboardPage = location.pathname === '/dashboard'
  const isStandalonePage = isAdminPage || isDashboardPage
  const { theme, toggle: toggleTheme } = useTheme()

  const [dailyToast, setDailyToast] = useState(null)
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)

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

      // Send welcome notifications for brand-new users
      const isNew = !localStorage.getItem('wanda_welcomed_' + user.id)
      if (isNew && p) {
        localStorage.setItem('wanda_welcomed_' + user.id, '1')
        // Fire welcome notifications (non-blocking)
        import('./lib/push.js').then(({ createNotification }) => {
          createNotification(user.id, { type: 'info', title: '🎉 Welcome to Wanda!', body: 'You just joined Nigeria\'s most exciting exploration platform. Let\'s get started!', icon: '🎉', link: '/' })
          setTimeout(() => createNotification(user.id, { type: 'info', title: '🗺️ Explore Lagos', body: 'Discover restaurants, hotels, attractions, and hidden gems across Lagos with interactive maps.', icon: '🗺️', link: '/explore' }), 500)
          setTimeout(() => createNotification(user.id, { type: 'info', title: '🎮 Play & Win', body: 'Test your knowledge with geography quizzes, word games, trivia, and more. Earn XP and climb the leaderboard!', icon: '🎮', link: '/play' }), 1000)
          setTimeout(() => createNotification(user.id, { type: 'info', title: '🎟️ Events & Passes', body: 'RSVP to events, download your event pass, and connect with other attendees.', icon: '🎟️', link: '/pass' }), 1500)
          setTimeout(() => createNotification(user.id, { type: 'info', title: '📍 List Your Business', body: 'Own a business? List it free and get discovered by thousands of explorers.', icon: '📍', link: '/list-your-business' }), 2000)
          setTimeout(() => createNotification(user.id, { type: 'info', title: '🏆 Achievements & Rewards', body: 'Complete challenges, earn badges, collect daily rewards, and unlock exclusive content.', icon: '🏆', link: '/achievements' }), 2500)
        })
      }

      // Check for app updates and notify (once per version)
      try {
        const res = await fetch('/version.json?t=' + Date.now())
        const ver = await res.json()
        const lastSeen = localStorage.getItem('wanda_last_version')
        if (lastSeen && lastSeen !== ver.version && p) {
          import('./lib/push.js').then(({ createNotification }) => {
            createNotification(user.id, {
              type: 'info',
              title: '🆕 Wanda just got better!',
              body: `Version ${ver.version} is here! New features: Scannable QR codes on event passes, tap-to-navigate venue addresses, image preview overlay, Aso-Ebi fields, and more. Pull down to refresh!`,
              icon: '🚀',
              link: '/notifications'
            })
          })
        }
        localStorage.setItem('wanda_last_version', ver.version)
      } catch { /* version check is non-critical */ }

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
        avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || '',
        role: 'user',
        total_xp: 0,
        streak_days: 0,
        level: 1,
      })
    }
  }

  const { celebrate, celebrationProps } = useCelebrations()

  // Process daily login XP
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const prevXP = getXPData().totalXP
    const prevLevel = getLevel(prevXP)
    const prevLeague = getCurrentLeague(prevXP)

    const result = processDailyLogin()
    if (!result.alreadyLoggedIn) {
      setDailyToast(result)
      setTimeout(() => setDailyToast(null), 4000)

      // Check milestones after XP update
      const newXP = getXPData().totalXP
      const newLevel = getLevel(newXP)
      const coins = getBalance()
      const milestone = checkMilestones({
        level: newLevel, prevLevel,
        streak: result.streakDays || 0,
        coins,
        league: getCurrentLeague(newXP), prevLeague,
      })
      if (milestone) {
        setTimeout(() => {
          celebrate(milestone.type, {
            ...milestone.data,
            title: getLevelTitle(newLevel),
          })
        }, 1500) // Show after daily toast
      }
    }
    // Start notification scheduler
    if (getNotifPermission() === 'granted') scheduleNotifChecks()
    // Preload question bank data in background
    preloadQuestionBank()
  }, [])
  /* eslint-enable react-hooks/set-state-in-effect */  

  return (
    <ErrorBoundary>
    <div className={`app ${isGamePage ? 'fullscreen-game' : ''}`}>
      {/* Splash screen removed */}

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
      <CelebrationOverlay {...celebrationProps} />
      <main className={isGamePage ? 'app-main-full' : isStandalonePage ? '' : 'app-main'}>
        <PageTransition>
          <Suspense fallback={<div style={{ display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh',flexDirection:'column',gap:'0.75rem' }}><div style={{ width:36,height:36,border:'3px solid var(--border)',borderTopColor:'var(--primary)',borderRadius:'50%',animation:'spin .6s linear infinite' }} /><span style={{ color:'var(--text-secondary)',fontSize:'0.85rem' }}>Loading...</span></div>}>
          <Routes>
            <Route path="/" element={<><SEO {...SEO_PAGES.home} /><Landing session={session} profile={profile} /></>} />
            <Route path="/explore" element={<><SEO {...SEO_PAGES.explore} /><Explore /></>} />
            <Route path="/explore/:id" element={<><SEO title="Explore" description="Discover this listing on Wanda." /><ListingDetail /></>} />
            <Route path="/play" element={<><SEO {...SEO_PAGES.play} /><CategorySelector session={session} /></>} />
            <Route path="/game" element={<><SEO title="Map Quiz" description="Pin the location on the map! Test your Nigerian geography knowledge." /><GameScreen /></>} />
            <Route path="/quiz" element={<><SEO title="Quiz" description="Answer geography questions about Nigeria." /><GameScreen /></>} />
            <Route path="/results" element={<><SEO title="Results" description="See how you scored on the quiz!" /><ResultsScreen /></>} />
            <Route path="/leaderboard" element={<><SEO {...SEO_PAGES.leaderboard} /><Leaderboard /></>} />
            <Route path="/about" element={<><SEO {...SEO_PAGES.about} /><About /></>} />
            <Route path="/challenge" element={<><SEO title="Daily Challenge" description="Take on today's geography challenge and compete with other players." /><Challenge /></>} />
            <Route path="/dashboard" element={<><SEO {...SEO_PAGES.dashboard} /><Dashboard session={session} profile={profile} /></>} />
            <Route path="/achievements" element={<><SEO {...SEO_PAGES.achievements} /><Achievements /></>} />
            <Route path="/community" element={<><SEO {...SEO_PAGES.community} /><Community session={session} profile={profile} /></>} />
            <Route path="/postcards" element={<><SEO title="Postcards" description="Collect beautiful digital postcards of Nigerian landmarks and places." /><PostCards /></>} />
            <Route path="/wordgame" element={<><SEO {...SEO_PAGES.wordGame} /><WordGame /></>} />
            <Route path="/trivia" element={<><SEO {...SEO_PAGES.trivia} /><TriviaGame /></>} />
            <Route path="/pinpoint" element={<><SEO title="PinPoint" description="How precisely can you locate places on the map? Test your accuracy!" /><PinPointGame /></>} />
            <Route path="/flagstack" element={<><SEO title="Flag Stack" description="Match flags to their Nigerian states and African countries." /><FlagStackGame /></>} />
            <Route path="/puzzle" element={<><SEO title="Puzzle" description="Solve visual puzzles featuring Nigerian landmarks and scenery." /><PuzzleGame /></>} />
            <Route path="/crossword" element={<><SEO title="Crossword" description="Complete crossword puzzles about Nigerian geography and culture." /><CrosswordGame /></>} />
            <Route path="/coloring" element={<><SEO title="Coloring" description="Color beautiful scenes of Nigerian landmarks and landscapes." /><ColoringGame /></>} />
            <Route path="/adventure" element={<><SEO title="Adventure" description="Embark on a story-driven adventure through Nigeria's cities and landmarks." /><AdventureGame /></>} />
            <Route path="/story" element={<><SEO title="Story Mode" description="Experience interactive stories set in Nigeria's vibrant cities." /><StoryMode /></>} />
            <Route path="/rewards" element={<><SEO {...SEO_PAGES.rewards} /><Rewards session={session} profile={profile} /></>} />
            <Route path="/discovery" element={<><SEO {...SEO_PAGES.discovery} /><Discovery /></>} />
            <Route path="/deals" element={<><SEO {...SEO_PAGES.deals} /><DealsPage /></>} />
            <Route path="/pass/create" element={<><SEO title="Create Event" description="Create and publish your event on Wanda Pass." /><CreateEvent /></>} />
            <Route path="/pass/:slug/ticket" element={<><SEO title="Event Ticket" description="Your Wanda Pass event ticket." /><EventPass /></>} />
            <Route path="/pass/:slug" element={<><SEO title="Event Details" description="View event details, get tickets, and RSVP on Wanda." /><EventDetail /></>} />
            <Route path="/pass" element={<><SEO {...SEO_PAGES.pass} /><PassLanding /></>} />
            <Route path="/list-your-business" element={<><SEO {...SEO_PAGES.listBusiness} /><ListBusinessLanding /></>} />
            <Route path="/list-your-business/form" element={<><SEO title="Business Registration" description="Submit your business details to get listed on Wanda." /><ListBusiness /></>} />
            <Route path="/handymen" element={<><SEO {...SEO_PAGES.handymen} /><Handymen /></>} />
            <Route path="/business/:id" element={<><SEO title="Business" description="View business details, ratings, and contact info on Wanda." /><BusinessDetail /></>} />
            <Route path="/notifications" element={<><SEO title="Notifications" description="Your Wanda notifications." noIndex /><Notifications session={session} /></>} />
            <Route path="/auth" element={<><SEO {...SEO_PAGES.auth} /><Auth /></>} />
            <Route path="/flyer" element={<><SEO title="Share Wanda" description="Share Wanda with your friends." /><Flyer /></>} />
            <Route path="/admin" element={<><SEO {...SEO_PAGES.admin} /><AdminDashboard session={session} profile={profile} /></>} />
          </Routes>
          </Suspense>
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
