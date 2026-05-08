import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import { DISCOVERY_CATEGORIES, getPOIsByCategory } from '../data/discovery.js'
import { distanceTo, saveCheckIn, hasCheckedIn } from '../engine/exploration.js'
import { addXP } from '../engine/xp.js'
import SpinWheel from './SpinWheel.jsx'
import {
  LocationRegular, StarRegular, StarFilled, NavigationRegular,
  SearchRegular
} from '@fluentui/react-icons'

// Star rating renderer
function Stars({ rating }) {
  return (
    <span className="disc-stars">
      {[1, 2, 3, 4, 5].map(i => (
        i <= Math.round(rating)
          ? <StarFilled key={i} fontSize={13} style={{ color: '#fbbf24' }} />
          : <StarRegular key={i} fontSize={13} style={{ color: '#fbbf24' }} />
      ))}
      <span className="disc-rating-num">{rating.toFixed(1)}</span>
    </span>
  )
}

// Distance badge
function DistBadge({ userPos, poi }) {
  if (!userPos) return null
  const km = distanceTo(userPos.lat, userPos.lng, poi.lat, poi.lng)
  const label = km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`
  return <span className="disc-dist">{label} away</span>
}

// Check-in button
function CheckInBtn({ poi, userPos, onCheckedIn }) {
  const [status, setStatus] = useState(() => hasCheckedIn(poi.id) ? 'done' : 'idle')
  const [loading, setLoading] = useState(false)

  async function handleCheckIn() {
    setLoading(true)
    if (!userPos) {
      alert('Turn on location to check in here.')
      setLoading(false)
      return
    }
    const dist = distanceTo(userPos.lat, userPos.lng, poi.lat, poi.lng)
    if (dist > 0.2) {
      alert(`You need to be within 200m of ${poi.name} to check in. (You're ${Math.round(dist * 1000)}m away)`)
      setLoading(false)
      return
    }
    saveCheckIn(poi)
    addXP('CHECK_IN')
    setStatus('done')
    setLoading(false)
    onCheckedIn && onCheckedIn(poi)
  }

  if (status === 'done') return <span className="disc-checkin-done">✓ Checked In</span>
  return (
    <button className="disc-checkin-btn" onClick={handleCheckIn} disabled={loading}>
      {loading ? '...' : '📍 Check In (+50 XP)'}
    </button>
  )
}

// POI Card
function POICard({ poi, userPos, onCheckedIn }) {
  return (
    <div className={`disc-card ${poi.sponsored ? 'sponsored' : ''}`}>
      {poi.sponsored && <span className="disc-sponsored-badge">⭐ Featured</span>}
      <div className="disc-card-header">
        <span className="disc-cat-icon">
          {DISCOVERY_CATEGORIES.find(c => c.id === poi.category)?.icon || '📍'}
        </span>
        <div className="disc-card-info">
          <h3 className="disc-name">{poi.name}</h3>
          <div className="disc-meta">
            <span className="disc-area">
              <LocationRegular fontSize={12} /> {poi.area}
            </span>
            <Stars rating={poi.rating} />
            <DistBadge userPos={userPos} poi={poi} />
          </div>
        </div>
      </div>
      <p className="disc-desc">{poi.description}</p>
      <div className="disc-actions">
        <a
          href={poi.mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="disc-cta-btn"
        >
          <NavigationRegular fontSize={14} /> {poi.cta}
        </a>
        <CheckInBtn poi={poi} userPos={userPos} onCheckedIn={onCheckedIn} />
      </div>
    </div>
  )
}

// POI map marker icon
const poiIcon = (sponsored) => L.divIcon({
  className: '',
  html: `<div class="disc-map-pin ${sponsored ? 'sponsored' : ''}"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

export default function Discovery() {
  const location = useLocation()
  const [activeCategory, setActiveCategory] = useState(() => {
    const params = new URLSearchParams(location.search)
    return params.get('category') || 'all'
  })
  const [view, setView] = useState(() => {
    const params = new URLSearchParams(location.search)
    return params.get('view') || 'list'
  })
  const [search, setSearch] = useState('')
  const [userPos, setUserPos] = useState(null)
  const [checkInToast, setCheckInToast] = useState(null)
  const [sortBy, setSortBy] = useState('default')
  const [showWheel, setShowWheel] = useState(false)

  // Request user location
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {} // silently fail
      )
    }
  }, [])

  // Sync with URL parameters
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const cat = params.get('category')
    if (cat) setActiveCategory(cat)
    
    const v = params.get('view')
    if (v === 'map' || v === 'list') setView(v)
  }, [location.search])
  /* eslint-enable react-hooks/set-state-in-effect */

  function handleCheckedIn(poi) {
    setCheckInToast(poi)
    setTimeout(() => setCheckInToast(null), 3500)
  }

  // Filter POIs
  let pois = getPOIsByCategory(activeCategory)
  if (search.trim()) {
    const q = search.toLowerCase()
    pois = pois.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.area.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q)
    )
  }
  if (sortBy === 'rating') {
    pois = [...pois].sort((a, b) => b.rating - a.rating)
  } else if (sortBy === 'distance' && userPos) {
    pois = [...pois].sort((a, b) =>
      distanceTo(userPos.lat, userPos.lng, a.lat, a.lng) -
      distanceTo(userPos.lat, userPos.lng, b.lat, b.lng)
    )
  } else {
    // Sponsored first
    pois = [...pois].sort((a, b) => (b.sponsored ? 1 : 0) - (a.sponsored ? 1 : 0))
  }

  return (
    <section className="discovery">
      {showWheel && <SpinWheel onClose={() => setShowWheel(false)} />}
      {/* Check-in toast */}
      {checkInToast && (
        <div className="checkin-toast">
          <span>📍 Checked in at <strong>{checkInToast.name}</strong> · +50 XP!</span>
        </div>
      )}

      {/* Header */}
      <div className="disc-hero">
        <h1 className="disc-title">Discover Lagos</h1>
        <p className="disc-subtitle">Explore the best spots in your city</p>

        {/* Search */}
        <div className="disc-search-wrap">
          <SearchRegular fontSize={18} className="disc-search-icon" />
          <input
            className="disc-search"
            placeholder="Search places, areas..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* View toggle + Spin button */}
        <div className="disc-hero-actions">
          <div className="disc-view-toggle">
            <button className={`disc-view-btn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>☰ List</button>
            <button className={`disc-view-btn ${view === 'map' ? 'active' : ''}`} onClick={() => setView('map')}>🗺️ Map</button>
          </div>
          <button className="disc-spin-btn" onClick={() => setShowWheel(true)}>
            🎡 Spin the Wheel
          </button>
        </div>
      </div>

      {/* Category chips */}
      <div className="disc-cats">
        {DISCOVERY_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`disc-cat-chip ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Sort bar (list only) */}
      {view === 'list' && (
        <div className="disc-sort-bar">
          <span className="disc-count">{pois.length} places</span>
          <div className="disc-sort-btns">
            <button className={`disc-sort-btn ${sortBy === 'default' ? 'active' : ''}`} onClick={() => setSortBy('default')}>Featured</button>
            <button className={`disc-sort-btn ${sortBy === 'rating' ? 'active' : ''}`} onClick={() => setSortBy('rating')}>★ Rating</button>
            {userPos && <button className={`disc-sort-btn ${sortBy === 'distance' ? 'active' : ''}`} onClick={() => setSortBy('distance')}>📍 Nearby</button>}
          </div>
        </div>
      )}

      {/* Location notice */}
      {!userPos && (
        <div className="disc-location-notice">
          📶 Enable location for distance info &amp; check-ins
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {view === 'list' && (
        <div className="disc-list">
          {pois.length === 0 ? (
            <div className="disc-empty">No places found. Try a different search.</div>
          ) : (
            pois.map(poi => (
              <POICard key={poi.id} poi={poi} userPos={userPos} onCheckedIn={handleCheckedIn} />
            ))
          )}
        </div>
      )}

      {/* ── MAP VIEW ── */}
      {view === 'map' && (
        <div className="disc-map-wrap">
          <MapContainer
            center={[6.52, 3.40]}
            zoom={11}
            style={{ width: '100%', height: '100%' }}
            zoomControl={true}
            attributionControl={false}
          >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png" />
            {pois.map(poi => (
              <Marker key={poi.id} position={[poi.lat, poi.lng]} icon={poiIcon(poi.sponsored)}>
                <Popup className="disc-popup">
                  <strong>{poi.name}</strong>
                  <br />{poi.area} · ★ {poi.rating}
                  <br />
                  <a href={poi.mapUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>
                    {poi.cta} →
                  </a>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}
    </section>
  )
}
