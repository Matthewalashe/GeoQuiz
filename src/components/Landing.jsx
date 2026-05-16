import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback } from 'react'
import { getXPData, getLevel, getLevelTitle, canClaimToday } from '../engine/xp.js'
import { LISTINGS, CATEGORIES } from '../data/listings.jsx'
import {
  ChevronRightRegular, ChevronLeftRegular, FireRegular, GiftRegular,
  TicketDiagonalRegular, LocationRegular, StarRegular, PlayRegular,
  MapRegular, NavigationRegular, EditRegular, PersonRegular,
  ArrowRightRegular,
} from '@fluentui/react-icons'

// Hero slides — handpicked visually rich items
const HERO_SLIDES = [
  { id: 'nike-art', title: 'Nike Art Gallery', sub: 'Lekki · Art & Culture', cta: 'Explore', img: '/images/postcards/national-theatre.png' },
  { id: 'lekki-conservation', title: 'Lekki Conservation Centre', sub: 'Lekki · Nature & Wildlife', cta: 'Discover', img: '/images/postcards/lekki-conservation.png' },
  { id: 'new-afrika-shrine', title: 'New Afrika Shrine', sub: 'Ikeja · Music & Culture', cta: 'Experience', img: '/images/postcards/freedom-park.png' },
  { id: 'bungalow-ikoyi', title: 'The Bungalow Ikoyi', sub: 'Ikoyi · Dining & Nightlife', cta: 'Visit', img: '/images/postcards/national-theatre.png' },
].map(slide => {
  const listing = LISTINGS.find(l => l.id === slide.id)
  return {
    ...slide,
    title: listing?.name || slide.title,
    sub: listing ? `${listing.area} · ${listing.category}` : slide.sub,
    img: listing?.photos?.[0] || slide.img,
  }
})

const FEATURED_IDS = ['nike-art', 'bungalow-ikoyi', 'lekki-conservation', 'new-afrika-shrine']

export default function Landing() {
  const navigate = useNavigate()
  const xp = getXPData()
  const level = getLevel(xp.totalXP)
  const title = getLevelTitle(level)
  const streak = xp.streakDays || 0
  const playerName = localStorage.getItem('geoquiz_player') || 'Explorer'

  const featured = LISTINGS.filter(l => FEATURED_IDS.includes(l.id))
  const topRated = [...LISTINGS].sort((a, b) => b.rating - a.rating).slice(0, 8)

  // ── Carousel state ──
  const [currentSlide, setCurrentSlide] = useState(0)
  const [paused, setPaused] = useState(false)

  const nextSlide = useCallback(() => {
    setCurrentSlide(p => (p + 1) % HERO_SLIDES.length)
  }, [])

  const prevSlide = useCallback(() => {
    setCurrentSlide(p => (p - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)
  }, [])

  // Auto-advance every 5s
  useEffect(() => {
    if (paused) return
    const timer = setInterval(nextSlide, 5000)
    return () => clearInterval(timer)
  }, [paused, nextSlide])

  const slide = HERO_SLIDES[currentSlide] || HERO_SLIDES[0]

  return (
    <section className="home-page">

      {/* ── IMMERSIVE HERO CAROUSEL ── */}
      <div
        className="hero-carousel"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Background images — all preloaded, crossfade */}
        {HERO_SLIDES.map((s, i) => (
          <div
            key={s.id}
            className={`hero-carousel-bg ${i === currentSlide ? 'active' : ''}`}
            style={{ backgroundImage: `url(${s.img})` }}
          />
        ))}

        <div className="hero-carousel-overlay" />

        {/* Greeting badge */}
        <div className="hero-greeting-badge">
          <span className="hero-greeting-avatar"><PersonRegular fontSize={16} /></span>
          <span>Hey, {playerName}</span>
          {streak > 0 && <span className="hero-streak-pill"><FireRegular fontSize={14} /> {streak}</span>}
        </div>

        {/* Content */}
        <div className="hero-carousel-content" key={currentSlide}>
          <span className="hero-carousel-label">FEATURED</span>
          <h1 className="hero-carousel-title">{slide.title}</h1>
          <p className="hero-carousel-sub">{slide.sub}</p>
          <Link to={`/explore/${slide.id}`} className="hero-carousel-cta">
            {slide.cta} <ArrowRightRegular fontSize={18} />
          </Link>
        </div>

        {/* Navigation arrows */}
        <button className="hero-nav hero-nav-prev" onClick={prevSlide} aria-label="Previous">
          <ChevronLeftRegular fontSize={24} />
        </button>
        <button className="hero-nav hero-nav-next" onClick={nextSlide} aria-label="Next">
          <ChevronRightRegular fontSize={24} />
        </button>

        {/* Dots */}
        <div className="hero-dots">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              className={`hero-dot ${i === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* ── CATEGORY CHIPS ── */}
      <div className="home-categories-scroll">
        {CATEGORIES.filter(c => c.id !== 'all').slice(0, 8).map(c => (
          <Link key={c.id} to={`/explore?category=${c.id}`} className="home-cat-card">
            <div className="home-cat-icon">{c.icon}</div>
            <span className="home-cat-label">{c.label}</span>
          </Link>
        ))}
      </div>

      {/* ── DAILY GAME CTA ── */}
      <div className="home-section-container">
        <button className="home-daily-immersive" onClick={() => navigate('/play?mode=daily')}>
          <div className="home-daily-content">
            <span className="home-daily-badge">DAILY GAME</span>
            <h2>Test your Lagos knowledge</h2>
            <p>Play, earn XP, unlock rewards</p>
          </div>
          <div className="home-daily-icon">
            <PlayRegular fontSize={64} />
          </div>
        </button>
      </div>

      {/* Daily reward */}
      {canClaimToday() && (
        <div className="home-section-container">
          <Link to="/rewards" className="home-reward-banner">
            <div className="reward-content">
              <GiftRegular fontSize={24} />
              <span>Your daily reward is ready!</span>
            </div>
            <span className="home-reward-go">Claim <ChevronRightRegular fontSize={16} /></span>
          </Link>
        </div>
      )}

      {/* ── DISCOVER — Visual cards grid ── */}
      <div className="home-section-container">
        <div className="home-section-header">
          <h2>Discover <span className="section-subtitle">Lagos</span></h2>
          <Link to="/explore" className="see-all-btn">See all <ChevronRightRegular fontSize={16} /></Link>
        </div>
        <div className="home-featured-grid">
          {featured.slice(0, 4).map(l => (
            <Link key={l.id} to={`/explore/${l.id}`} className="home-visual-card">
              <img
                src={l.photos?.[0] || '/images/postcards/national-theatre.png'}
                alt={l.name}
                onError={e => { e.target.src = '/images/postcards/national-theatre.png' }}
              />
              <div className="card-gradient"></div>
              <div className="card-info">
                <h3>{l.name}</h3>
                <p><LocationRegular fontSize={14} /> {l.area}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── TOP RATED — Horizontal scroll ── */}
      <div className="home-section-container">
        <div className="home-section-header">
          <h2>Top Rated</h2>
          <Link to="/explore" className="see-all-btn">Browse <ChevronRightRegular fontSize={16} /></Link>
        </div>
        <div className="home-toprated-scroller">
          {topRated.map(l => (
            <Link key={l.id} to={`/explore/${l.id}`} className="home-tr-visual">
              <img
                src={l.photos?.[0] || '/images/postcards/national-theatre.png'}
                alt={l.name}
                onError={e => { e.target.src = '/images/postcards/national-theatre.png' }}
              />
              <div className="tr-info">
                <strong>{l.name}</strong>
                <span><StarRegular fontSize={14} style={{color: 'gold'}} /> {l.rating} &middot; {l.area}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── WANDA PASS ── */}
      <div className="home-section-container">
        <Link to="/pass" className="home-pass-banner">
          <div className="home-pass-content">
            <span className="home-pass-badge">COMING SOON</span>
            <h2>Wanda Pass</h2>
            <p>One pass, multiple attractions.</p>
          </div>
          <TicketDiagonalRegular fontSize={80} className="pass-icon-bg" />
        </Link>
      </div>

      {/* ── GAMES ── */}
      <div className="home-section-container">
        <h2 className="home-section-title">Games</h2>
        <div className="home-games-grid">
          <Link to="/play" className="game-card">
            <MapRegular fontSize={28} />
            <span>Map Quiz</span>
          </Link>
          <Link to="/trivia" className="game-card">
            <NavigationRegular fontSize={28} />
            <span>Trivia</span>
          </Link>
          <Link to="/crossword" className="game-card">
            <EditRegular fontSize={28} />
            <span>Crossword</span>
          </Link>
          <Link to="/adventure" className="game-card">
            <PersonRegular fontSize={28} />
            <span>Adventure</span>
          </Link>
        </div>
      </div>

      {/* ── LIST BUSINESS CTA ── */}
      <div className="home-section-container" style={{ paddingBottom: '2rem' }}>
        <Link to="/list-your-business" className="home-business-cta">
          <div>
            <strong>Own a business?</strong>
            <span>List it on Wanda for free</span>
          </div>
          <ChevronRightRegular fontSize={20} />
        </Link>
      </div>
    </section>
  )
}
