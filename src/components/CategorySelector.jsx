import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import LevelSelect from './LevelSelect.jsx'
import { CATEGORIES, REGIONS, getQuestionsByRegion } from '../data/questions.js'
import {
  regenerateLives, getWallet, getStreak, getGameProgress,
  getGames, getCoinValue, loadGameConfig, buyLives,
  processDailyLogin, getUserRank
} from '../lib/gameService.js'
import {
  MapRegular, CameraRegular, TextFontRegular,
  BrainCircuitRegular, BookRegular, LocationRegular, TrophyRegular,
  ImageRegular, TextFirstLineRegular, BookOpenRegular,
  TimerRegular, QuestionCircleRegular,
  CalendarLtrRegular, FlashRegular, HeartPulseRegular,
  TargetRegular, FlagRegular
} from '@fluentui/react-icons'

const QUESTION_COUNTS = [10, 15, 20, 25, 30]
const DIFFICULTIES = [
  { id: 'all', label: 'All Levels', color: '#888' },
  { id: 'beginner', label: 'Beginner', color: '#22c55e' },
  { id: 'intermediate', label: 'Medium', color: '#f59e0b' },
  { id: 'expert', label: 'Expert', color: '#ef4444' },
]
const TIMER_OPTIONS = [
  { id: 0, label: 'Off' },
  { id: 30, label: '30s' },
  { id: 45, label: '45s' },
  { id: 60, label: '60s' },
  { id: 90, label: '90s' },
]

// ── GAME DEFINITIONS ──
const GAMES = [
  {
    id: 'quiz',
    name: 'Map Quiz',
    tagline: 'Pin the location on the map',
    color: '#00c853',
    icon: <MapRegular />,
    image: '/images/postcards/third-mainland-bridge.png',
    status: 'live',
    difficulty: 'medium',
    engineSlug: 'map_quiz',
    steps: [
      { emoji: <LocationRegular />, title: 'Read the clue', desc: 'Each question describes a real Nigerian location.' },
      { emoji: <MapRegular />, title: 'Drop your pin', desc: 'Tap the map where you think it is.' },
      { emoji: <TrophyRegular />, title: 'Score points', desc: 'Closer pin = higher score. 100 pts max!' },
    ],
    modes: ['daily', 'blitz', 'custom'],
  },
  {
    id: 'postcards',
    name: 'PostCards',
    tagline: 'Guess landmarks from photos',
    color: '#8b5cf6',
    icon: <CameraRegular />,
    image: '/images/postcards/national-theatre.png',
    status: 'live',
    difficulty: 'easy',
    engineSlug: 'postcards',
    steps: [
      { emoji: <ImageRegular />, title: 'See the postcard', desc: 'A photo of a Nigerian landmark appears.' },
      { emoji: <TextFontRegular />, title: 'Pick your answer', desc: 'Choose from 4 options — A, B, C or D.' },
      { emoji: <BookOpenRegular />, title: 'Learn a fact', desc: 'Get a fun fact after every answer!' },
    ],
  },
  {
    id: 'wordgame',
    name: 'Guess the Word',
    tagline: 'Unscramble & learn history',
    color: '#f59e0b',
    icon: <TextFontRegular />,
    image: '/images/postcards/badagry.png',
    status: 'live',
    difficulty: 'medium',
    engineSlug: 'guessword',
    steps: [
      { emoji: <TextFontRegular />, title: 'Read the clue', desc: 'A hint about a Nigerian place, person or event.' },
      { emoji: <TextFirstLineRegular />, title: 'Tap letters', desc: 'Place scrambled letters in the right order.' },
      { emoji: <BookRegular />, title: 'Discover history', desc: 'Rich historical info + footnotes after each word!' },
    ],
  },
  {
    id: 'trivia',
    name: 'Trivia',
    tagline: 'Test your Nigerian knowledge',
    color: '#0ea5e9',
    icon: <BrainCircuitRegular />,
    image: '/images/postcards/egungun-festival.png',
    status: 'live',
    difficulty: 'medium',
    engineSlug: 'trivia',
    steps: [
      { emoji: <TimerRegular />, title: 'Beat the clock', desc: 'Answer questions before the timer runs out.' },
      { emoji: <QuestionCircleRegular />, title: 'Multiple choice', desc: 'Select the correct answer from 4 options.' },
      { emoji: <TrophyRegular />, title: 'Score high', desc: 'Earn points and climb the leaderboard!' },
    ],
  },
  {
    id: 'pinpoint',
    name: 'PinPoint',
    tagline: 'Drop a pin, score by distance',
    color: '#ef4444',
    icon: <TargetRegular />,
    image: '/images/postcards/zuma-rock.png',
    status: 'live',
    difficulty: 'hard',
    engineSlug: 'pinpoint',
    steps: [
      { emoji: <TargetRegular />, title: 'See the target', desc: 'A place name appears — no clues, just instinct.' },
      { emoji: <MapRegular />, title: 'Drop your pin', desc: 'Tap anywhere on the map. Closer = more points.' },
      { emoji: <TrophyRegular />, title: 'Share your card', desc: 'Get a shareable score card after each round.' },
    ],
  },
  {
    id: 'flagstack',
    name: 'FlagStack',
    tagline: 'Catch the falling flags',
    color: '#eab308',
    icon: <FlagRegular />,
    image: '/images/postcards/makoko.png',
    status: 'live',
    difficulty: 'easy',
    engineSlug: 'flagstack',
    steps: [
      { emoji: <FlagRegular />, title: 'Flags fall', desc: 'Country flags fall from the top of the screen.' },
      { emoji: <TargetRegular />, title: 'Tap the right one', desc: 'Tap the correct flag before it reaches the bottom.' },
      { emoji: <FlashRegular />, title: 'Speed up', desc: 'Flags get faster as you progress. 3 strikes = game over!' },
    ],
  },
]


// ═══════════════════════════════════════════
// LIVES DISPLAY — hearts row + regen timer
// ═══════════════════════════════════════════
function LivesBar({ lives, maxLives, secondsUntilNext, onBuyLives, buying }) {
  const [countdown, setCountdown] = useState(secondsUntilNext || 0)

  useEffect(() => {
    setCountdown(secondsUntilNext || 0)
  }, [secondsUntilNext])

  useEffect(() => {
    if (countdown <= 0 || lives >= maxLives) return
    const t = setInterval(() => setCountdown(c => {
      if (c <= 1) { clearInterval(t); return 0 }
      return c - 1
    }), 1000)
    return () => clearInterval(t)
  }, [countdown, lives, maxLives])

  const mm = String(Math.floor(countdown / 60)).padStart(2, '0')
  const ss = String(countdown % 60).padStart(2, '0')

  return (
    <div className="gj-lives-bar">
      <div className="gj-hearts">
        {Array.from({ length: maxLives }).map((_, i) => (
          <span key={i} className={`gj-heart ${i < lives ? 'filled' : 'empty'}`}>
            {i < lives ? '❤️' : '🤍'}
          </span>
        ))}
      </div>
      <div className="gj-lives-info">
        <span className="gj-lives-count">{lives}/{maxLives}</span>
        {lives < maxLives && countdown > 0 && (
          <span className="gj-lives-timer">
            <HeartPulseRegular fontSize={14} /> {mm}:{ss}
          </span>
        )}
        {lives < maxLives && (
          <button className="gj-buy-lives" onClick={onBuyLives} disabled={buying}>
            {buying ? '...' : `🪙 Buy (${getCoinValue('purchase_lives_cost', 20)})`}
          </button>
        )}
      </div>
    </div>
  )
}


// ═══════════════════════════════════════════
// OUT OF LIVES MODAL
// ═══════════════════════════════════════════
function OutOfLivesModal({ secondsUntilNext, coins, onBuyLives, buying, onClose }) {
  const [countdown, setCountdown] = useState(secondsUntilNext || 0)
  const cost = getCoinValue('purchase_lives_cost', 20)
  const canAfford = coins >= cost

  useEffect(() => {
    setCountdown(secondsUntilNext || 0)
  }, [secondsUntilNext])

  useEffect(() => {
    if (countdown <= 0) return
    const t = setInterval(() => setCountdown(c => c <= 1 ? 0 : c - 1), 1000)
    return () => clearInterval(t)
  }, [countdown])

  const mm = String(Math.floor(countdown / 60)).padStart(2, '0')
  const ss = String(countdown % 60).padStart(2, '0')

  return (
    <div className="gj-modal-overlay" onClick={onClose}>
      <div className="gj-modal" onClick={e => e.stopPropagation()}>
        <div className="gj-modal-hearts">
          {'🤍 🤍 🤍 🤍 🤍'}
        </div>
        <h2 className="gj-modal-title">Out of Lives!</h2>
        <p className="gj-modal-desc">
          You've used all your lives. Wait for them to regenerate or use coins to refill instantly.
        </p>

        {countdown > 0 && (
          <div className="gj-modal-timer">
            <span className="gj-modal-timer-label">Next life in</span>
            <span className="gj-modal-timer-value">{mm}:{ss}</span>
          </div>
        )}

        <div className="gj-modal-actions">
          <button
            className={`gj-modal-btn primary ${!canAfford ? 'disabled' : ''}`}
            onClick={onBuyLives}
            disabled={buying || !canAfford}
          >
            {buying ? 'Refilling...' : `🪙 Refill All Lives — ${cost} coins`}
          </button>
          {!canAfford && (
            <span className="gj-modal-hint">You have {coins} coins — need {cost}</span>
          )}

          <button className="gj-modal-btn secondary" disabled>
            📺 Watch an Ad (Coming Soon)
          </button>
        </div>

        <button className="gj-modal-close" onClick={onClose}>Back to Games</button>
      </div>
    </div>
  )
}


// ═══════════════════════════════════════════
// GAME JOURNEY — progress cards per game
// ═══════════════════════════════════════════
function GameJourney({ progress, games }) {
  if (!progress || progress.length === 0) return null

  return (
    <div className="gj-progress-grid">
      {progress.map(p => {
        const game = games.find(g => g.engineSlug === p.game_type) || GAMES.find(g => g.engineSlug === p.game_type)
        const pct = Math.min(100, Math.round((p.highest_level_reached / 50) * 100))
        return (
          <div key={p.game_type} className="gj-progress-card">
            <div className="gj-prog-icon" style={{ color: game?.color || '#888' }}>
              {game?.icon || '🎮'}
            </div>
            <div className="gj-prog-info">
              <span className="gj-prog-name">{game?.name || p.game_type}</span>
              <div className="gj-prog-bar-track">
                <div className="gj-prog-bar-fill" style={{ width: `${pct}%`, background: game?.color || '#888' }} />
              </div>
              <span className="gj-prog-detail">
                Level {p.highest_level_reached} · {p.total_coins_earned_here} 🪙
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}


// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════
export default function CategorySelector({ session }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselected = searchParams.get('cat')

  // View state: 'hub' | 'quiz-setup' | 'postcards-info' | etc.
  const [view, setView] = useState('hub')

  // Quiz config
  const [selectedCats, setSelectedCats] = useState(preselected ? [preselected] : [])
  const [difficulty, setDifficulty] = useState('all')
  const [questionCount, setQuestionCount] = useState(10)
  const [timer, setTimer] = useState(0)
  const [region, setRegion] = useState('lagos')

  // Game engine state
  const [wallet, setWallet] = useState(null)
  const [livesData, setLivesData] = useState(null)
  const [streak, setStreak] = useState(null)
  const [progress, setProgress] = useState([])
  const [showOutOfLives, setShowOutOfLives] = useState(false)
  const [buyingLives, setBuyingLives] = useState(false)
  const [dailyResult, setDailyResult] = useState(null)
  const [userRank, setUserRank] = useState(null)

  const userId = session?.user?.id
  const available = getQuestionsByRegion(region, selectedCats, difficulty)

  // Load game data on mount
  const loadGameData = useCallback(async () => {
    if (!userId) return
    try {
      await loadGameConfig()
      const [w, l, s, p, dr] = await Promise.all([
        getWallet(userId),
        regenerateLives(userId),
        getStreak(userId),
        getGameProgress(userId),
        processDailyLogin(userId),
      ])
      setWallet(w)
      setLivesData(l)
      setStreak(s)
      setProgress(p)
      setDailyResult(dr)
      // If daily login awarded coins, refresh wallet
      if (dr?.daily_coins?.awarded) {
        const refreshed = await getWallet(userId)
        setWallet(refreshed)
      }
      // Fetch leaderboard rank
      try {
        const rank = await getUserRank(userId)
        setUserRank(rank)
      } catch {}
    } catch (e) {
      console.error('loadGameData:', e)
    }
  }, [userId])

  useEffect(() => { loadGameData() }, [loadGameData])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (preselected && !selectedCats.includes(preselected)) setSelectedCats([preselected])
  }, [preselected, selectedCats])
  /* eslint-enable react-hooks/set-state-in-effect */

  function toggleCat(id) { setSelectedCats(p => p.includes(id) ? p.filter(c => c !== id) : [...p, id]) }

  function handlePlayClick(gameId) {
    // Check lives before starting
    if (livesData && livesData.lives <= 0) {
      setShowOutOfLives(true)
      return
    }
    const game = GAMES.find(g => g.id === gameId)
    // Engine-enabled games go to level select
    if (game?.engineSlug && userId) {
      setView(`levels-${gameId}`)
    } else if (gameId === 'quiz') {
      setView('quiz-setup')
    } else {
      setView(`${gameId}-info`)
    }
  }

  async function handleBuyLives() {
    if (!userId) return
    setBuyingLives(true)
    try {
      const result = await buyLives(userId)
      if (result?.success) {
        setLivesData({ lives: result.lives, max_lives: livesData?.max_lives || 5, seconds_until_next: 0 })
        setWallet(w => w ? { ...w, coins: result.new_balance } : w)
        setShowOutOfLives(false)
      }
    } catch (e) { console.error('buyLives:', e) }
    setBuyingLives(false)
  }

  function startGame() {
    if (livesData && livesData.lives <= 0) { setShowOutOfLives(true); return }
    if (available.length < 5) { alert('Not enough questions.'); return }
    navigate('/game', { state: { categories: selectedCats, difficulty, count: Math.min(questionCount, available.length), timer, region } })
  }

  function startDaily() {
    if (livesData && livesData.lives <= 0) { setShowOutOfLives(true); return }
    const today = new Date().toISOString().slice(0, 10)
    const seed = today.split('-').reduce((a, b) => a * 31 + parseInt(b), 0)
    navigate('/game', { state: { categories: [], difficulty: 'all', count: 10, timer: 45, daily: true, seed } })
  }

  function startBlitz() {
    if (livesData && livesData.lives <= 0) { setShowOutOfLives(true); return }
    const pool = getQuestionsByRegion(region, [], 'all')
    navigate('/game', { state: { categories: [], difficulty: 'all', count: Math.min(30, pool.length), timer: 10, region, mode: 'blitz', totalTimer: 300 } })
  }

  function navigateToGame(gameId) {
    if (livesData && livesData.lives <= 0) { setShowOutOfLives(true); return }
    // Map Quiz needs the setup flow (pick categories, difficulty, etc.)
    if (gameId === 'quiz') { setView('quiz-setup'); return }
    navigate(`/${gameId}`)
  }

  // ══════════════════════════════════════════
  // LEVEL SELECT (engine-enabled games)
  // ══════════════════════════════════════════
  if (view.startsWith('levels-')) {
    const gameId = view.replace('levels-', '')
    const game = GAMES.find(g => g.id === gameId)
    if (!game) { setView('hub'); return null }
    return (
      <LevelSelect
        session={session}
        gameSlug={game.engineSlug}
        gameName={game.name}
        gameColor={game.color}
        gameIcon={game.icon}
        onStartLevel={(config) => {
          // Navigate to the game with level config
          navigate(`/${gameId}`, { state: { levelConfig: config } })
        }}
      />
    )
  }

  // ══════════════════════════════════════════
  // INFO / INSTRUCTION SCREENS
  // ══════════════════════════════════════════
  if (view.endsWith('-info')) {
    const gameId = view.replace('-info', '')
    const game = GAMES.find(g => g.id === gameId)
    return (
      <section className="play-page">
        <button className="gh-back" onClick={() => setView('hub')}>← All Games</button>
        <div className="gi-hero" style={{ borderColor: game.color }}>
          <img src={game.image} alt={game.name} className="gi-hero-img" />
          <div className="gi-hero-overlay">
            <span className="gi-hero-icon">{game.icon}</span>
            <h2 className="gi-hero-title">{game.name}</h2>
            <p className="gi-hero-tag">{game.tagline}</p>
          </div>
        </div>

        <h3 className="gi-section-title">How to Play</h3>
        <div className="gi-steps">
          {game.steps.map((s, i) => (
            <div key={i} className="gi-step">
              <div className="gi-step-num" style={{ background: game.color }}>{i + 1}</div>
              <div className="gi-step-body">
                <div className="gi-step-title">{s.emoji} {s.title}</div>
                <p className="gi-step-desc">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <button className="gi-play-btn" style={{ background: game.color }} onClick={() => navigateToGame(gameId)}>
          Play {game.name} →
        </button>
      </section>
    )
  }

  // ══════════════════════════════════════════
  // QUIZ SETUP (with Daily/Blitz/Custom)
  // ══════════════════════════════════════════
  if (view === 'quiz-setup') {
    const game = GAMES[0]
    const todayStr = new Date().toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric' })
    return (
      <section className="play-page">
        <button className="gh-back" onClick={() => setView('hub')}>← All Games</button>
        <div className="gi-hero" style={{ borderColor: game.color }}>
          <img src={game.image} alt={game.name} className="gi-hero-img" />
          <div className="gi-hero-overlay">
            <span className="gi-hero-icon">{game.icon}</span>
            <h2 className="gi-hero-title">{game.name}</h2>
            <p className="gi-hero-tag">{game.tagline}</p>
          </div>
        </div>

        <h3 className="gi-section-title">Quick Start</h3>
        <div className="gi-quick-modes">
          <button className="gi-qm" onClick={startDaily}>
            <span className="gi-qm-icon"><CalendarLtrRegular /></span>
            <div><strong>Daily Challenge</strong><br/><span>{todayStr} · 10Q · 45s</span></div>
          </button>
          <button className="gi-qm gi-qm-blitz" onClick={startBlitz}>
            <span className="gi-qm-icon"><FlashRegular /></span>
            <div><strong>Blitz Mode</strong><br/><span>30Q · 5 min race</span></div>
          </button>
        </div>

        <h3 className="gi-section-title">Custom Game</h3>
        <div className="play-builder">
          <div className="play-row">
            <span className="play-row-label">Region</span>
            <div className="play-chips">
              {REGIONS.map(r => (
                <button key={r.id} className={`play-chip ${region === r.id ? 'active' : ''}`} onClick={() => setRegion(r.id)}>
                  {r.icon} {r.label}
                </button>
              ))}
            </div>
          </div>
          <div className="play-row">
            <span className="play-row-label">Categories</span>
            <div className="play-chips play-chips-wrap">
              {CATEGORIES.map(cat => (
                <button key={cat.id} className={`play-chip play-chip-cat ${selectedCats.includes(cat.id) ? 'active' : ''}`} onClick={() => toggleCat(cat.id)}>
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
            <span className="play-row-hint">
              {selectedCats.length === 0 ? 'All categories' : `${selectedCats.length} selected`} · {available.length} questions
            </span>
          </div>
          <div className="play-row">
            <span className="play-row-label">Difficulty</span>
            <div className="play-chips">
              {DIFFICULTIES.map(d => (
                <button key={d.id} className={`play-chip ${difficulty === d.id ? 'active' : ''}`} onClick={() => setDifficulty(d.id)}
                  style={difficulty === d.id ? { borderColor: d.color, background: d.color, color: '#fff' } : {}}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <div className="play-row">
            <span className="play-row-label">Questions</span>
            <div className="play-chips">
              {QUESTION_COUNTS.map(n => (
                <button key={n} className={`play-chip ${questionCount === n ? 'active' : ''}`} onClick={() => setQuestionCount(n)}>{n}</button>
              ))}
            </div>
            {questionCount > available.length && <span className="play-row-warn">Only {available.length} available</span>}
          </div>
          <div className="play-row">
            <span className="play-row-label">Timer</span>
            <div className="play-chips">
              {TIMER_OPTIONS.map(t => (
                <button key={t.id} className={`play-chip ${timer === t.id ? 'active' : ''}`} onClick={() => setTimer(t.id)}>{t.label}</button>
              ))}
            </div>
          </div>
          <button className="play-start-btn" onClick={startGame}>
            <span>Start Quiz</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          </button>
        </div>
      </section>
    )
  }

  // ══════════════════════════════════════════
  // GAME HUB (default)
  // ══════════════════════════════════════════
  const lives = livesData?.lives ?? 5
  const maxLives = livesData?.max_lives ?? 5
  const secsNext = livesData?.seconds_until_next ?? 0

  return (
    <section className="play-page">
      {/* ── Game Journey Dashboard ── */}
      {userId && (
        <div className="gj-dashboard">
          {/* ── Unified Stats Bar (Glassmorphism) ── */}
          <div className="stats-bar glass">
            <Link to="/play" className="stats-bar-item" title="Lives">
              <span className="stats-bar-icon stats-bar-life">❤️</span>
              <span className="stats-bar-value">{lives}</span>
              <span className="stats-bar-label">Life</span>
            </Link>
            <div className="stats-bar-divider" />
            <Link to="/rewards" className="stats-bar-item" title="Open Store">
              <span className="stats-bar-icon stats-bar-coins">🪙</span>
              <span className="stats-bar-value">{wallet?.coins ?? 0}</span>
              <span className="stats-bar-label">Coins</span>
            </Link>
            <div className="stats-bar-divider" />
            <Link to="/dashboard" onClick={() => setTimeout(() => window.dispatchEvent(new CustomEvent('dashboard-tab', { detail: 'journey' })), 100)} className="stats-bar-item" title="Game Journey">
              <span className="stats-bar-icon stats-bar-streak">⚡</span>
              <span className="stats-bar-value">{streak?.current_streak ?? 0}</span>
              <span className="stats-bar-label">Streak</span>
            </Link>
            <div className="stats-bar-divider" />
            <div className="stats-bar-item" title="All-time XP">
              <span className="stats-bar-icon stats-bar-alltime">⭐</span>
              <span className="stats-bar-value">{wallet?.lifetime_coins ?? 0}</span>
              <span className="stats-bar-label">All-time</span>
            </div>
            <div className="stats-bar-divider" />
            <Link to="/leaderboard" className="stats-bar-item" title="Leaderboard">
              <span className="stats-bar-icon stats-bar-rank">🏆</span>
              <span className="stats-bar-value">{userRank ? `#${userRank}` : '—'}</span>
              <span className="stats-bar-label">Rank</span>
            </Link>
          </div>

          {/* Lives regen timer (only show when lives < max) */}
          {lives < maxLives && (
            <LivesBar
              lives={lives}
              maxLives={maxLives}
              secondsUntilNext={secsNext}
              onBuyLives={handleBuyLives}
              buying={buyingLives}
            />
          )}

          {/* Daily login celebration */}
          {dailyResult && !dailyResult.already_logged_in && dailyResult.daily_coins?.awarded && (
            <div className="gj-daily-toast">
              <span>🎉 Daily login! +{dailyResult.daily_coins.amount} coins</span>
              {dailyResult.milestone && (
                <span className="gj-daily-streak"> · 🔥 {dailyResult.milestone === '7_day' ? '7-day' : dailyResult.milestone === '30_day' ? '30-day' : '100-day'} streak bonus!</span>
              )}
            </div>
          )}

          {/* Game progress */}
          {progress.length > 0 && (
            <>
              <h3 className="gj-section-label">Your Progress</h3>
              <GameJourney progress={progress} games={GAMES} />
            </>
          )}
        </div>
      )}

      {/* ── Game Hub Header ── */}
      <div className="gh-header">
        <h1 className="gh-title">Choose Your Game</h1>
        <p className="gh-subtitle">{GAMES.length} ways to explore Nigeria</p>
      </div>

      {/* ── Game Cards Grid ── */}
      <div className="gh-grid">
        {GAMES.map(game => {
          const isComingSoon = game.status === 'coming_soon'
          const prog = progress.find(p => p.game_type === game.engineSlug)
          return (
            <button
              key={game.id}
              className={`gh-card ${isComingSoon ? 'game-card-coming-soon' : ''}`}
              onClick={() => !isComingSoon && handlePlayClick(game.id)}
              style={isComingSoon ? { cursor: 'default' } : {}}
            >
              {isComingSoon && (
                <div className="game-coming-soon-overlay">
                  <span className="cs-icon">{game.icon}</span>
                  <span>Coming Soon</span>
                </div>
              )}
              <div className="gh-card-img-wrap">
                <img src={game.image} alt={game.name} className="gh-card-img" loading="lazy" />
                <div className="gh-card-img-overlay" />
                <span className="gh-card-icon">{game.icon}</span>
                {game.difficulty && (
                  <span className={`gh-card-badge ${game.difficulty}`}>
                    {game.difficulty === 'easy' ? 'Beginner' : game.difficulty === 'medium' ? 'Intermediate' : 'Expert'}
                  </span>
                )}
              </div>
              <div className="gh-card-body">
                <h3 className="gh-card-name">{game.name}</h3>
                <p className="gh-card-tag">{game.tagline}</p>
                {/* Show level progress if user has played this game */}
                {prog ? (
                  <div className="gh-card-progress">
                    <div className="gh-card-prog-bar">
                      <div className="gh-card-prog-fill" style={{ width: `${Math.min(100, (prog.highest_level_reached / 50) * 100)}%`, background: game.color }} />
                    </div>
                    <span className="gh-card-prog-text">Lvl {prog.highest_level_reached} · {prog.total_coins_earned_here} 🪙</span>
                  </div>
                ) : (
                  <div className="gh-card-steps">
                    {game.steps.map((s, i) => (
                      <span key={i} className="gh-card-step">{s.emoji}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="gh-card-accent" style={{ background: game.color }} />
            </button>
          )
        })}
      </div>

      {/* ── Out of Lives Modal ── */}
      {showOutOfLives && (
        <OutOfLivesModal
          secondsUntilNext={secsNext}
          coins={wallet?.coins ?? 0}
          onBuyLives={handleBuyLives}
          buying={buyingLives}
          onClose={() => setShowOutOfLives(false)}
        />
      )}
    </section>
  )
}
