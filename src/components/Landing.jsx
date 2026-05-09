import { Link, useNavigate } from 'react-router-dom'
import { getXPData, getLevel, getLevelTitle, canClaimToday } from '../engine/xp.js'
import { LISTINGS, CATEGORIES } from '../data/listings.js'
import { ChevronRightRegular } from '@fluentui/react-icons'

// Featured picks — hand-curated from seed data
const FEATURED_IDS = ['nike-art', 'bungalow-ikoyi', 'lekki-conservation', 'new-afrika-shrine']

export default function Landing() {
  const navigate = useNavigate()
  const xp = getXPData()
  const level = getLevel(xp.totalXP)
  const title = getLevelTitle(level)
  const streak = xp.streakDays || 0
  const playerName = localStorage.getItem('geoquiz_player') || 'Explorer'
  const avatar = localStorage.getItem('geoquiz_avatar') || '🦅'

  const featured = LISTINGS.filter(l => FEATURED_IDS.includes(l.id))
  const topRated = [...LISTINGS].sort((a, b) => b.rating - a.rating).slice(0, 6)

  return (
    <section className="home-page">
      {/* Greeting */}
      <div className="home-greeting">
        <div className="home-avatar">{avatar}</div>
        <div>
          <h2 className="home-hello">Hey, {playerName}</h2>
          <span className="home-level">{title.emoji} Level {level} &middot; {title.title}</span>
        </div>
        {streak > 0 && <span className="home-streak">🔥 {streak}</span>}
      </div>

      {/* Anco — Explore/Discover section (Yoruba: "roaming, exploring") */}
      <div className="home-anco">
        <div className="home-anco-header">
          <div>
            <h3 className="home-section-title">Anco</h3>
            <span className="home-section-meaning">Discover Lagos</span>
          </div>
          <Link to="/explore" className="home-see-all">See all →</Link>
        </div>
        <div className="home-featured-row">
          {featured.map(l => (
            <Link key={l.id} to={`/explore/${l.id}`} className="home-feat-card">
              <img
                src={l.photos?.[0] || '/images/postcards/national-theatre.png'}
                alt={l.name}
                onError={e => { e.target.src = '/images/postcards/national-theatre.png' }}
              />
              <div className="home-feat-info">
                <strong>{l.name}</strong>
                <span>{l.subcategory} &middot; {l.area}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick categories */}
      <div className="home-quick-cats">
        {CATEGORIES.filter(c => c.id !== 'all').slice(0, 6).map(c => (
          <Link key={c.id} to={`/explore?category=${c.id}`} className="home-qcat">
            <span className="home-qcat-icon">{c.icon}</span>
            <span className="home-qcat-label">{c.label}</span>
          </Link>
        ))}
      </div>

      {/* Owambe — Events/Parties section (Yoruba: "celebration, party") */}
      <div className="home-owambe">
        <div className="home-anco-header">
          <div>
            <h3 className="home-section-title">Owambe</h3>
            <span className="home-section-meaning">Events &amp; Nightlife</span>
          </div>
          <Link to="/explore?category=nightlife" className="home-see-all">See all →</Link>
        </div>
        <div className="home-owambe-cards">
          {LISTINGS.filter(l => l.category === 'nightlife' || l.category === 'attraction' && l.subcategory === 'Events')
            .slice(0, 3).map(l => (
            <Link key={l.id} to={`/explore/${l.id}`} className="home-owambe-card">
              <span className="home-owambe-icon">{l.category === 'nightlife' ? '🌙' : '🎉'}</span>
              <div>
                <strong>{l.name}</strong>
                <span>{l.area} &middot; {l.hours}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Daily Game Challenge — retention hook */}
      <button className="home-daily" onClick={() => navigate('/play?mode=daily')}>
        <div className="home-daily-left">
          <span className="home-daily-badge">DAILY GAME</span>
          <strong>Test your Lagos knowledge</strong>
          <span className="home-daily-sub">Play, earn XP, unlock rewards</span>
        </div>
        <span className="home-daily-icon">🎮</span>
      </button>

      {/* Daily reward */}
      {canClaimToday() && (
        <Link to="/rewards" className="home-reward">
          🎁 <span>Your daily reward is ready!</span> <span className="home-reward-go">Claim →</span>
        </Link>
      )}

      {/* Top rated — Anco picks */}
      <div className="home-anco-header" style={{ marginTop: '0.5rem' }}>
        <div>
          <h3 className="home-section-title">Top Rated</h3>
          <span className="home-section-meaning">Highest rated on Feferity</span>
        </div>
        <Link to="/explore" className="home-see-all">Browse →</Link>
      </div>
      <div className="home-toprated-grid">
        {topRated.map(l => (
          <Link key={l.id} to={`/explore/${l.id}`} className="home-tr-card">
            <span className="home-tr-icon">{CATEGORIES.find(c => c.id === l.category)?.icon || '📍'}</span>
            <div>
              <strong>{l.name}</strong>
              <span>⭐ {l.rating} &middot; {l.area}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Feferity Pass teaser */}
      <Link to="/pass" className="home-pass-teaser">
        <div className="home-pass-left">
          <span className="home-pass-badge">NEW</span>
          <strong>Feferity Pass</strong>
          <span>One pass, multiple attractions. Coming soon.</span>
        </div>
        <span className="home-pass-icon">🎟️</span>
      </Link>

      {/* Games row — compact */}
      <h3 className="home-section-label">Games</h3>
      <div className="home-more-row">
        <Link to="/play" className="home-more-chip"><span>🗺️</span> Map Quiz</Link>
        <Link to="/trivia" className="home-more-chip"><span>🧠</span> Trivia</Link>
        <Link to="/crossword" className="home-more-chip"><span>✏️</span> Crossword</Link>
        <Link to="/adventure" className="home-more-chip"><span>🎭</span> Adventure</Link>
        <Link to="/puzzle" className="home-more-chip"><span>🧩</span> Puzzle</Link>
      </div>

      {/* List your business CTA */}
      <Link to="/list-your-business" className="home-explore-teaser">
        <div>
          <strong>Own a business?</strong>
          <span>List it on Feferity for free</span>
        </div>
        <ChevronRightRegular fontSize={18} />
      </Link>
    </section>
  )
}
