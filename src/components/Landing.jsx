import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import questions from '../data/questions.js'
import ABUJA_Q from '../data/questions-abuja.js'
import { SPONSORS } from '../data/sponsors.js'
import { SponsorCard } from './SponsoredBanner.jsx'
import { getXPData, getLevel, getLevelTitle, canClaimToday, getCurrentLeague } from '../engine/xp.js'

import {
  CalendarRegular,
  LocationRegular,
  PlayCircleRegular,
  ChevronRightRegular,
  ArrowRightRegular
} from '@fluentui/react-icons'

// Real Lagos events — May 2026
const EVENTS = [
  {
    id: 1,
    title: 'Lagos Acoustic Experience',
    date: 'May 29, 2026',
    venue: 'Federal Palace Hotel & Casino',
    tag: 'LIVE MUSIC',
    img: '/images/events/event-hero.png',
  },
  {
    id: 2,
    title: 'African Business & Leadership Summit',
    date: 'May 12, 2026',
    venue: 'Harbour Point, Lagos',
    tag: 'CONFERENCE',
    img: '/images/explore/culture.png',
  },
  {
    id: 3,
    title: 'West Africa Automotive Show',
    date: 'May 12, 2026',
    venue: 'Landmark Centre, VI',
    tag: 'EXHIBITION',
    img: '/images/explore/shopping.png',
  },
  {
    id: 4,
    title: 'Lagos Real Estate Fest 2026',
    date: 'May 26, 2026',
    venue: 'Lagos Oriental Hotel',
    tag: 'EXPO',
    img: '/images/explore/hotels.png',
  },
]

const EXPLORE_CATEGORIES = [
  { label: 'Restaurant & Bar', sub: 'Food & Dining', img: '/images/explore/restaurant.png' },
  { label: 'Parks & Recreation', sub: 'Nature & Fun', img: '/images/explore/parks.png' },
  { label: 'Nightlife & Lifestyle', sub: 'Entertainment', img: '/images/explore/nightlife.png' },
  { label: 'Hotels & Travels', sub: 'Stay & Explore', img: '/images/explore/hotels.png' },
  { label: 'Shops & Malls', sub: 'Shopping', img: '/images/explore/shopping.png' },
  { label: 'Culture & Finance', sub: 'Heritage & Money', img: '/images/explore/culture.png' },
]

export default function Landing() {
  const totalQ = questions.length + ABUJA_Q.length
  const [eventIdx, setEventIdx] = useState(0)

  // Auto-rotate hero
  useEffect(() => {
    const timer = setInterval(() => {
      setEventIdx(prev => (prev + 1) % EVENTS.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [])

  const ev = EVENTS[eventIdx]

  return (
    <section className="landing netflix-landing">
      {/* ═══ NETFLIX-STYLE HERO ═══ */}
      <div className="nf-hero">
        <div className="nf-hero-bg">
          <img src={ev.img} alt={ev.title} key={ev.id} />
          <div className="nf-hero-gradient" />
        </div>

        <div className="nf-hero-content">
          <span className="nf-hero-tag">{ev.tag}</span>
          <h1 className="nf-hero-title">{ev.title}</h1>
          <div className="nf-hero-meta">
            <span><CalendarRegular fontSize={14} /> {ev.date}</span>
            <span><LocationRegular fontSize={14} /> {ev.venue}</span>
          </div>
          <div className="nf-hero-actions">
            <Link to="/play" className="nf-hero-btn nf-btn-play">
              <PlayCircleRegular fontSize={20} /> Start Quiz
            </Link>
            <Link to="/play" className="nf-hero-btn nf-btn-explore">
              Explore <ArrowRightRegular fontSize={16} />
            </Link>
          </div>
        </div>

        {/* Indicator dots */}
        <div className="nf-hero-dots">
          {EVENTS.map((_, i) => (
            <button
              key={i}
              className={`nf-dot ${i === eventIdx ? 'active' : ''}`}
              onClick={() => setEventIdx(i)}
            />
          ))}
        </div>
      </div>

      {/* Daily Reward Banner */}
      {canClaimToday() && (
        <Link to="/rewards" className="rw-home-banner">
          <span className="rw-hb-icon">🎁</span>
          <span className="rw-hb-text">Claim your daily reward!</span>
          <span className="rw-hb-arrow">→</span>
        </Link>
      )}

      {/* Adire Strip */}
      <div className="adire-strip" />

      {/* Sponsored Discoveries */}
      <div className="landing-sponsors">
        <h3 className="section-label-home">Discover</h3>
        <div className="landing-sponsor-grid">
          {SPONSORS.filter(s => s.active).slice(0, 3).map(s => (
            <SponsorCard key={s.id} sponsor={s} />
          ))}
        </div>
        <p className="sponsored-tag">Sponsored</p>
      </div>

      {/* ═══ EXPLORE — Clean Photo Cards ═══ */}
      <div className="discover-section">
        <div className="discover-header">
          <h3 className="discover-title">Explore the City</h3>
          <span className="discover-see-all">See all <ChevronRightRegular fontSize={14} /></span>
        </div>
        <div className="discover-grid">
          {EXPLORE_CATEGORIES.map(d => (
            <div key={d.label} className="explore-card">
              <div className="explore-card-img">
                <img src={d.img} alt={d.label} loading="lazy" />
              </div>
              <div className="explore-card-body">
                <h4 className="explore-card-title">{d.label}</h4>
                <p className="explore-card-sub">{d.sub}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="discover-hint">Coming soon — explore and discover places near you</p>
      </div>
    </section>
  )
}
