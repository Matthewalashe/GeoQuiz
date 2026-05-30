import { useParams, useNavigate, Link } from 'react-router-dom'
import { useState, useEffect, useRef, useCallback } from 'react'
import { getListings } from '../lib/cms.js'
import {
  ArrowLeftRegular, StarRegular, CallRegular,
  GlobeRegular, OpenRegular, ShareRegular, HeartRegular,
  ChevronLeftRegular, ChevronRightRegular
} from '@fluentui/react-icons'

function PhotoGallery({ photos, name }) {
  const [idx, setIdx] = useState(0)
  const trackRef = useRef(null)
  const touchStartX = useRef(0)

  const images = photos?.length > 0 ? photos : ['/images/postcards/national-theatre.png']

  const goTo = useCallback((i) => {
    const clamped = Math.max(0, Math.min(i, images.length - 1))
    setIdx(clamped)
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(-${clamped * 100}%)`
    }
  }, [images.length])

  const prev = () => goTo(idx - 1)
  const next = () => goTo(idx + 1)

  // Touch swipe support
  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX
  }
  function handleTouchEnd(e) {
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      diff > 0 ? next() : prev()
    }
  }

  return (
    <div className="ld-gallery" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="ld-gallery-track" ref={trackRef} style={{ transform: `translateX(-${idx * 100}%)` }}>
        {images.map((src, i) => (
          <div className="ld-gallery-slide" key={i}>
            <img
              src={src}
              alt={`${name} photo ${i + 1}`}
              onError={e => { e.target.src = '/images/postcards/national-theatre.png' }}
            />
          </div>
        ))}
      </div>

      {/* Arrows */}
      {images.length > 1 && (
        <>
          {idx > 0 && (
            <button className="ld-gallery-arrow ld-gallery-arrow-left" onClick={prev} aria-label="Previous photo">
              <ChevronLeftRegular fontSize={20} />
            </button>
          )}
          {idx < images.length - 1 && (
            <button className="ld-gallery-arrow ld-gallery-arrow-right" onClick={next} aria-label="Next photo">
              <ChevronRightRegular fontSize={20} />
            </button>
          )}
        </>
      )}

      {/* Dots */}
      {images.length > 1 && (
        <div className="ld-gallery-dots">
          {images.map((_, i) => (
            <button
              key={i}
              className={`ld-gallery-dot${i === idx ? ' active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Photo ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Counter badge */}
      {images.length > 1 && (
        <span className="ld-gallery-counter">{idx + 1} / {images.length}</span>
      )}
    </div>
  )
}

export default function ListingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)

  function loadListings() {
    setLoading(true)
    setFetchError(null)
    getListings()
      .then(({ data, error }) => {
        if (error) setFetchError(error)
        setListings(data || [])
        setLoading(false)
      })
      .catch(err => {
        setFetchError(err.message || 'Failed to load listing.')
        setLoading(false)
      })
  }

  useEffect(() => { loadListings() }, [])

  const listing = listings.find(l => l.id === id)

  const similar = listings
    .filter(l => listing && l.category === listing.category && l.id !== listing.id)
    .slice(0, 3)

  function handleShare() {
    if (navigator.share && listing) {
      navigator.share({ title: listing.name, text: listing.description, url: window.location.href })
    } else {
      navigator.clipboard?.writeText(window.location.href)
    }
  }

  // #40 — Track WhatsApp / Call taps
  function trackContact(type) {
    try {
      const evt = { listing_id: listing?.id, listing_name: listing?.name, type, timestamp: Date.now() }
      const events = JSON.parse(localStorage.getItem('wanda_contact_events') || '[]')
      events.push(evt)
      localStorage.setItem('wanda_contact_events', JSON.stringify(events))
      // If analytics is available
      if (typeof gtag === 'function') gtag('event', `${type}_tap`, { listing_id: listing?.id, listing_name: listing?.name })
    } catch (e) { /* silent */ }
  }

  // #41 — Category to game type mapping
  const CATEGORY_TO_GAME = {
    attraction: { path: '/trivia', label: 'Heritage Quiz', emoji: '🎮' },
    culture: { path: '/trivia', label: 'Culture Quiz', emoji: '🎮' },
    restaurant: { path: '/word', label: 'Food Word Game', emoji: '🔤' },
    experience: { path: '/trivia', label: 'Experience Quiz', emoji: '🎮' },
    hotel: { path: '/postcards', label: 'Landmark Quiz', emoji: '📷' },
    park: { path: '/trivia', label: 'Nature Quiz', emoji: '🌿' },
    nightlife: { path: '/trivia', label: 'Lagos Nightlife Quiz', emoji: '🎮' },
    shopping: { path: '/word', label: 'Market Word Game', emoji: '🔤' },
  }
  const gameLink = listing ? CATEGORY_TO_GAME[listing.category] : null

  if (loading) {
    return (
      <section className="ld-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <button className="ld-back" onClick={() => navigate('/explore')}>← Back</button>
        <div className="loading-icon" style={{ animation: 'float 2s ease-in-out infinite', fontSize: '3rem' }}>🧭</div>
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading place details...</p>
      </section>
    )
  }

  if (fetchError) {
    return (
      <section className="ld-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
        <button className="ld-back" onClick={() => navigate('/explore')}>← Back</button>
        <div style={{ fontSize: '2.5rem' }}>⚠️</div>
        <p style={{ color: '#ef4444', fontSize: '0.95rem', textAlign: 'center' }}>{fetchError}</p>
        <button onClick={loadListings} style={{ padding: '0.6rem 1.5rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>Try Again</button>
      </section>
    )
  }

  if (!listing) {
    return (
      <section className="ld-page">
        <button className="ld-back" onClick={() => navigate('/explore')}>← Back</button>
        <div className="ex-empty"><span>😕</span><p>Place not found.</p></div>
      </section>
    )
  }

  return (
    <section className="ld-page">
      {/* Photo gallery */}
      <div className="ld-hero">
        <PhotoGallery photos={listing.photos} name={listing.name} />
        <div className="ld-hero-overlay">
          <button className="ld-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeftRegular fontSize={20} />
          </button>
          <div className="ld-hero-actions">
            <button className="ld-icon-btn" onClick={handleShare}><ShareRegular fontSize={18} /></button>
            <button className="ld-icon-btn"><HeartRegular fontSize={18} /></button>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="ld-content">
        <div className="ld-header">
          <div>
            <span className="ld-category">{listing.subcategory}</span>
            <h1 className="ld-name">{listing.name}</h1>
            <p className="ld-area">📍 {listing.area}, Lagos</p>
          </div>
          <div className="ld-rating-badge">
            <StarRegular fontSize={14} /> {listing.rating}
          </div>
        </div>

        {/* Quick info chips */}
        <div className="ld-chips">
          <span className="ld-chip">
            {listing.price_min 
              ? `From ₦${listing.price_min.toLocaleString()}${listing.price_max ? ` – ₦${listing.price_max.toLocaleString()}` : ''}`
              : 'Free Entry'}
          </span>
          <span className="ld-chip">🕐 {listing.hours}</span>
          {listing.tags?.slice(0, 3).map(t => (
            <span key={t} className="ld-chip">#{t}</span>
          ))}
        </div>

        {/* Description */}
        <p className="ld-desc">{listing.description}</p>

        {/* CTA buttons */}
        <div className="ld-cta-row">
          {listing.website && (
            <a href={listing.website} target="_blank" rel="noopener noreferrer" className="ld-cta-primary">
              <OpenRegular fontSize={16} /> Visit Website
            </a>
          )}
          {listing.phone && (
            <a href={`tel:${listing.phone}`} className="ld-cta-secondary" onClick={() => trackContact('call')}>
              <CallRegular fontSize={16} /> Call
            </a>
          )}
          {listing.whatsapp && (
            <a href={`https://wa.me/${listing.whatsapp.replace(/^0/,'234')}`} target="_blank" rel="noopener noreferrer" className="ld-cta-secondary" onClick={() => trackContact('whatsapp')}>
              💬 WhatsApp
            </a>
          )}
        </div>

        {/* #41 — Play quiz about this place */}
        {gameLink && (
          <Link to={gameLink.path} className="ld-quiz-prompt">
            <span className="ld-quiz-emoji">{gameLink.emoji}</span>
            <div className="ld-quiz-text">
              <strong>Test your knowledge — play the {gameLink.label}</strong>
              <span>+150 pts</span>
            </div>
            <span className="ld-quiz-arrow">→</span>
          </Link>
        )}

        {/* Contact info */}
        <div className="ld-contact-grid">
          {listing.phone && <div className="ld-contact-item"><strong>Phone</strong><span>{listing.phone}</span></div>}
          {listing.instagram && <div className="ld-contact-item"><strong>Instagram</strong><a href={`https://instagram.com/${listing.instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer">{listing.instagram}</a></div>}
          {listing.website && <div className="ld-contact-item"><strong>Website</strong><a href={listing.website} target="_blank" rel="noopener noreferrer">{listing.website.replace('https://','')}</a></div>}
        </div>

        {/* Map */}
        {listing.lat && listing.lng && (
          <div className="ld-map-section">
            <h3>Location</h3>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${listing.lat},${listing.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ld-map-link"
            >
              <GlobeRegular fontSize={16} /> Open in Google Maps →
            </a>
          </div>
        )}

        {/* Similar */}
        {similar.length > 0 && (
          <div className="ld-similar">
            <h3>Similar places</h3>
            <div className="ld-similar-row">
              {similar.map(s => (
                <Link key={s.id} to={`/explore/${s.id}`} className="ld-similar-card">
                  <img src={s.photos?.[0] || '/images/postcards/national-theatre.png'} alt={s.name}
                    onError={e => { e.target.src = '/images/postcards/national-theatre.png' }} />
                  <strong>{s.name}</strong>
                  <span>{s.area}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

