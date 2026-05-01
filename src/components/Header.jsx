import { Link, useLocation } from 'react-router-dom'
import { getXPData, getLevel, getLevelProgress, getLevelTitle } from '../engine/xp.js'

import {
  HomeRegular,
  PlayCircleRegular,
  TrophyRegular,
  PersonRegular,
  ChatMultipleRegular,
  MapRegular,
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
          <MapRegular fontSize={22} style={{ color: 'var(--primary)' }} />
          GeoQuiz
        </Link>

        <nav className="header-nav desktop-nav">
          <Link to="/" className={pathname === '/' ? 'active' : ''}>Home</Link>
          <Link to="/play" className={pathname === '/play' ? 'active' : ''}>Play</Link>
          <Link to="/leaderboard" className={pathname === '/leaderboard' ? 'active' : ''}>Scores</Link>
          <Link to="/dashboard" className={pathname === '/dashboard' ? 'active' : ''}>Progress</Link>
          <Link to="/community" className={pathname === '/community' ? 'active' : ''}>Feed</Link>
          <Link to="/about" className={pathname === '/about' ? 'active' : ''}>About</Link>
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

      {/* Mobile bottom tab bar */}
      <nav className="mobile-tab-bar">
        <Link to="/" className={`tab-item ${pathname === '/' ? 'active' : ''}`}>
          <span className="tab-icon"><HomeRegular fontSize={22} /></span>
          <span className="tab-label">Home</span>
        </Link>
        <Link to="/play" className={`tab-item ${pathname === '/play' ? 'active' : ''}`}>
          <span className="tab-icon"><PlayCircleRegular fontSize={22} /></span>
          <span className="tab-label">Play</span>
        </Link>

        <Link to="/community" className="tab-center-btn" aria-label="Community">
          <span className="tab-center-icon"><ChatMultipleRegular fontSize={22} style={{ color: '#fff' }} /></span>
        </Link>

        <Link to="/leaderboard" className={`tab-item ${pathname === '/leaderboard' ? 'active' : ''}`}>
          <span className="tab-icon"><TrophyRegular fontSize={22} /></span>
          <span className="tab-label">Scores</span>
        </Link>
        <Link to="/dashboard" className={`tab-item ${pathname === '/dashboard' ? 'active' : ''}`}>
          <span className="tab-icon"><PersonRegular fontSize={22} /></span>
          <span className="tab-label">Lv.{level}</span>
        </Link>
      </nav>
    </>
  )
}
