import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import questions from '../data/questions.js'
import ABUJA_Q from '../data/questions-abuja.js'
import { SPONSORS } from '../data/sponsors.js'
import { SponsorCard } from './SponsoredBanner.jsx'
import { getXPData, getLevel, getLevelTitle } from '../engine/xp.js'

import {
  FoodPizzaRegular,
  LeafOneRegular,
  DrinkWineRegular,
  BuildingRegular,
  ShoppingBagRegular,
  BuildingBankRegular,
  ChevronLeftRegular,
  ChevronRightRegular,
  CalendarRegular,
  LocationRegular,
  CompassNorthwestRegular
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
    color: '#C8963E',
  },
  {
    id: 2,
    title: 'African Business & Leadership Summit',
    date: 'May 12, 2026',
    venue: 'Harbour Point, Lagos',
    tag: 'CONFERENCE',
    img: '/images/explore/culture.png',
    color: '#3D348B',
  },
  {
    id: 3,
    title: 'West Africa Automotive Show',
    date: 'May 12, 2026',
    venue: 'Landmark Centre, VI',
    tag: 'EXHIBITION',
    img: '/images/explore/shopping.png',
    color: '#E05A3A',
  },
  {
    id: 4,
    title: 'Lagos Real Estate Fest 2026',
    date: 'May 26, 2026',
    venue: 'Lagos Oriental Hotel',
    tag: 'EXPO',
    img: '/images/explore/hotels.png',
    color: '#008751',
  },
]

const EXPLORE_CATEGORIES = [
  { label: 'Restaurant & Bar', tag: 'FOOD & DINING', icon: <FoodPizzaRegular fontSize={22} />, img: '/images/explore/restaurant.png' },
  { label: 'Parks & Recreation', tag: 'NATURE & FUN', icon: <LeafOneRegular fontSize={22} />, img: '/images/explore/parks.png' },
  { label: 'Nightlife & Lifestyle', tag: 'ENTERTAINMENT', icon: <DrinkWineRegular fontSize={22} />, img: '/images/explore/nightlife.png' },
  { label: 'Hotels & Travels', tag: 'STAY & EXPLORE', icon: <BuildingRegular fontSize={22} />, img: '/images/explore/hotels.png' },
  { label: 'Shops & Malls', tag: 'SHOPPING', icon: <ShoppingBagRegular fontSize={22} />, img: '/images/explore/shopping.png' },
  { label: 'Culture & Finance', tag: 'HERITAGE & MONEY', icon: <BuildingBankRegular fontSize={22} />, img: '/images/explore/culture.png' },
]

export default function Landing() {
  const totalQ = questions.length + ABUJA_Q.length
  const xp = getXPData()
  const level = getLevel(xp.totalXP)
  const title = getLevelTitle(level)
  const playerName = localStorage.getItem('geoquiz_player') || ''
  const [eventIdx, setEventIdx] = useState(0)
  const carouselRef = useRef(null)

  // Auto-rotate events
  useEffect(() => {
    const timer = setInterval(() => {
      setEventIdx(prev => (prev + 1) % EVENTS.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const prevEvent = () => setEventIdx(prev => (prev - 1 + EVENTS.length) % EVENTS.length)
  const nextEvent = () => setEventIdx(prev => (prev + 1) % EVENTS.length)

  return (
    <section className="landing">
      {/* Hero */}
      <div className="landing-hero">
        <h1>
          <span className="hero-sub">How well do you know</span>
          <span className="hero-main">Nigeria?</span>
        </h1>
        <p className="hero-desc">
          Drop pins on the map. {totalQ}+ questions across Lagos & Abuja.
        </p>

        <div className="hero-actions">
          <Link to="/play" className="btn btn-primary btn-lg">
            Start Quiz →
          </Link>
          <Link to="/play" className="btn btn-outline btn-lg">
            <CompassNorthwestRegular fontSize={18} /> Explore
          </Link>
        </div>
      </div>

      {/* Adire Strip */}
      <div className="adire-strip" />

      {/* Events Carousel */}
      <div className="events-carousel">
        <h3 className="section-label-home">Happening in Lagos</h3>
        <div className="events-slider" ref={carouselRef}>
          <button className="events-nav events-prev" onClick={prevEvent}>
            <ChevronLeftRegular fontSize={20} />
          </button>

          <div className="event-card" style={{ borderTopColor: EVENTS[eventIdx].color }}>
            <div className="event-card-img">
              <img src={EVENTS[eventIdx].img} alt={EVENTS[eventIdx].title} />
              <span className="event-tag" style={{ background: EVENTS[eventIdx].color }}>
                {EVENTS[eventIdx].tag}
              </span>
            </div>
            <div className="event-card-body">
              <h4 className="event-title">{EVENTS[eventIdx].title}</h4>
              <div className="event-meta">
                <span><CalendarRegular fontSize={14} /> {EVENTS[eventIdx].date}</span>
                <span><LocationRegular fontSize={14} /> {EVENTS[eventIdx].venue}</span>
              </div>
            </div>
          </div>

          <button className="events-nav events-next" onClick={nextEvent}>
            <ChevronRightRegular fontSize={20} />
          </button>
        </div>
        <div className="events-dots">
          {EVENTS.map((_, i) => (
            <button
              key={i}
              className={`events-dot ${i === eventIdx ? 'active' : ''}`}
              onClick={() => setEventIdx(i)}
            />
          ))}
        </div>
      </div>

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

      {/* Explore the City — 6 Categories with images */}
      <div className="discover-section">
        <h3 className="discover-title">Explore the City</h3>
        <div className="discover-grid">
          {EXPLORE_CATEGORIES.map(d => (
            <div key={d.label} className="discover-card-lg">
              <img src={d.img} alt={d.label} />
              <span className="discover-card-icon">{d.icon}</span>
              <span className="discover-card-label">{d.label}</span>
              <span className="discover-card-tag">{d.tag}</span>
            </div>
          ))}
        </div>
        <p className="discover-hint">Coming soon — explore and discover places near you</p>
      </div>
    </section>
  )
}
