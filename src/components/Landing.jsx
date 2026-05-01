import { Link } from 'react-router-dom'
import questions from '../data/questions.js'
import ABUJA_Q from '../data/questions-abuja.js'
import { SPONSORS } from '../data/sponsors.js'
import { SponsorCard } from './SponsoredBanner.jsx'
import { getXPData, getLevel, getLevelTitle } from '../engine/xp.js'

// Import Microsoft Fluent Icons
import { 
  PlayCircleRegular, 
  OptionsRegular, 
  ChatMultipleRegular,
  FoodPizzaRegular,
  BuildingRegular,
  UmbrellaRegular,
  LeafOneRegular,
  BuildingBankRegular,
  VehicleBusRegular,
  VideoClipRegular,
  VehicleCarRegular,
  ShoppingBagRegular,
  MusicNote1Regular,
  StoreMicrosoftRegular,
  HeartPulseRegular,
  Wifi1Regular,
  SportSoccerRegular,
  DrinkWineRegular
} from '@fluentui/react-icons'

export default function Landing() {
  const totalQ = questions.length + ABUJA_Q.length
  const xp = getXPData()
  const level = getLevel(xp.totalXP)
  const title = getLevelTitle(level)
  const playerName = localStorage.getItem('geoquiz_player') || ''

  return (
    <section className="landing">
      {/* Hero — Clean Material Design */}
      <div className="landing-hero" style={{ borderBottom: 'none' }}>
        <h1>
          <span className="hero-sub" style={{ fontWeight: 400 }}>How well do you know</span>
          <span className="hero-main" style={{ color: 'var(--primary)' }}>Nigeria?</span>
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
        <Link to="/play?mode=quick" className="qp-card card">
          <div className="qp-icon">
            <PlayCircleRegular fontSize={28} />
          </div>
          <div className="qp-info">
            <div className="qp-title">Quick Play</div>
            <div className="qp-desc">10 random questions</div>
          </div>
        </Link>
        <Link to="/play" className="qp-card card">
          <div className="qp-icon">
            <OptionsRegular fontSize={28} />
          </div>
          <div className="qp-info">
            <div className="qp-title">Custom Game</div>
            <div className="qp-desc">Pick categories & difficulty</div>
          </div>
        </Link>
        <Link to="/community" className="qp-card card">
          <div className="qp-icon">
            <ChatMultipleRegular fontSize={28} />
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

      {/* City Discovery Cards */}
      <div className="discover-section">
        <h3 className="discover-title">Explore the City</h3>
        <div className="discover-grid">
          {[
            { icon: <FoodPizzaRegular fontSize={24} />, label: 'Restaurants', tag: 'Food & Dining' },
            { icon: <BuildingRegular fontSize={24} />, label: 'Hotels', tag: 'Stay' },
            { icon: <UmbrellaRegular fontSize={24} />, label: 'Beaches', tag: 'Relax' },
            { icon: <LeafOneRegular fontSize={24} />, label: 'Parks', tag: 'Nature' },
            { icon: <BuildingBankRegular fontSize={24} />, label: 'Museums', tag: 'Culture' },
            { icon: <VehicleBusRegular fontSize={24} />, label: 'BRT Stops', tag: 'Transit' },
            { icon: <VideoClipRegular fontSize={24} />, label: 'Cinemas', tag: 'Movies' },
            { icon: <VehicleCarRegular fontSize={24} />, label: 'Cab Stands', tag: 'Rides' },
            { icon: <ShoppingBagRegular fontSize={24} />, label: 'Malls', tag: 'Shopping' },
            { icon: <MusicNote1Regular fontSize={24} />, label: 'Concerts', tag: 'Events' },
            { icon: <StoreMicrosoftRegular fontSize={24} />, label: 'Markets', tag: 'Local' },
            { icon: <HeartPulseRegular fontSize={24} />, label: 'Gyms', tag: 'Fitness' },
            { icon: <BuildingBankRegular fontSize={24} />, label: 'Banks', tag: 'Finance' },
            { icon: <Wifi1Regular fontSize={24} />, label: 'Free WiFi', tag: 'Internet' },
            { icon: <SportSoccerRegular fontSize={24} />, label: 'Stadiums', tag: 'Sports' },
            { icon: <DrinkWineRegular fontSize={24} />, label: 'Bars & Clubs', tag: 'Nightlife' },
          ].map(d => (
            <div key={d.label} className="discover-card card" style={{ padding: '0.75rem 0.5rem', border: 'none' }}>
              <span className="discover-card-icon" style={{ color: 'var(--primary)' }}>{d.icon}</span>
              <span className="discover-card-label" style={{ marginTop: '0.5rem', fontWeight: 600 }}>{d.label}</span>
              <span className="discover-card-tag">{d.tag}</span>
            </div>
          ))}
        </div>
        <p className="discover-hint">Coming soon — explore and discover places near you</p>
      </div>
    </section>
  )
}
