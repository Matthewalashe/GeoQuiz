import { Link, useLocation } from 'react-router-dom'
import { getXPData, getLevel, getLevelProgress, getLevelTitle } from '../engine/xp.js'

// Flat outline SVG icons (inline, 20x20)
const icons = {
  home: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  play: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>,
  trophy: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>,
  user: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  pen: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
}

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
          <span className="tab-icon">{icons.home}</span>
          <span className="tab-label">Home</span>
        </Link>
        <Link to="/play" className={`tab-item ${pathname === '/play' ? 'active' : ''}`}>
          <span className="tab-icon">{icons.play}</span>
          <span className="tab-label">Play</span>
        </Link>

        <Link to="/community" className="tab-center-btn" aria-label="Community">
          <span className="tab-center-icon">{icons.pen}</span>
        </Link>

        <Link to="/leaderboard" className={`tab-item ${pathname === '/leaderboard' ? 'active' : ''}`}>
          <span className="tab-icon">{icons.trophy}</span>
          <span className="tab-label">Scores</span>
        </Link>
        <Link to="/dashboard" className={`tab-item ${pathname === '/dashboard' ? 'active' : ''}`}>
          <span className="tab-icon">{icons.user}</span>
          <span className="tab-label">Lv.{level}</span>
        </Link>
      </nav>
    </>
  )
}
