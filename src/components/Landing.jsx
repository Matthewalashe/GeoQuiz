import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getXPData, getLevel, getLevelTitle, canClaimToday } from '../engine/xp.js'
import { ChevronRightRegular } from '@fluentui/react-icons'

// Daily challenge — rotates content every day
const DAILY = [
  { title: 'Pin 5 Lagos landmarks', mode: 'daily', icon: '📍' },
  { title: 'Nigerian History Quiz', mode: 'daily', icon: '📜' },
  { title: 'Guess the Street Food', mode: 'daily', icon: '🍲' },
]

// Core games — shown as primary options
const GAMES = [
  { id: 'quiz', name: 'Map Quiz', desc: 'Pin locations on the map', icon: '🗺️', path: '/play', accent: 'var(--green)' },
  { id: 'trivia', name: 'Trivia', desc: 'Quick-fire questions', icon: '🧠', path: '/trivia', accent: 'var(--secondary)' },
  { id: 'crossword', name: 'Crossword', desc: 'Nigerian word puzzles', icon: '✏️', path: '/crossword', accent: 'var(--tertiary)' },
]

// More games — shown in a compact row
const MORE = [
  { name: 'Adventure', icon: '🎭', path: '/adventure' },
  { name: 'Coloring', icon: '🎨', path: '/coloring' },
  { name: 'Puzzle', icon: '🧩', path: '/puzzle' },
  { name: 'Word', icon: '🔤', path: '/word' },
]

export default function Landing() {
  const navigate = useNavigate()
  const xp = getXPData()
  const level = getLevel(xp.totalXP)
  const title = getLevelTitle(level)
  const streak = xp.streakDays || 0
  const playerName = localStorage.getItem('geoquiz_player') || 'Explorer'
  const avatar = localStorage.getItem('geoquiz_avatar') || '🦅'

  // Last played game
  const lastGame = localStorage.getItem('geoquiz_last_game') || 'quiz'
  const lastInfo = [...GAMES, ...MORE.map(m => ({ ...m, id: m.name.toLowerCase() }))].find(g => g.id === lastGame || g.path === `/${lastGame}`)

  // Daily challenge — pick one based on day of year
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000)
  const daily = DAILY[dayOfYear % DAILY.length]

  return (
    <section className="home-page">
      {/* Greeting */}
      <div className="home-greeting">
        <div className="home-avatar">{avatar}</div>
        <div>
          <h2 className="home-hello">Hey, {playerName}</h2>
          <span className="home-level">{title.emoji} Level {level} · {title.title}</span>
        </div>
        {streak > 0 && <span className="home-streak">🔥 {streak}</span>}
      </div>

      {/* Daily Challenge — big, tappable, urgent */}
      <button className="home-daily" onClick={() => navigate('/play?mode=daily')}>
        <div className="home-daily-left">
          <span className="home-daily-badge">DAILY</span>
          <strong>{daily.title}</strong>
          <span className="home-daily-sub">New challenge every day</span>
        </div>
        <span className="home-daily-icon">{daily.icon}</span>
      </button>

      {/* Daily reward banner */}
      {canClaimToday() && (
        <Link to="/rewards" className="home-reward">
          🎁 <span>Your daily reward is ready!</span> <span className="home-reward-go">Claim →</span>
        </Link>
      )}

      {/* Continue playing — show last game */}
      {lastInfo && (
        <Link to={lastInfo.path || `/play`} className="home-continue">
          <span className="home-continue-label">Continue playing</span>
          <div className="home-continue-row">
            <span className="home-continue-icon">{lastInfo.icon || '🗺️'}</span>
            <strong>{lastInfo.name || 'Map Quiz'}</strong>
            <ChevronRightRegular fontSize={18} />
          </div>
        </Link>
      )}

      {/* Primary games */}
      <h3 className="home-section-label">Play</h3>
      <div className="home-game-grid">
        {GAMES.map(g => (
          <Link key={g.id} to={g.path} className="home-game-card" style={{ '--ga': g.accent }}>
            <span className="home-game-icon">{g.icon}</span>
            <strong>{g.name}</strong>
            <span className="home-game-desc">{g.desc}</span>
          </Link>
        ))}
      </div>

      {/* More games — compact chips */}
      <h3 className="home-section-label">More games</h3>
      <div className="home-more-row">
        {MORE.map(g => (
          <Link key={g.name} to={g.path} className="home-more-chip">
            <span>{g.icon}</span> {g.name}
          </Link>
        ))}
      </div>

      {/* Explore teaser */}
      <Link to="/discovery" className="home-explore-teaser">
        <div>
          <strong>Explore Lagos</strong>
          <span>Restaurants, parks, nightlife & more</span>
        </div>
        <ChevronRightRegular fontSize={18} />
      </Link>
    </section>
  )
}
