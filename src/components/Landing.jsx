import { Link, useNavigate } from 'react-router-dom'
import { getXPData, getLevel, getLevelTitle, canClaimToday } from '../engine/xp.js'
import { LISTINGS, CATEGORIES } from '../data/listings.jsx'
import {
  ChevronRightRegular, FireRegular, GiftRegular, TicketDiagonalRegular,
  LocationRegular, StarRegular, PlayRegular,
  MapRegular, NavigationRegular, EditRegular, PersonRegular
} from '@fluentui/react-icons'

// Featured picks — hand-curated from seed data
const FEATURED_IDS = ['nike-art', 'bungalow-ikoyi', 'lekki-conservation', 'new-afrika-shrine']

export default function Landing() {
  const navigate = useNavigate()
  const xp = getXPData()
  const level = getLevel(xp.totalXP)
  const title = getLevelTitle(level)
  const streak = xp.streakDays || 0
  const playerName = localStorage.getItem('geoquiz_player') || 'Explorer'

  const featured = LISTINGS.filter(l => FEATURED_IDS.includes(l.id))
  const topRated = [...LISTINGS].sort((a, b) => b.rating - a.rating).slice(0, 6)

  // Use the first featured listing for the Hero background, or a default
  const heroImage = featured[0]?.photos?.[0] || '/images/postcards/national-theatre.png'

  return (
    <section className="home-page">
      {/* Immersive Hero Section */}
      <div className="home-hero" style={{ backgroundImage: `url(${heroImage})` }}>
        <div className="home-hero-overlay"></div>
        <div className="home-hero-content">
          <div className="home-greeting">
            <div className="home-avatar">
              <PersonRegular fontSize={28} />
            </div>
            <div>
              <h2 className="home-hello">Hey, {playerName}</h2>
              <span className="home-level">Level {level} &middot; {title.title}</span>
            </div>
            {streak > 0 && <span className="home-streak"><FireRegular fontSize={20} /> {streak}</span>}
          </div>

          <div className="home-hero-text">
            <span className="hero-badge">FEATURED</span>
            <h1>{featured[0]?.name || 'Discover Lagos'}</h1>
            <p>{featured[0]?.area || 'Explore the beauty of the city'}</p>
            <Link to={`/explore/${featured[0]?.id || ''}`} className="hero-btn">
              Explore Now <ChevronRightRegular fontSize={18} />
            </Link>
          </div>
        </div>
      </div>

      {/* Visual Category Cards (Quick Categories) */}
      <div className="home-categories-scroll">
        {CATEGORIES.filter(c => c.id !== 'all').slice(0, 6).map(c => (
          <Link key={c.id} to={`/explore?category=${c.id}`} className="home-cat-card">
            <div className="home-cat-icon">{c.icon}</div>
            <span className="home-cat-label">{c.label}</span>
          </Link>
        ))}
      </div>

      {/* Daily Game Challenge — retention hook */}
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

      {/* Anco — Explore/Discover section */}
      <div className="home-section-container">
        <div className="home-section-header">
          <h2>Anco <span className="section-subtitle">Discover Lagos</span></h2>
          <Link to="/explore" className="see-all-btn">See all <ChevronRightRegular fontSize={16} /></Link>
        </div>
        <div className="home-featured-grid">
          {featured.slice(1).map(l => (
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

      {/* Top Rated Picks */}
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

      {/* Wanda Pass teaser */}
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

      {/* Games row */}
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

      {/* List your business CTA */}
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
