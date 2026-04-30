import { Link, useLocation } from 'react-router-dom'
import { getXPData, getLevel, getLevelProgress, getLevelTitle } from '../engine/xp.js'

export default function Header() {
  const { pathname } = useLocation()
  const xp = getXPData()
  const level = getLevel(xp.totalXP)
  const progress = getLevelProgress(xp.totalXP)
  const title = getLevelTitle(level)

  return (
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

      <nav className="header-nav">
        <Link to="/" className={pathname === '/' ? 'active' : ''}>Home</Link>
        <Link to="/play" className={pathname === '/play' ? 'active' : ''}>Play</Link>
        <Link to="/leaderboard" className={pathname === '/leaderboard' ? 'active' : ''}>Scores</Link>
        <Link to="/dashboard" className={pathname === '/dashboard' ? 'active' : ''}>Progress</Link>
        <Link to="/community" className={pathname === '/community' ? 'active' : ''}>Chat</Link>
        <Link to="/about" className={pathname === '/about' ? 'active' : ''}>About</Link>
      </nav>
    </header>
  )
}
