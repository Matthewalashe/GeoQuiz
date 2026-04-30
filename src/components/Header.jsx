import { Link, useLocation } from 'react-router-dom'
import { getXPData, getLevel, getLevelProgress, getLevelTitle } from '../engine/xp.js'

export default function Header() {
  const { pathname } = useLocation()
  const xp = getXPData()
  const level = getLevel(xp.totalXP)
  const progress = getLevelProgress(xp.totalXP)
  const title = getLevelTitle(level)

  return (
    <>
      {/* Desktop top header */}
      <header className="header">
        <Link to="/" className="header-logo">
          <span className="dot" />
          GeoQuiz
        </Link>

        {/* XP Level Badge */}
        <Link to="/dashboard" className="xp-badge" title={`${title.title} — ${xp.totalXP} XP`}>
          <span className="xp-level">{title.emoji} Lv.{level}</span>
          <div className="xp-bar-mini">
            <div className="xp-bar-fill" style={{ width: `${progress * 100}%` }} />
          </div>
        </Link>

        <nav className="header-nav desktop-nav">
          <Link to="/" className={pathname === '/' ? 'active' : ''}>Home</Link>
          <Link to="/play" className={pathname === '/play' ? 'active' : ''}>Play</Link>
          <Link to="/leaderboard" className={pathname === '/leaderboard' ? 'active' : ''}>Scores</Link>
          <Link to="/dashboard" className={pathname === '/dashboard' ? 'active' : ''}>Progress</Link>
          <Link to="/community" className={pathname === '/community' ? 'active' : ''}>Chat</Link>
          <Link to="/about" className={pathname === '/about' ? 'active' : ''}>About</Link>
        </nav>
      </header>

      {/* Mobile bottom tab bar */}
      <nav className="mobile-tab-bar">
        <Link to="/" className={`tab-item ${pathname === '/' ? 'active' : ''}`}>
          <span className="tab-icon">🏠</span>
          <span className="tab-label">Home</span>
        </Link>
        <Link to="/play" className={`tab-item ${pathname === '/play' ? 'active' : ''}`}>
          <span className="tab-icon">🎮</span>
          <span className="tab-label">Play</span>
        </Link>

        {/* Floating center button — Post */}
        <Link to="/community" className="tab-center-btn" aria-label="Community">
          <span className="tab-center-icon">✏️</span>
        </Link>

        <Link to="/leaderboard" className={`tab-item ${pathname === '/leaderboard' ? 'active' : ''}`}>
          <span className="tab-icon">🏆</span>
          <span className="tab-label">Scores</span>
        </Link>
        <Link to="/dashboard" className={`tab-item ${pathname === '/dashboard' ? 'active' : ''}`}>
          <span className="tab-icon">{title.emoji}</span>
          <span className="tab-label">Lv.{level}</span>
        </Link>
      </nav>
    </>
  )
}
