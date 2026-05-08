import { useState, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { LISTINGS, CATEGORIES, PRICE_LABELS } from '../data/listings.js'
import { SearchRegular, MapRegular, ListRegular, StarRegular } from '@fluentui/react-icons'

export default function Explore() {
  const [params] = useSearchParams()
  const initCat = params.get('category') || 'all'
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState(initCat)
  const [view, setView] = useState('list') // 'list' | 'map'

  const filtered = useMemo(() => {
    let results = LISTINGS
    if (category !== 'all') results = results.filter(l => l.category === category)
    if (search.trim()) {
      const q = search.toLowerCase()
      results = results.filter(l =>
        l.name.toLowerCase().includes(q) ||
        l.area.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.tags?.some(t => t.includes(q))
      )
    }
    return results
  }, [search, category])

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

      {/* Listing cards */}
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
              <span className="ex-card-price">{listing.priceRange}</span>
            </div>
            <div className="ex-card-body">
              <h3 className="ex-card-name">{listing.name}</h3>
              <p className="ex-card-sub">{listing.subcategory} · {listing.area}</p>
              <div className="ex-card-meta">
                <span className="ex-card-rating">
                  <StarRegular fontSize={13} /> {listing.rating}
                </span>
                <span className="ex-card-hours">{listing.hours?.split(',')[0]}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="ex-empty">
          <span>🔍</span>
          <p>No places found. Try a different search or category.</p>
        </div>
      )}
    </section>
  )
}
