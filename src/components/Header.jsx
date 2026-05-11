import { Link, useLocation } from 'react-router-dom'
import { getXPData, getLevel, getLevelProgress, getLevelTitle, canClaimToday } from '../engine/xp.js'

import {
  HomeRegular,
  CompassNorthwestRegular,
  PlayCircleRegular,
  TicketDiagonalRegular,
  PersonRegular,
  WeatherSunnyRegular,
  WeatherMoonRegular
} from '@fluentui/react-icons'

export default function Header({ theme, toggleTheme }) {
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
          <span className="ff-wordmark">wanda</span>
        </Link>

        <nav className="header-nav desktop-nav">
          <Link to="/" className={pathname === '/' ? 'active' : ''}>Home</Link>
          <Link to="/explore" className={pathname.startsWith('/explore') ? 'active' : ''}>Explore</Link>
          <Link to="/play" className={pathname === '/play' ? 'active' : ''}>Games</Link>
          <Link to="/pass" className={pathname === '/pass' ? 'active' : ''}>Pass</Link>
          <Link to="/leaderboard" className={pathname === '/leaderboard' ? 'active' : ''}>Scores</Link>
          <Link to="/community" className={pathname === '/community' ? 'active' : ''}>Feed</Link>
          <Link to="/list-your-business" className={pathname === '/list-your-business' ? 'active' : ''}>List Business</Link>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle dark mode" title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}>
            {theme === 'dark' ? <WeatherSunnyRegular fontSize={20} /> : <WeatherMoonRegular fontSize={20} />}
          </button>
          <Link to="/dashboard" className="xp-badge" title={`${title.title} — ${xp.totalXP} XP`}>
            <span className="xp-level">{title.emoji} Lv.{level}</span>
            <div className="xp-bar-mini">
              <div className="xp-bar-fill" style={{ width: `${progress * 100}%` }} />
            </div>
          </Link>
        </div>
      </header>

      {/* Mobile bottom tab bar — 5 tabs */}
      <nav className="mobile-tab-bar">
        <Link to="/" className={`tab-item ${pathname === '/' ? 'active' : ''}`}>
          <span className="tab-icon"><HomeRegular fontSize={22} /></span>
          <span className="tab-label">Home</span>
        </Link>
        <Link to="/explore" className={`tab-item ${pathname.startsWith('/explore') ? 'active' : ''}`}>
          <span className="tab-icon"><CompassNorthwestRegular fontSize={22} /></span>
          <span className="tab-label">Explore</span>
        </Link>

        <Link to="/play" className="tab-center-btn" aria-label="Games">
          <span className="tab-center-icon">
            <PlayCircleRegular fontSize={22} style={{ color: '#fff' }} />
          </span>
        </Link>

        <Link to="/pass" className={`tab-item ${pathname === '/pass' ? 'active' : ''}`}>
          <span className="tab-icon"><TicketDiagonalRegular fontSize={22} /></span>
          <span className="tab-label">Pass</span>
        </Link>
        <Link to="/dashboard" className={`tab-item ${pathname === '/dashboard' ? 'active' : ''}`}>
          <span className="tab-icon"><PersonRegular fontSize={22} /></span>
          <span className="tab-label">Lv.{level}</span>
        </Link>
      </nav>
    </>
  )
}
