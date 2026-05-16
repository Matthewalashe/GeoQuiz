import { Link, useLocation } from 'react-router-dom'
import { getXPData, getLevel, getLevelProgress, getLevelTitle, canClaimToday } from '../engine/xp.js'

import {
  HomeRegular,
  CompassNorthwestRegular,
  PlayCircleRegular,
  TicketDiagonalRegular,
  PersonRegular,
  WeatherSunnyRegular,
  WeatherMoonRegular,
  SettingsRegular
} from '@fluentui/react-icons'

import { isAdmin } from '../lib/supabase.js'

export default function Header({ theme, toggleTheme, session, profile }) {
  const { pathname } = useLocation()
  const xp = getXPData()
  
  // Use profile data if logged in, otherwise fallback to local XP
  const displayXP = profile ? profile.total_xp : xp.totalXP
  const level = getLevel(displayXP)
  const progress = getLevelProgress(displayXP)
  const title = getLevelTitle(level)
  const admin = isAdmin(profile)

  return (
    <>
      {/* Desktop top header */}
      <header className="header">
        <Link to="/" className="header-logo">
          <img src="/wanda-logo.png" alt="Wanda" className="header-logo-img" />
        </Link>

        <nav className="header-nav desktop-nav">
          <Link to="/" className={pathname === '/' ? 'active' : ''}>Home</Link>
          <Link to="/explore" className={pathname.startsWith('/explore') ? 'active' : ''}>Explore</Link>
          <Link to="/play" className={pathname === '/play' ? 'active' : ''}>Games</Link>
          <Link to="/pass" className={pathname === '/pass' ? 'active' : ''}>Pass</Link>
          <Link to="/leaderboard" className={pathname === '/leaderboard' ? 'active' : ''}>Scores</Link>
          <Link to="/community" className={pathname === '/community' ? 'active' : ''}>Feed</Link>
          <Link to="/list-your-business" className={pathname === '/list-your-business' ? 'active' : ''}>List Business</Link>
          {admin && <Link to="/admin" className={pathname === '/admin' ? 'active' : ''} style={{ color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '0.2rem' }}><SettingsRegular fontSize={16} /> CMS</Link>}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle dark mode" title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}>
            {theme === 'dark' ? <WeatherSunnyRegular fontSize={20} /> : <WeatherMoonRegular fontSize={20} />}
          </button>
          {session ? (
            <Link to="/dashboard" className="xp-badge" title={`${title.title} — ${displayXP} XP`}>
              <span className="xp-level">{profile?.avatar_url || title.emoji} Lv.{level}</span>
              <div className="xp-bar-mini">
                <div className="xp-bar-fill" style={{ width: `${progress * 100}%` }} />
              </div>
            </Link>
          ) : (
            <Link to="/auth" className="xp-badge" title="Sign in" style={{ fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}>
              Sign In
            </Link>
          )}
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
        <Link to={session ? "/dashboard" : "/auth"} className={`tab-item ${pathname === '/dashboard' || pathname === '/auth' ? 'active' : ''}`}>
          <span className="tab-icon"><PersonRegular fontSize={22} /></span>
          <span className="tab-label">{session ? `Lv.${level}` : 'Login'}</span>
        </Link>
      </nav>
    </>
  )
}
