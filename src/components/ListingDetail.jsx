import { useParams, useNavigate, Link } from 'react-router-dom'
import { LISTINGS } from '../data/listings.jsx'
import {
  ArrowLeftRegular, StarRegular, CallRegular,
  GlobeRegular, OpenRegular, ShareRegular, HeartRegular
} from '@fluentui/react-icons'

export default function ListingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const listing = LISTINGS.find(l => l.id === id)

  if (!listing) {
    return (
      <section className="ld-page">
        <button className="ld-back" onClick={() => navigate('/explore')}>← Back</button>
        <div className="ex-empty"><span>😕</span><p>Place not found.</p></div>
      </section>
    )
  }

  const similar = LISTINGS
    .filter(l => l.category === listing.category && l.id !== listing.id)
    .slice(0, 3)

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: listing.name, text: listing.description, url: window.location.href })
    } else {
      navigator.clipboard?.writeText(window.location.href)
    }
  }

  return (
    <section className="ld-page">
      {/* Hero image */}
      <div className="ld-hero">
        <img
          src={listing.photos?.[0] || '/images/postcards/national-theatre.png'}
          alt={listing.name}
          onError={e => { e.target.src = '/images/postcards/national-theatre.png' }}
        />
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
          <span className="ld-chip">{listing.priceRange}</span>
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
            <a href={`tel:${listing.phone}`} className="ld-cta-secondary">
              <CallRegular fontSize={16} /> Call
            </a>
          )}
          {listing.whatsapp && (
            <a href={`https://wa.me/${listing.whatsapp.replace(/^0/,'234')}`} target="_blank" rel="noopener noreferrer" className="ld-cta-secondary">
              💬 WhatsApp
            </a>
          )}
        </div>

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
