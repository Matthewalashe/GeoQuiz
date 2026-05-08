import { Link } from 'react-router-dom'
import { getXPData, getLevel, getLevelTitle, getLevelProgress } from '../engine/xp.js'

/**
 * PostGameLoop — Minimalist engagement card after game completion.
 * ONE primary action (replay) + ONE secondary (try something new).
 * No content dumps, no decision paralysis.
 */
export default function PostGameLoop({ gameType, onPlayAgain }) {
  const xp = getXPData()
  const level = getLevel(xp.totalXP)
  const title = getLevelTitle(level)
  const progress = getLevelProgress(xp.totalXP)
  const streak = xp.streakDays || 0
  const playerName = localStorage.getItem('geoquiz_player')

  // Pick ONE suggested game — always different from what was just played
  const alt = ALTS.find(g => g.type !== gameType) || ALTS[0]

  return (
    <div className="pgl-wrap">
      {/* XP progress — compact */}
      <div className="pgl-xp-bar">
        <span className="pgl-level">{title.emoji} Lv.{level} — {title.title}</span>
        <div className="pgl-bar-track">
          <div className="pgl-bar-fill" style={{ width: `${progress * 100}%` }} />
        </div>
      </div>

      {/* Streak — only if active */}
      {streak > 0 && (
        <div className="pgl-streak">
          🔥 <strong>{streak}-day streak</strong> — come back tomorrow to keep it alive
        </div>
      )}

      {/* Save prompt — only if truly anonymous */}
      {!playerName && (
        <Link to="/leaderboard" className="pgl-save">
          📊 Set a display name to appear on the leaderboard →
        </Link>
      )}

      {/* PRIMARY: Play Again */}
      {onPlayAgain && (
        <button className="pgl-replay" onClick={onPlayAgain}>
          Play again
        </button>
      )}

      {/* SECONDARY: One alternative */}
      <Link to={alt.path} className="pgl-alt">
        Try {alt.label} →
      </Link>
    </div>
  )
}

const ALTS = [
  { type: 'quiz', path: '/play', label: 'Map Quiz' },
  { type: 'crossword', path: '/crossword', label: 'Crossword' },
  { type: 'adventure', path: '/adventure', label: 'Adventure' },
  { type: 'coloring', path: '/coloring', label: 'Coloring' },
  { type: 'puzzle', path: '/puzzle', label: 'Puzzle' },
  { type: 'word', path: '/word', label: 'Word Game' },
  { type: 'trivia', path: '/trivia', label: 'Trivia' },
]
