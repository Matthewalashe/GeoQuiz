import { Link } from 'react-router-dom'
import { getXPData, getLevel, getLevelTitle, getLevelProgress } from '../engine/xp.js'

/**
 * PostGameLoop — Engagement cards shown after every game completion.
 * Creates an infinite loop of activity by surfacing the next best action.
 */
export default function PostGameLoop({ gameType, onPlayAgain }) {
  const xp = getXPData()
  const level = getLevel(xp.totalXP)
  const title = getLevelTitle(level)
  const progress = getLevelProgress(xp.totalXP)
  const streak = xp.streakDays || 0
  const playerName = localStorage.getItem('geoquiz_player')

  // Rotate suggested games — exclude current
  const GAMES = [
    { path: '/play', icon: '🗺️', label: 'GeoQuiz', desc: 'Pin locations on the map', color: '#22c55e' },
    { path: '/crossword', icon: '📝', label: 'Crossword', desc: '20 Nigerian word puzzles', color: '#0ea5e9' },
    { path: '/adventure', icon: '🎭', label: 'Adventure', desc: '20 Lagos story quests', color: '#f97316' },
    { path: '/coloring', icon: '🎨', label: 'Coloring', desc: 'Color Lagos landmarks', color: '#a855f7' },
    { path: '/puzzle', icon: '🧩', label: 'Puzzle', desc: 'Reassemble landmark photos', color: '#ef4444' },
    { path: '/word', icon: '🔤', label: 'Word Game', desc: 'Unscramble Nigerian words', color: '#eab308' },
    { path: '/trivia', icon: '❓', label: 'Trivia', desc: 'Quick-fire questions', color: '#14b8a6' },
  ].filter(g => g.path !== `/${gameType}`)

  // Pick 3 random suggestions
  const suggestions = games3(GAMES)

  return (
    <div className="pgl-wrap">
      {/* XP & Level Bar */}
      <div className="pgl-xp-bar">
        <div className="pgl-xp-info">
          <span className="pgl-level">{title.emoji} Lv.{level}</span>
          <span className="pgl-title">{title.title}</span>
        </div>
        <div className="pgl-bar-track">
          <div className="pgl-bar-fill" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>

      {/* Streak */}
      {streak > 0 && (
        <div className="pgl-streak-card">
          <span className="pgl-streak-fire">🔥</span>
          <div>
            <strong>{streak}-Day Streak!</strong>
            <span className="pgl-streak-sub">Come back tomorrow to keep it alive</span>
          </div>
        </div>
      )}

      {/* Save score prompt if no name */}
      {!playerName && (
        <div className="pgl-save-prompt">
          <span>📊</span>
          <div>
            <strong>Save your scores!</strong>
            <span>Set a display name to appear on the leaderboard</span>
          </div>
          <Link to="/leaderboard" className="pgl-action-btn">Set Name →</Link>
        </div>
      )}

      {/* Play Again */}
      {onPlayAgain && (
        <button className="pgl-play-again" onClick={onPlayAgain}>
          🔄 Play Again
        </button>
      )}

      {/* Suggested Games */}
      <div className="pgl-section-title">🎮 Keep Playing</div>
      <div className="pgl-game-grid">
        {suggestions.map(g => (
          <Link key={g.path} to={g.path} className="pgl-game-card" style={{ '--gc': g.color }}>
            <span className="pgl-game-icon">{g.icon}</span>
            <div className="pgl-game-info">
              <strong>{g.label}</strong>
              <span>{g.desc}</span>
            </div>
            <span className="pgl-game-arrow">→</span>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="pgl-section-title">⚡ Quick Actions</div>
      <div className="pgl-quick-row">
        <Link to="/leaderboard" className="pgl-quick-btn">🏆 Leaderboard</Link>
        <Link to="/story" className="pgl-quick-btn">📖 Story Mode</Link>
        <Link to="/discover" className="pgl-quick-btn">📍 Discover</Link>
        <Link to="/deals" className="pgl-quick-btn">🎁 Deals</Link>
        <Link to="/achievements" className="pgl-quick-btn">🏅 Badges</Link>
        <Link to="/rewards" className="pgl-quick-btn">💎 Rewards</Link>
      </div>
    </div>
  )
}

function games3(arr) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 3)
}
