import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect, useCallback, useMemo } from 'react'
import { getXPData, getLevel, getLevelTitle, getCurrentLeague } from '../engine/xp.js'
import { HOME_CATEGORIES } from '../data/listings.jsx'
import { getListings, getConfig } from '../lib/cms.js'
import { supabase } from '../lib/supabase.js'
import {
  ChevronRightRegular, ChevronLeftRegular,
  LocationRegular, StarRegular,
  SearchRegular, ArrowRightRegular,
  CompassNorthwestRegular, PeopleRegular, TagMultipleRegular,
  ChatBubblesQuestionRegular, GamesRegular,
  HomeRegular, WrenchRegular,
  StoreMicrosoftRegular, CalendarStarRegular,
} from '@fluentui/react-icons'

const PLAY_ROW = [
  { id: 'quiz', path: '/play?mode=daily', label: 'Map Quiz', emoji: '📍', color: '#00c853', desc: 'Pin locations on the map' },
  { id: 'postcards', path: '/postcards', label: 'PostCards', emoji: '📷', color: '#8b5cf6', desc: 'Guess landmarks from photos' },
  { id: 'trivia', path: '/trivia', label: 'Trivia', emoji: '🧠', color: '#0ea5e9', desc: 'Test your knowledge' },
  { id: 'pinpoint', path: '/pinpoint', label: 'PinPoint', emoji: '🎯', color: '#ef4444', desc: 'Drop a pin, score by distance' },
  { id: 'flagstack', path: '/flagstack', label: 'FlagStack', emoji: '🏁', color: '#eab308', desc: 'Catch the falling flags' },
  { id: 'word', path: '/wordgame', label: 'Word Game', emoji: '🔤', color: '#f59e0b', desc: 'Unscramble & learn' },
]

/**
 * Default hero slides — used when CMS config `hero_slides` is not set.
 * Each slide: { title, subtitle, cta, link, img, emoji }
 *   - title: card heading text
 *   - subtitle: short description below the heading
 *   - cta: button label
 *   - link: where the CTA navigates (internal path or external URL)
 *   - img: background image URL for the card
 *   - emoji: (optional) decorative emoji shown on the card
 *
 * You can update these from the CMS Admin → Settings → hero_slides (JSON array).
 * The `link` field supports internal routes (e.g. /explore) and full URLs.
 */
const DEFAULT_HERO_SLIDES = [
  { title: 'Explore Places', subtitle: 'Attractions, restaurants, hotels & hidden gems', cta: 'Explore Now', link: '/explore', img: '/images/sites/nike-art_image_1.jpg', emoji: '🗺️' },
  { title: 'Events & Experiences', subtitle: 'Tours, concerts, cultural experiences near you', cta: 'Browse Events', link: '/explore?category=experience', img: '/images/sites/freedom-park_image_1.jpg', emoji: '🎉' },
  { title: 'Join Wanda App', subtitle: 'Save places, earn points & compete — for free', cta: 'Join Free', link: '/auth', img: '/images/sites/lekki-conservation_image_1.jpg', emoji: '🚀' },
  { title: 'List Your Business', subtitle: 'Get discovered by thousands of users', cta: 'Get Started', link: '/list-your-business', img: '/images/sites/bungalow-ikoyi_image_1.jpg', emoji: '🏪' },
  { title: 'Play & Win', subtitle: 'Quizzes, trivia games & daily rewards', cta: 'Play Now', link: '/play', img: '/images/sites/new-afrika-shrine_image_1.jpg', emoji: '🎮' },
  { title: 'Find a Service', subtitle: 'Artisans, plumbers, electricians & more', cta: 'Find Now', link: '/handymen', img: '/images/sites/craft-gourmet_image_1.jpg', emoji: '🔧' },
]

/** Merged features + audiences for the unified "Wanda is for Everyone" section */
const WANDA_VALUE = [
  { id: 'discover', icon: <CompassNorthwestRegular fontSize={26} />, title: 'DISCOVER', desc: 'Explore top attractions, events, restaurants, hotels & hidden gems across Nigeria.', audience: 'Tourists & Explorers' },
  { id: 'connect', icon: <PeopleRegular fontSize={26} />, title: 'CONNECT', desc: 'Find and connect with trusted artisans, handymen, businesses and service providers.', audience: 'Residents' },
  { id: 'save', icon: <TagMultipleRegular fontSize={26} />, title: 'SAVE', desc: 'Unlock exclusive deals, offers and discounts from local businesses.', audience: 'Businesses' },
  { id: 'engage', icon: <ChatBubblesQuestionRegular fontSize={26} />, title: 'ENGAGE', desc: 'Ask questions, share experiences and get recommendations from real people.', audience: 'Artisans & Handymen' },
  { id: 'play', icon: <GamesRegular fontSize={26} />, title: 'PLAY & EARN', desc: 'Play quizzes and games, earn points and climb the leaderboard.', audience: 'Event Organizers' },
]

const AUDIENCE_ICONS = {
  'Tourists & Explorers': <CompassNorthwestRegular fontSize={20} />,
  'Residents': <HomeRegular fontSize={20} />,
  'Businesses': <StoreMicrosoftRegular fontSize={20} />,
  'Artisans & Handymen': <WrenchRegular fontSize={20} />,
  'Event Organizers': <CalendarStarRegular fontSize={20} />,
}

export default function Landing({ session, profile }) {
  const navigate = useNavigate()
  const xp = getXPData()
  const level = getLevel(xp.totalXP)
  const title = getLevelTitle(level)
  const league = getCurrentLeague(xp.totalXP)
  const totalPoints = profile?.total_xp || xp.totalXP

  const [listings, setListings] = useState([])
  const [heroSlides, setHeroSlides] = useState(DEFAULT_HERO_SLIDES)

  useEffect(() => {
    getListings()
      .then(({ data }) => setListings(data || []))
      .catch(console.error)

    // Load hero slides from CMS config (if set)
    getConfig('hero_slides')
      .then(val => {
        if (val && Array.isArray(val) && val.length > 0) {
          setHeroSlides(val)
        }
      })
      .catch(() => {}) // Silently fall back to defaults

    // Load upcoming public events and add as hero slides
    supabase?.from('events')
      .select('*')
      .eq('visibility', 'public')
      .eq('status', 'published')
      .gte('start_date', new Date().toISOString())
      .order('start_date')
      .limit(4)
      .then(({ data }) => {
        if (data && data.length > 0) {
          const eventSlides = data.map(ev => ({
            title: ev.title,
            subtitle: `${ev.category} · ${new Date(ev.start_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}${ev.is_free ? ' · Free' : (ev.price ? ` · ₦${Number(ev.price).toLocaleString()}` : '')}`,
            cta: 'RSVP Now',
            link: `/pass/${ev.slug}`,
            img: ev.image_url || '/images/sites/freedom-park_image_1.jpg',
            emoji: '🎟️',
          }))
          setHeroSlides(prev => [...prev, ...eventSlides])
        }
      })
      .catch(() => {})
  }, [])

  // Popular listings (all, sorted by rating)
  const popularListings = useMemo(() => {
    return [...listings].sort((a, b) => b.rating - a.rating).slice(0, 10)
  }, [listings])

  // Top rated
  const topRated = useMemo(() => {
    return [...listings].sort((a, b) => b.rating - a.rating).slice(0, 8)
  }, [listings])

  // Last played game
  const lastGame = useMemo(() => {
    const sessions = JSON.parse(localStorage.getItem('geoquiz_sessions') || '[]')
    if (sessions.length === 0) return null
    return sessions[sessions.length - 1]
  }, [])

  // ── Hero Full-Screen Carousel state ──
  const [currentSlide, setCurrentSlide] = useState(0)
  const [paused, setPaused] = useState(false)
  const [touchStartX, setTouchStartX] = useState(null)

  const nextSlide = useCallback(() => {
    setCurrentSlide(p => (p + 1) % heroSlides.length)
  }, [heroSlides.length])

  const prevSlide = useCallback(() => {
    setCurrentSlide(p => (p - 1 + heroSlides.length) % heroSlides.length)
  }, [heroSlides.length])

  // Auto-advance — pauses on hover/touch
  useEffect(() => {
    if (paused || heroSlides.length === 0) return
    const timer = setInterval(nextSlide, 5000)
    return () => clearInterval(timer)
  }, [paused, nextSlide, heroSlides.length])

  function handleTouchStart(e) {
    setTouchStartX(e.touches[0].clientX)
    setPaused(true)
  }
  function handleTouchEnd(e) {
    if (touchStartX === null) return
    const diff = touchStartX - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextSlide()
      else prevSlide()
    }
    setTouchStartX(null)
    setPaused(false)
  }

  const slide = heroSlides[currentSlide] || heroSlides[0]

  /** Navigate hero CTA — supports internal paths and external URLs */
  function handleHeroCTA(link) {
    if (!link) return
    if (link.startsWith('http')) {
      window.open(link, '_blank', 'noopener')
    } else {
      navigate(link)
    }
  }

  return (
    <section className="home-page">

      {/* ── SEARCH BAR ── */}
      <div className="home-search-section">
        <div className="home-search-bar-wrap" onClick={() => navigate('/explore')}>
          <SearchRegular fontSize={20} className="home-search-icon" />
          <span className="home-search-placeholder">Search places, services, deals...</span>
        </div>
      </div>

      {/* ── HERO CAROUSEL (full-screen cards — CMS-managed via hero_slides config) ── */}
      <div
        className="hero-carousel"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {heroSlides.map((s, i) => (
          <div
            key={i}
            className={`hero-carousel-bg ${i === currentSlide ? 'active' : ''}`}
            style={{ backgroundImage: `url(${s.img})` }}
          />
        ))}

        <div className="hero-carousel-overlay" />

        {/* Content */}
        {slide && (
          <div className="hero-carousel-content" key={currentSlide}>
            {slide.emoji && <span className="hero-carousel-emoji">{slide.emoji}</span>}
            <h1 className="hero-carousel-title">{slide.title}</h1>
            <p className="hero-carousel-sub">{slide.subtitle}</p>
            <button className="hero-carousel-cta" onClick={() => handleHeroCTA(slide.link)}>
              {slide.cta} <ArrowRightRegular fontSize={18} />
            </button>
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

      {/* ── CATEGORIES GRID (4×2 from mockup) ── */}
      <div className="home-section-container">
        <div className="home-section-header">
          <h2>Categories</h2>
          <Link to="/explore" className="see-all-btn">See all <ChevronRightRegular fontSize={16} /></Link>
        </div>
        <div className="home-categories-grid">
          {HOME_CATEGORIES.map(cat => (
            <Link key={cat.id} to={cat.path} className="home-cat-grid-item">
              <div className="home-cat-grid-icon" style={{ '--cat-color': cat.color }}>
                {cat.icon}
              </div>
              <span className="home-cat-grid-label">{cat.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── POPULAR LISTINGS ── */}
      <div className="home-section-container">
        <div className="home-section-header">
          <h2>Popular Listings</h2>
          <Link to="/explore" className="see-all-btn">See all <ChevronRightRegular fontSize={16} /></Link>
        </div>
        <div className="home-popular-scroller">
          {popularListings.map(l => (
            <Link key={l.id} to={`/explore/${l.id}`} className="home-popular-card">
              <div className="home-popular-img-wrap">
                <img
                  src={l.photos?.[0] || '/images/postcards/national-theatre.png'}
                  alt={l.name}
                  onError={e => { e.target.src = '/images/postcards/national-theatre.png' }}
                />
              </div>
              <div className="home-popular-info">
                <strong>{l.name}</strong>
                <span className="home-popular-area"><LocationRegular fontSize={13} /> {l.area}</span>
                <span className="home-popular-rating"><StarRegular fontSize={13} style={{ color: '#f59e0b' }} /> {l.rating}</span>
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

      {/* ── PLAY & EARN POINTS ── */}
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

      {/* ── CONTINUE WHERE YOU LEFT OFF ── */}
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

      {/* ── WANDA IS FOR EVERYONE — Merged features + audiences ── */}
      <div className="home-for-everyone">
        <h2 className="home-fe-heading">WANDA IS FOR EVERYONE</h2>
        <p className="home-fe-subheading">Discover, connect, save, engage & earn — all in one app</p>
        <div className="home-fe-grid">
          {WANDA_VALUE.map(item => (
            <div key={item.id} className="home-fe-card">
              <div className="home-fe-icon">{item.icon}</div>
              <strong className="home-fe-title">{item.title}</strong>
              <p className="home-fe-desc">{item.desc}</p>
              <div className="home-fe-audience">
                <span className="home-fe-audience-icon">{AUDIENCE_ICONS[item.audience]}</span>
                <span>{item.audience}</span>
              </div>
            </div>
          ))}
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
