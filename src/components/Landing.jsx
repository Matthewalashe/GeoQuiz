import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { getXPData, getLevel, getLevelTitle, canClaimToday, getCurrentLeague } from '../engine/xp.js'
import { CATEGORIES } from '../data/listings.jsx'
import { getListings } from '../lib/cms.js'
import {
  ChevronRightRegular, ChevronLeftRegular, FireRegular, GiftRegular,
  TicketDiagonalRegular, LocationRegular, StarRegular, PlayRegular,
  MapRegular, NavigationRegular, PersonRegular,
  ArrowRightRegular, TrophyRegular,
} from '@fluentui/react-icons'

const FEATURED_IDS = ['nike-art', 'bungalow-ikoyi', 'lekki-conservation', 'new-afrika-shrine']

const PLAY_ROW = [
  { id: 'quiz', path: '/play?mode=daily', label: 'Map Quiz', emoji: '📍', color: '#00c853', desc: 'Pin locations on the map' },
  { id: 'postcards', path: '/postcards', label: 'PostCards', emoji: '📷', color: '#8b5cf6', desc: 'Guess landmarks from photos' },
  { id: 'trivia', path: '/trivia', label: 'Trivia', emoji: '🧠', color: '#0ea5e9', desc: 'Test your knowledge' },
  { id: 'puzzle', path: '/puzzle', label: 'Puzzle', emoji: '🧩', color: '#06b6d4', desc: 'Rearrange the image' },
  { id: 'word', path: '/word', label: 'Word Game', emoji: '🔤', color: '#f59e0b', desc: 'Unscramble & learn' },
]

export default function Landing({ session, profile }) {
  const navigate = useNavigate()
  const xp = getXPData()
  const level = getLevel(xp.totalXP)
  const title = getLevelTitle(level)
  const league = getCurrentLeague(xp.totalXP)
  const streak = xp.streakDays || 0
  const playerName = profile?.username || profile?.full_name || localStorage.getItem('geoquiz_player') || 'Explorer'
  const totalPoints = profile?.total_xp || xp.totalXP

  const [listings, setListings] = useState([])

  useEffect(() => {
    getListings()
      .then(({ data }) => setListings(data || []))
      .catch(console.error)
  }, [])

  const heroSlides = useMemo(() => {
    const cmsFeatures = listings.filter(l => l.is_featured).sort((a, b) => (a.featured_order || 99) - (b.featured_order || 99))
    if (cmsFeatures.length >= 2) {
      return cmsFeatures.slice(0, 4).map(l => ({
        id: l.id,
        title: l.name,
        sub: `${l.area} · ${l.category}`,
        cta: 'Explore',
        img: l.photos?.[0] || '/images/postcards/national-theatre.png',
      }))
    }
    // Fallback: use any available listings if no featured ones
    if (listings.length > 0) {
      return listings.slice(0, 4).map(l => ({
        id: l.id,
        title: l.name,
        sub: `${l.area} · ${l.category}`,
        cta: 'Explore',
        img: l.photos?.[0] || '/images/postcards/national-theatre.png',
      }))
    }
    return []
  }, [listings])

  const featured = useMemo(() => {
    return listings.filter(l => FEATURED_IDS.includes(l.id))
  }, [listings])

  const topRated = useMemo(() => {
    return [...listings].sort((a, b) => b.rating - a.rating).slice(0, 8)
  }, [listings])

  // Last played game
  const lastGame = useMemo(() => {
    const sessions = JSON.parse(localStorage.getItem('geoquiz_sessions') || '[]')
    if (sessions.length === 0) return null
    const last = sessions[sessions.length - 1]
    return last
  }, [])

  // ── Carousel state ──
  const [currentSlide, setCurrentSlide] = useState(0)
  const [paused, setPaused] = useState(false)

  const nextSlide = useCallback(() => {
    setCurrentSlide(p => (p + 1) % heroSlides.length)
  }, [heroSlides.length])

  const prevSlide = useCallback(() => {
    setCurrentSlide(p => (p - 1 + heroSlides.length) % heroSlides.length)
  }, [heroSlides.length])

  useEffect(() => {
    if (paused) return
    const timer = setInterval(nextSlide, 5000)
    return () => clearInterval(timer)
  }, [paused, nextSlide])

  const slide = heroSlides[currentSlide] || heroSlides[0]

  return (
    <section className="home-page">

      {/* ── IMMERSIVE HERO CAROUSEL ── */}
      <div
        className="hero-carousel"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {heroSlides.map((s, i) => (
          <div
            key={s.id}
            className={`hero-carousel-bg ${i === currentSlide ? 'active' : ''}`}
            style={{ backgroundImage: `url(${s.img})` }}
          />
        ))}

        <div className="hero-carousel-overlay" />

        {/* Greeting — personalized for logged-in users */}
        <div className="hero-greeting-badge">
          <span className="hero-greeting-avatar"><PersonRegular fontSize={16} /></span>
          <span>Hey, {playerName}</span>
          {streak > 0 && <span className="hero-streak-pill"><FireRegular fontSize={16} /> {streak} day{streak > 1 ? 's' : ''}</span>}
        </div>

        {/* Content */}
        {slide && (
          <div className="hero-carousel-content" key={currentSlide}>
            <span className="hero-carousel-label">FEATURED</span>
            <h1 className="hero-carousel-title">{slide.title}</h1>
            <p className="hero-carousel-sub">{slide.sub}</p>
            <Link to={`/explore/${slide.id}`} className="hero-carousel-cta">
              {slide.cta} <ArrowRightRegular fontSize={18} />
            </Link>
          </div>
        )}

        <button className="hero-nav hero-nav-prev" onClick={prevSlide} aria-label="Previous">
          <ChevronLeftRegular fontSize={24} />
        </button>
        <button className="hero-nav hero-nav-next" onClick={nextSlide} aria-label="Next">
          <ChevronRightRegular fontSize={24} />
        </button>

        <div className="hero-dots">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              className={`hero-dot ${i === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* ── PERSONALIZED STATS BAR (logged in) ── */}
      {session && (
        <div className="home-stats-bar">
          <div className="home-stat-chip">
            <span className="home-stat-icon">{title.emoji}</span>
            <div>
              <strong>Lv.{level}</strong>
              <span>{title.title}</span>
            </div>
          </div>
          <div className="home-stat-chip">
            <span className="home-stat-icon">⚡</span>
            <div>
              <strong>{totalPoints.toLocaleString()}</strong>
              <span>Total XP</span>
            </div>
          </div>
          <div className="home-stat-chip">
            <span className="home-stat-icon">{league.emoji}</span>
            <div>
              <strong>{league.name}</strong>
              <span>League</span>
            </div>
          </div>
        </div>
      )}

      {/* ── SIGN UP CTA (not logged in) ── */}
      {!session && (
        <div className="home-section-container">
          <Link to="/auth" className="home-signup-cta">
            <div className="home-signup-content">
              <h3>Join Wanda — It's Free!</h3>
              <p>Save scores, track streaks, compete on the leaderboard</p>
            </div>
            <span className="home-signup-arrow"><ArrowRightRegular fontSize={20} /></span>
          </Link>
        </div>
      )}

      {/* ── PLAY & EARN POINTS (#33) ── */}
      <div className="home-section-container">
        <div className="home-section-header">
          <h2>Play & Earn <span className="section-subtitle">Points</span></h2>
          {session && <span className="home-points-badge">⚡ {totalPoints.toLocaleString()} XP</span>}
          {!session && <Link to="/play" className="see-all-btn">All Games <ChevronRightRegular fontSize={16} /></Link>}
        </div>
        <div className="home-play-scroller">
          {PLAY_ROW.map(game => (
            <Link key={game.id} to={game.path} className="home-play-card">
              <div className="home-play-card-icon" style={{ background: game.color }}>{game.emoji}</div>
              <strong>{game.label}</strong>
              <span>{game.desc}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── CONTINUE WHERE YOU LEFT OFF (#31) ── */}
      {session && lastGame && (
        <div className="home-section-container">
          <button className="home-continue-card" onClick={() => navigate('/play?mode=daily')}>
            <div className="home-continue-left">
              <span className="home-continue-icon">🔄</span>
              <div>
                <strong>Continue Playing</strong>
                <span>Last score: {lastGame.score}/{lastGame.max} pts</span>
              </div>
            </div>
            <ChevronRightRegular fontSize={20} />
          </button>
        </div>
      )}

      {/* ── CATEGORY CHIPS ── */}
      <div className="home-categories-scroll">
        {CATEGORIES.filter(c => c.id !== 'all').slice(0, 8).map(c => (
          <Link key={c.id} to={`/explore?category=${c.id}`} className="home-cat-card">
            <div className="home-cat-icon">{c.icon}</div>
            <span className="home-cat-label">{c.label}</span>
          </Link>
        ))}
        <Link to="/handymen" className="home-cat-card" style={{ '--cat-accent': '#22c55e' }}>
          <div className="home-cat-icon">🔧</div>
          <span className="home-cat-label">Handymen</span>
        </Link>
      </div>

      {/* ── TODAY'S CHALLENGE ── */}
      <div className="home-section-container">
        <button className="home-daily-immersive" onClick={() => navigate('/play?mode=daily')}>
          <div className="home-daily-content">
            <span className="home-daily-badge">TODAY'S CHALLENGE</span>
            <h2>Test your Lagos knowledge</h2>
            <p>Play daily, earn XP, climb the ranks</p>
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

      {/* ── WANDA PASS CTA (#36) ── */}
      <div className="home-section-container">
        <div className="home-pass-card">
          <div className="home-pass-gradient" />
          <div className="home-pass-inner">
            <TicketDiagonalRegular fontSize={36} style={{ color: '#fff', opacity: 0.9 }} />
            <div className="home-pass-text">
              <span className="home-pass-chip">COMING SOON</span>
              <h3>Wanda Pass</h3>
              <p>One pass, multiple attractions. Join the waitlist.</p>
            </div>
            <Link to="/pass" className="home-pass-cta-btn">Learn More →</Link>
          </div>
        </div>
      </div>

      {/* ── WHAT'S HAPPENING (replaces Feed #34) ── */}
      <div className="home-section-container">
        <div className="home-section-header">
          <h2>What's Happening</h2>
        </div>
        <div className="home-whats-happening">
          <div className="home-wh-item">
            <span className="home-wh-icon">🏆</span>
            <div>
              <strong>Leaderboard updated</strong>
              <span>New scores posted today</span>
            </div>
            <Link to="/leaderboard" className="home-wh-link">View →</Link>
          </div>
          <div className="home-wh-item">
            <span className="home-wh-icon">🗺️</span>
            <div>
              <strong>New places added</strong>
              <span>Explore fresh listings</span>
            </div>
            <Link to="/explore" className="home-wh-link">Explore →</Link>
          </div>
          <div className="home-wh-item">
            <span className="home-wh-icon">🎮</span>
            <div>
              <strong>Daily challenge is live</strong>
              <span>Can you beat yesterday's score?</span>
            </div>
            <Link to="/play?mode=daily" className="home-wh-link">Play →</Link>
          </div>
        </div>
      </div>

      {/* ── LIST BUSINESS / HANDYMAN CTA ── */}
      <div className="home-section-container" style={{ paddingBottom: '2rem' }}>
        <Link to="/list-your-business" className="home-business-cta">
          <div>
            <strong>Own a business or offer a trade?</strong>
            <span>List on Wanda for free</span>
          </div>
          <ChevronRightRegular fontSize={20} />
        </Link>
        <Link to="/handymen" className="home-business-cta" style={{ marginTop: '0.5rem', background: 'linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(16,185,129,0.05) 100%)', borderColor: 'rgba(34,197,94,0.3)' }}>
          <div>
            <strong>🔧 Find a Handyman</strong>
            <span>Plumbers, electricians, mechanics & more</span>
          </div>
          <ChevronRightRegular fontSize={20} />
        </Link>
      </div>
    </section>
  )
}
