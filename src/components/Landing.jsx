import { useState } from 'react'
import { Link } from 'react-router-dom'
import questions from '../data/questions.js'
import ABUJA_Q from '../data/questions-abuja.js'
import { SPONSORS } from '../data/sponsors.js'
import { SponsorCard } from './SponsoredBanner.jsx'
import { getXPData, getLevel, getLevelTitle } from '../engine/xp.js'

import {
  SearchRegular,
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
  DrinkWineRegular,
  CompassNorthwestRegular
} from '@fluentui/react-icons'

const DISCOVER_ITEMS = [
  { icon: <FoodPizzaRegular fontSize={22} />, label: 'Restaurants', tag: 'Food & Dining' },
  { icon: <BuildingRegular fontSize={22} />, label: 'Hotels', tag: 'Stay' },
  { icon: <UmbrellaRegular fontSize={22} />, label: 'Beaches', tag: 'Relax' },
  { icon: <LeafOneRegular fontSize={22} />, label: 'Parks', tag: 'Nature' },
  { icon: <BuildingBankRegular fontSize={22} />, label: 'Museums', tag: 'Culture' },
  { icon: <VehicleBusRegular fontSize={22} />, label: 'BRT Stops', tag: 'Transit' },
  { icon: <VideoClipRegular fontSize={22} />, label: 'Cinemas', tag: 'Movies' },
  { icon: <VehicleCarRegular fontSize={22} />, label: 'Cab Stands', tag: 'Rides' },
  { icon: <ShoppingBagRegular fontSize={22} />, label: 'Malls', tag: 'Shopping' },
  { icon: <MusicNote1Regular fontSize={22} />, label: 'Concerts', tag: 'Events' },
  { icon: <StoreMicrosoftRegular fontSize={22} />, label: 'Markets', tag: 'Local' },
  { icon: <HeartPulseRegular fontSize={22} />, label: 'Gyms', tag: 'Fitness' },
  { icon: <BuildingBankRegular fontSize={22} />, label: 'Banks', tag: 'Finance' },
  { icon: <Wifi1Regular fontSize={22} />, label: 'Free WiFi', tag: 'Internet' },
  { icon: <SportSoccerRegular fontSize={22} />, label: 'Stadiums', tag: 'Sports' },
  { icon: <DrinkWineRegular fontSize={22} />, label: 'Bars & Clubs', tag: 'Nightlife' },
]

export default function Landing() {
  const totalQ = questions.length + ABUJA_Q.length
  const xp = getXPData()
  const level = getLevel(xp.totalXP)
  const title = getLevelTitle(level)
  const playerName = localStorage.getItem('geoquiz_player') || ''
  const [searchQuery, setSearchQuery] = useState('')

  const filteredDiscover = searchQuery.trim()
    ? DISCOVER_ITEMS.filter(d =>
        d.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.tag.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : DISCOVER_ITEMS

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

      {/* Search Bar */}
      <div className="home-search">
        <div className="home-search-inner">
          <SearchRegular fontSize={20} className="home-search-icon" />
          <input
            type="text"
            placeholder="Search places, categories, people..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="home-search-input"
          />
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

      {/* City Discovery Cards */}
      <div className="discover-section">
        <h3 className="discover-title">Explore the City</h3>
        <div className="discover-grid">
          {filteredDiscover.map(d => (
            <div key={d.label} className="discover-card">
              <span className="discover-card-icon">{d.icon}</span>
              <span className="discover-card-label">{d.label}</span>
              <span className="discover-card-tag">{d.tag}</span>
            </div>
          ))}
        </div>
        {filteredDiscover.length === 0 && (
          <p className="discover-hint">No results for "{searchQuery}"</p>
        )}
        <p className="discover-hint">Coming soon — explore and discover places near you</p>
      </div>
    </section>
  )
}
