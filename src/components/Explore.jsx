import { useState, useMemo, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet'
import { CATEGORIES, PRICE_LABELS } from '../data/listings.jsx'
import { getListings } from '../lib/cms.js'
import { SearchRegular, MapRegular, ListRegular, StarRegular, VehicleBusRegular, VehicleSubwayRegular } from '@fluentui/react-icons'
import TransitLayers from './TransitLayers.jsx'

function StarRating({ rating = 0 }) {
  const stars = []
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) stars.push(<svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="var(--primary)" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>)
    else if (rating >= i - 0.5) stars.push(<svg key={i} width="14" height="14" viewBox="0 0 24 24"><defs><linearGradient id={`half${i}`}><stop offset="50%" stopColor="var(--primary)"/><stop offset="50%" stopColor="var(--border)"/></linearGradient></defs><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={`url(#half${i})`}/></svg>)
    else stars.push(<svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="var(--border)" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>)
  }
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '1px' }}>{stars}</span>
}

const LAGOS_CENTER = [6.52, 3.40]

export default function Explore() {
  const [params] = useSearchParams()
  const initCat = params.get('category') || 'all'
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState(initCat)
  const [view, setView] = useState('list') // 'list' | 'map'
  const [showBRT, setShowBRT] = useState(true)
  const [showRail, setShowRail] = useState(true)
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getListings()
      .then(data => {
        setListings(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    let results = listings
    if (category !== 'all') results = results.filter(l => l.category === category)
    if (search.trim()) {
      const q = search.toLowerCase()
      results = results.filter(l =>
        l.name.toLowerCase().includes(q) ||
        l.area.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.subcategory?.toLowerCase().includes(q) ||
        l.category?.toLowerCase().includes(q) ||
        l.tags?.some(t => t.includes(q))
      )
    }
    return results
  }, [listings, search, category])

  return (
    <section className="ex-page">
      {/* Search */}
      <div className="ex-search-bar">
        <SearchRegular fontSize={18} className="ex-search-icon" />
        <input
          className="ex-search-input"
          type="text"
          placeholder="Search places, food, experiences..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button
          className="ex-view-toggle"
          onClick={() => setView(v => v === 'list' ? 'map' : 'list')}
          title={view === 'list' ? 'Map view' : 'List view'}
        >
          {view === 'list' ? <MapRegular fontSize={18} /> : <ListRegular fontSize={18} />}
        </button>
      </div>

      {/* Category chips */}
      <div className="ex-cats">
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            className={`ex-cat-chip${category === c.id ? ' active' : ''}`}
            onClick={() => setCategory(c.id)}
          >
            <span>{c.icon}</span> {c.label}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div className="ex-results-meta">
        <span>{filtered.length} {filtered.length === 1 ? 'place' : 'places'}</span>
        {category !== 'all' && (
          <button className="ex-clear" onClick={() => setCategory('all')}>Clear filter</button>
        )}
      </div>

      {loading ? (
        <div className="ex-empty" style={{ minHeight: '40vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="loading-icon" style={{ animation: 'float 2s ease-in-out infinite', fontSize: '3rem' }}>🧭</div>
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading places...</p>
        </div>
      ) : (
        <>
          {/* MAP VIEW */}
          {view === 'map' && (
            <div className="ex-map-wrap">
              {/* Transit toggle chips */}
              <div className="ex-transit-toggles">
                <button
                  className={`ex-transit-chip${showBRT ? ' active' : ''}`}
                  onClick={() => setShowBRT(v => !v)}
                >
                  <VehicleBusRegular fontSize={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> BRT
                </button>
                <button
                  className={`ex-transit-chip${showRail ? ' active' : ''}`}
                  onClick={() => setShowRail(v => !v)}
                >
                  <VehicleSubwayRegular fontSize={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Rail
                </button>
              </div>
              <MapContainer center={LAGOS_CENTER} zoom={11} style={{ width: '100%', height: '100%' }} zoomControl={true} attributionControl={false}>
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  attribution="&copy; CartoDB &copy; OpenStreetMap"
                />
                <TransitLayers showBRT={showBRT} showRail={showRail} />
                {/* Listing markers */}
                {filtered.map(l => {
                  if (!l.lat || !l.lng || isNaN(l.lat) || isNaN(l.lng)) return null
                  return (
                    <CircleMarker
                      key={l.id}
                      center={[l.lat, l.lng]}
                      radius={6}
                      pathOptions={{ color: '#C8963E', weight: 2, fillColor: '#C8963E', fillOpacity: 0.8 }}
                    >
                      <Tooltip direction="top" offset={[0, -6]}>
                        <strong>{l.name}</strong><br />{l.subcategory} · <StarRegular fontSize={12} /> {l.rating}
                      </Tooltip>
                    </CircleMarker>
                  )
                })}
              </MapContainer>
            </div>
          )}

          {/* LIST VIEW */}
          {view === 'list' && (
            <div className="ex-grid">
              {filtered.map(listing => (
                <Link key={listing.id} to={`/explore/${listing.id}`} className="ex-card">
                  <div className="ex-card-img">
                    <img
                      src={listing.photos?.[0] || '/images/postcards/national-theatre.png'}
                      alt={listing.name}
                      loading="lazy"
                      onError={e => { e.target.src = '/images/postcards/national-theatre.png' }}
                    />
                    <span className="ex-card-price">
                      {listing.price_min ? `From ₦${listing.price_min.toLocaleString()}` : 'Free Entry'}
                    </span>
                    {listing.is_wanda_pick && (
                      <span className="ex-wanda-pick">✦ Wanda Pick</span>
                    )}
                  </div>
                  <div className="ex-card-body">
                    <h3 className="ex-card-name">{listing.name}</h3>
                    <p className="ex-card-sub">{listing.subcategory} · {listing.area}</p>
                    <div className="ex-card-meta">
                      <span className="ex-card-rating">
                        <StarRating rating={listing.rating} /> ({listing.reviewCount || Math.floor(listing.rating * 6)})
                      </span>
                      <span className="ex-card-hours">{listing.hours?.split(',')[0]}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {filtered.length === 0 && (
            <div className="ex-empty">
              <span style={{ color: '#aaa' }}><SearchRegular fontSize={40} /></span>
              <p>No places found. Try a different search or category.</p>
            </div>
          )}
        </>
      )}
    </section>
  )
}
