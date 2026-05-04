import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CATEGORIES, REGIONS, getFilteredQuestions, getQuestionsByRegion } from '../data/questions.js'

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
    icon: '🗺️',
    image: '/images/postcards/third-mainland-bridge.png',
    steps: [
      { emoji: '📍', title: 'Read the clue', desc: 'Each question describes a real Nigerian location.' },
      { emoji: '🗺️', title: 'Drop your pin', desc: 'Tap the map where you think it is.' },
      { emoji: '🏆', title: 'Score points', desc: 'Closer pin = higher score. 100 pts max!' },
    ],
    modes: ['daily', 'blitz', 'custom'],
  },
  {
    id: 'postcards',
    name: 'PostCards',
    tagline: 'Guess landmarks from photos',
    color: '#8b5cf6',
    icon: '📷',
    image: '/images/postcards/national-theatre.png',
    steps: [
      { emoji: '🖼️', title: 'See the postcard', desc: 'A photo of a Nigerian landmark appears.' },
      { emoji: '🅰️', title: 'Pick your answer', desc: 'Choose from 4 options — A, B, C or D.' },
      { emoji: '📖', title: 'Learn a fact', desc: 'Get a fun fact after every answer!' },
    ],
  },
  {
    id: 'puzzle',
    name: 'Puzzle',
    tagline: 'Rearrange the image',
    color: '#06b6d4',
    icon: '🧩',
    image: '/images/postcards/zuma-rock.png',
    steps: [
      { emoji: '👀', title: 'Memorize', desc: 'See the full image for 2.5 seconds.' },
      { emoji: '🔀', title: 'Swap tiles', desc: 'Tap two tiles to swap. Rearrange the 3×3 grid.' },
      { emoji: '⭐', title: 'Earn stars', desc: 'Fewer moves = more stars. 3★ under 10 moves!' },
    ],
  },
  {
    id: 'wordgame',
    name: 'Guess the Word',
    tagline: 'Unscramble & learn history',
    color: '#f59e0b',
    icon: '🔤',
    image: '/images/postcards/badagry.png',
    steps: [
      { emoji: '🔤', title: 'Read the clue', desc: 'A hint about a Nigerian place, person or event.' },
      { emoji: '🅰️', title: 'Tap letters', desc: 'Place scrambled letters in the right order.' },
      { emoji: '📚', title: 'Discover history', desc: 'Rich historical info + footnotes after each word!' },
    ],
  },
]

export default function CategorySelector() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselected = searchParams.get('cat')

  // View state: 'hub' | 'quiz-setup' | 'postcards-info' | 'puzzle-info' | 'wordgame-info'
  const [view, setView] = useState('hub')

  // Quiz config
  const [selectedCats, setSelectedCats] = useState(preselected ? [preselected] : [])
  const [difficulty, setDifficulty] = useState('all')
  const [questionCount, setQuestionCount] = useState(10)
  const [timer, setTimer] = useState(0)
  const [region, setRegion] = useState('lagos')

  const available = getQuestionsByRegion(region, selectedCats, difficulty)

  useEffect(() => {
    if (preselected && !selectedCats.includes(preselected)) setSelectedCats([preselected])
  }, [preselected])

  function toggleCat(id) { setSelectedCats(p => p.includes(id) ? p.filter(c => c !== id) : [...p, id]) }

  function startGame() {
    if (available.length < 5) { alert('Not enough questions.'); return }
    navigate('/game', { state: { categories: selectedCats, difficulty, count: Math.min(questionCount, available.length), timer, region } })
  }

  function startDaily() {
    const today = new Date().toISOString().slice(0, 10)
    const seed = today.split('-').reduce((a, b) => a * 31 + parseInt(b), 0)
    navigate('/game', { state: { categories: [], difficulty: 'all', count: 10, timer: 45, daily: true, seed } })
  }

  function startBlitz() {
    const pool = getQuestionsByRegion(region, [], 'all')
    navigate('/game', { state: { categories: [], difficulty: 'all', count: Math.min(30, pool.length), timer: 10, region, mode: 'blitz', totalTimer: 300 } })
  }

  function handleCardClick(gameId) {
    if (gameId === 'quiz') setView('quiz-setup')
    else setView(`${gameId}-info`)
  }

  // ══════════════════════════════════════════
  // INFO / INSTRUCTION SCREENS
  // ══════════════════════════════════════════
  if (view.endsWith('-info')) {
    const gameId = view.replace('-info', '')
    const game = GAMES.find(g => g.id === gameId)
    const route = `/${gameId}`
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

        <button className="gi-play-btn" style={{ background: game.color }} onClick={() => navigate(route)}>
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
            <span className="gi-qm-icon">📅</span>
            <div><strong>Daily Challenge</strong><br/><span>{todayStr} · 10Q · 45s</span></div>
          </button>
          <button className="gi-qm gi-qm-blitz" onClick={startBlitz}>
            <span className="gi-qm-icon">⚡</span>
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
  return (
    <section className="play-page">
      <div className="gh-header">
        <h1 className="gh-title">Choose Your Game</h1>
        <p className="gh-subtitle">4 ways to explore Nigeria</p>
      </div>

      <div className="gh-grid">
        {GAMES.map(game => (
          <button key={game.id} className="gh-card" onClick={() => handleCardClick(game.id)}>
            <div className="gh-card-img-wrap">
              <img src={game.image} alt={game.name} className="gh-card-img" loading="lazy" />
              <div className="gh-card-img-overlay" />
              <span className="gh-card-icon">{game.icon}</span>
            </div>
            <div className="gh-card-body">
              <h3 className="gh-card-name">{game.name}</h3>
              <p className="gh-card-tag">{game.tagline}</p>
              <div className="gh-card-steps">
                {game.steps.map((s, i) => (
                  <span key={i} className="gh-card-step">{s.emoji}</span>
                ))}
              </div>
            </div>
            <div className="gh-card-accent" style={{ background: game.color }} />
          </button>
        ))}
      </div>
    </section>
  )
}
