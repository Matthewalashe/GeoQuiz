import { Link } from 'react-router-dom'
import questions from '../data/questions.js'
import ABUJA_Q from '../data/questions-abuja.js'
import { SPONSORS } from '../data/sponsors.js'
import { SponsorCard } from './SponsoredBanner.jsx'
import { getXPData, getLevel, getLevelTitle } from '../engine/xp.js'

export default function Landing() {
  const totalQ = questions.length + ABUJA_Q.length
  const xp = getXPData()
  const level = getLevel(xp.totalXP)
  const title = getLevelTitle(level)
  const playerName = localStorage.getItem('geoquiz_player') || ''

  return (
    <section className="landing">
      {/* Hero — compact, punchy */}
      <div className="landing-hero">
        <div className="geo-deco">
          <div className="geo-square" />
          <div className="geo-circle" />
          <div className="geo-tri" />
        </div>

        <h1>
          <span className="hero-sub">How well do you know</span>
          <span className="hero-main">Nigeria<span className="accent">?</span></span>
        </h1>
        <p className="hero-desc">
          Drop pins on the map. {totalQ}+ questions across Lagos & Abuja.
        </p>

        <div className="hero-actions">
          <Link to="/play" className="btn btn-primary btn-lg">
            Start Quiz →
          </Link>
          {playerName && (
            <Link to="/dashboard" className="btn btn-outline btn-lg">
              {title.emoji} Lv.{level}
            </Link>
          )}
        </div>
      </div>

      {/* Quick play cards */}
      <div className="quick-play">
        <Link to="/play?mode=quick" className="qp-card">
          <div className="qp-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
          </div>
          <div className="qp-info">
            <div className="qp-title">Quick Play</div>
            <div className="qp-desc">10 random questions</div>
          </div>
        </Link>
        <Link to="/play" className="qp-card">
          <div className="qp-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
          <div className="qp-info">
            <div className="qp-title">Custom Game</div>
            <div className="qp-desc">Pick categories & difficulty</div>
          </div>
        </Link>
        <Link to="/community" className="qp-card">
          <div className="qp-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <div className="qp-info">
            <div className="qp-title">Community</div>
            <div className="qp-desc">Chat with explorers</div>
          </div>
        </Link>
      </div>

      {/* Sponsored Discoveries */}
      <div className="landing-sponsors">
        <h3 style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Discover</h3>
        <div className="landing-sponsor-grid">
          {SPONSORS.filter(s => s.active).slice(0, 3).map(s => (
            <SponsorCard key={s.id} sponsor={s} />
          ))}
        </div>
        <p style={{ textAlign: 'center', fontSize: '0.6rem', color: 'var(--text-secondary)', marginTop: '0.4rem' }}>Sponsored</p>
      </div>
    </section>
  )
}
