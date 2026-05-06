import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import questions from '../data/questions.js'
import ABUJA_Q from '../data/questions-abuja.js'
import { SPONSORS } from '../data/sponsors.js'
import { SponsorCard } from './SponsoredBanner.jsx'
import { getXPData, getLevel, getLevelTitle, canClaimToday, getCurrentLeague } from '../engine/xp.js'
import { getNotifPermission, requestNotifPermission } from '../engine/notifications.js'

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
  { label: 'Restaurant & Bar', sub: 'Food & Dining', img: '/images/explore/restaurant.png', id: 'food' },
  { label: 'Parks & Recreation', sub: 'Nature & Fun', img: '/images/explore/parks.png', id: 'parks' },
  { label: 'Nightlife & Lifestyle', sub: 'Entertainment', img: '/images/explore/nightlife.png', id: 'nightlife' },
  { label: 'Hotels & Travels', sub: 'Stay & Explore', img: '/images/explore/hotels.png', id: 'hotels' },
  { label: 'Shops & Malls', sub: 'Shopping', img: '/images/explore/shopping.png', id: 'shopping' },
  { label: 'Culture & Finance', sub: 'Heritage & Money', img: '/images/explore/culture.png', id: 'art' },
]

const SWIPE_CARDS = [
  { label: 'Places', link: '/discovery', img: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&q=80&w=600' },
  { label: 'Games', link: '/play', img: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=600' },
  { label: 'Museums', link: '/discovery?category=art', img: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&q=80&w=600' },
  { label: 'Map', link: '/discovery?view=map', img: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=600' },
]

export default function Landing() {
  const totalQ = questions.length + ABUJA_Q.length
  const [eventIdx, setEventIdx] = useState(0)
  const [showPushPrompt, setShowPushPrompt] = useState(() => getNotifPermission() === 'default')

  async function handleEnablePush() {
    const res = await requestNotifPermission()
    setShowPushPrompt(false)
    if (res === 'granted') {
      // Fire test native notification immediately
      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.ready
          reg.showNotification('🎉 Notifications Enabled!', {
            body: 'You will now receive updates on your streak, daily challenges, and rewards.',
            icon: '/icon-192.png',
            vibrate: [100, 50, 100]
          })
        } catch(e) {
          new Notification('🎉 Notifications Enabled!', { body: 'Updates are active.', icon: '/icon-192.png' })
        }
      } else if ('Notification' in window) {
        new Notification('🎉 Notifications Enabled!', { body: 'Updates are active.', icon: '/icon-192.png' })
      }
    }
  }

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
          {showPushPrompt && (
            <div className="nf-push-prompt">
              <div className="nf-push-text">
                <strong>Enable Notifications</strong>
                <p>Never miss a daily reward or let your streak freeze!</p>
              </div>
              <div className="nf-push-actions">
                <button className="btn btn-primary btn-sm" onClick={handleEnablePush}>Allow</button>
                <button className="btn btn-outline btn-sm" onClick={() => setShowPushPrompt(false)}>Later</button>
              </div>
            </div>
          )}
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

      {/* ═══ WHAT ARE YOU LOOKING FOR (Swipe Cards) ═══ */}
      <div className="swipe-section">
        <h3 className="swipe-title">What are you looking for?</h3>
        <div className="swipe-container">
          {SWIPE_CARDS.map(c => (
            <Link to={c.link} key={c.label} className="swipe-card">
              <img src={c.img} alt={c.label} loading="lazy" />
              <div className="swipe-card-gradient" />
              <h4 className="swipe-card-title">{c.label}</h4>
            </Link>
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

      {/* ═══ EXPLORE — Clean Photo Cards ═══ */}
      <div className="discover-section">
        <div className="discover-header">
          <h3 className="discover-title">Explore the City</h3>
          <Link to="/discovery" className="discover-see-all" style={{ textDecoration: 'none' }}>
            See all <ChevronRightRegular fontSize={14} />
          </Link>
        </div>
        <div className="discover-grid">
          {EXPLORE_CATEGORIES.map(d => (
            <Link to={`/discovery?category=${d.id}`} key={d.label} className="explore-card" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="explore-card-img">
                <img src={d.img} alt={d.label} loading="lazy" />
              </div>
              <div className="explore-card-body">
                <h4 className="explore-card-title">{d.label}</h4>
                <p className="explore-card-sub">{d.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
