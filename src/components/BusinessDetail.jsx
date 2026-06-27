import { useParams, useNavigate, Link } from 'react-router-dom'
import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'
import {
  ArrowLeftRegular, CallRegular, ShareRegular, HeartRegular,
  ChevronLeftRegular, ChevronRightRegular, OpenRegular, EditRegular,
  DismissRegular
} from '@fluentui/react-icons'

// ── Fullscreen Image Viewer ──
function FullscreenViewer({ images, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex || 0)
  const touchStartX = useRef(0)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setIdx(i => Math.max(0, i - 1))
      if (e.key === 'ArrowRight') setIdx(i => Math.min(images.length - 1, i + 1))
    }
    window.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKey)
    }
  }, [images.length, onClose])

  function handleTouchStart(e) { touchStartX.current = e.touches[0].clientX }
  function handleTouchEnd(e) {
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0) setIdx(i => Math.min(images.length - 1, i + 1))
      else setIdx(i => Math.max(0, i - 1))
    }
  }

  return (
    <div className="fs-viewer-overlay" onClick={onClose}
      onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <button className="fs-viewer-close" onClick={onClose}>
        <DismissRegular fontSize={24} />
      </button>
      <div className="fs-viewer-img-wrap" onClick={e => e.stopPropagation()}>
        <img src={images[idx]} alt={`Photo ${idx + 1}`}
          onError={e => { e.target.src = '/images/postcards/national-theatre.png' }} />
      </div>
      {images.length > 1 && (
        <>
          {idx > 0 && (
            <button className="fs-viewer-arrow fs-viewer-arrow-l"
              onClick={e => { e.stopPropagation(); setIdx(i => i - 1) }}>
              <ChevronLeftRegular fontSize={28} />
            </button>
          )}
          {idx < images.length - 1 && (
            <button className="fs-viewer-arrow fs-viewer-arrow-r"
              onClick={e => { e.stopPropagation(); setIdx(i => i + 1) }}>
              <ChevronRightRegular fontSize={28} />
            </button>
          )}
          <div className="fs-viewer-counter">{idx + 1} / {images.length}</div>
        </>
      )}
    </div>
  )
}

function PhotoGallery({ photos, name, onPhotoClick }) {
  const [idx, setIdx] = useState(0)
  const trackRef = useRef(null)
  const touchStartX = useRef(0)
  const images = photos?.length > 0 ? photos : ['/images/postcards/national-theatre.png']

  const goTo = useCallback((i) => {
    const clamped = Math.max(0, Math.min(i, images.length - 1))
    setIdx(clamped)
    if (trackRef.current) trackRef.current.style.transform = `translateX(-${clamped * 100}%)`
  }, [images.length])

  const prev = () => goTo(idx - 1)
  const next = () => goTo(idx + 1)

  function handleTouchStart(e) { touchStartX.current = e.touches[0].clientX }
  function handleTouchEnd(e) {
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev()
  }

  return (
    <div className="ld-gallery" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className="ld-gallery-track" ref={trackRef} style={{ transform: `translateX(-${idx * 100}%)` }}>
        {images.map((src, i) => (
          <div className="ld-gallery-slide" key={i} onClick={() => onPhotoClick && onPhotoClick(i)}
            style={{ cursor: 'pointer' }}>
            <img src={src} alt={`${name} photo ${i + 1}`}
              onError={e => { e.target.src = '/images/postcards/national-theatre.png' }} />
          </div>
        ))}
      </div>
      {images.length > 1 && (
        <>
          {idx > 0 && <button className="ld-gallery-arrow ld-gallery-arrow-left" onClick={prev}><ChevronLeftRegular fontSize={20} /></button>}
          {idx < images.length - 1 && <button className="ld-gallery-arrow ld-gallery-arrow-right" onClick={next}><ChevronRightRegular fontSize={20} /></button>}
          <div className="ld-gallery-dots">
            {images.map((_, i) => <button key={i} className={`ld-gallery-dot${i === idx ? ' active' : ''}`} onClick={() => goTo(i)} />)}
          </div>
          <span className="ld-gallery-counter">{idx + 1} / {images.length}</span>
        </>
      )}
    </div>
  )
}

function formatWhatsApp(number) {
  if (!number) return ''
  let digits = number.replace(/\D/g, '')
  if (digits.startsWith('0')) digits = '234' + digits.slice(1)
  else if (!digits.startsWith('234')) digits = '234' + digits
  return digits
}

export default function BusinessDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [fullscreenIdx, setFullscreenIdx] = useState(null) // null = closed, number = open at index

  // Get current user for owner detection
  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserId(session?.user?.id || null)
    })
  }, [])

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError(null)
      try {
        if (!supabase) throw new Error('Service unavailable.')
        const { data, error: fetchErr } = await supabase
          .from('business_listings')
          .select('*')
          .eq('id', id)
          .single()
        if (fetchErr) throw fetchErr
        // Parse arrays
        if (data.photos && typeof data.photos === 'string') {
          try { data.photos = JSON.parse(data.photos) } catch {}
        }
        if (data.products && typeof data.products === 'string') {
          try { data.products = JSON.parse(data.products) } catch {}
        }
        if (data.service_areas && typeof data.service_areas === 'string') {
          try { data.service_areas = JSON.parse(data.service_areas) } catch {}
        }
        setListing(data)
      } catch (err) {
        setError(err.message || 'Failed to load business.')
      }
      setLoading(false)
    }
    load()
  }, [id])

  function handleShare() {
    if (navigator.share && listing) {
      navigator.share({ title: listing.name, text: listing.description || '', url: window.location.href })
    } else {
      navigator.clipboard?.writeText(window.location.href)
    }
  }

  if (loading) {
    return (
      <section className="ld-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <button className="ld-back" onClick={() => navigate(-1)}>← Back</button>
        <div style={{ animation: 'float 2s ease-in-out infinite', fontSize: '3rem' }}>🏪</div>
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading business details...</p>
      </section>
    )
  }

  if (error || !listing) {
    return (
      <section className="ld-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
        <button className="ld-back" onClick={() => navigate(-1)}>← Back</button>
        <div style={{ fontSize: '2.5rem' }}>😕</div>
        <p style={{ color: '#ef4444' }}>{error || 'Business not found.'}</p>
        <button onClick={() => navigate(-1)} className="btn btn-primary">Go Back</button>
      </section>
    )
  }

  const allPhotos = []
  if (listing.logo_url) allPhotos.push(listing.logo_url)
  if (Array.isArray(listing.photos)) allPhotos.push(...listing.photos)

  const isHandyman = listing.listing_type === 'handyman'
  const isOwner = currentUserId && listing.submitted_by && currentUserId === listing.submitted_by

  return (
    <section className="ld-page">
      {/* Fullscreen image viewer */}
      {fullscreenIdx !== null && allPhotos.length > 0 && (
        <FullscreenViewer
          images={allPhotos}
          startIndex={fullscreenIdx}
          onClose={() => setFullscreenIdx(null)}
        />
      )}

      {/* Photo gallery */}
      <div className="ld-hero">
        <PhotoGallery
          photos={allPhotos.length > 0 ? allPhotos : null}
          name={listing.name}
          onPhotoClick={(i) => setFullscreenIdx(i)}
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
            <span className="ld-category">
              {isHandyman ? `🔧 ${listing.trade || 'Handyman'}` : (listing.subcategory || listing.category)}
            </span>
            <h1 className="ld-name">{listing.name}</h1>
            <p className="ld-area">📍 {listing.area}{listing.address ? ` · ${listing.address}` : ''}</p>
          </div>
          {listing.logo_url && (
            <img src={listing.logo_url} alt="Logo" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }}
              onError={e => { e.target.style.display = 'none' }} />
          )}
        </div>

        {/* Owner edit button */}
        {isOwner && (
          <button
            className="bd-edit-btn"
            onClick={() => navigate(`/list-your-business/form?edit=${listing.id}`)}
          >
            <EditRegular fontSize={16} />
            Edit My Listing
          </button>
        )}

        {/* Quick info chips */}
        <div className="ld-chips">
          {listing.price_range && <span className="ld-chip">{listing.price_range}</span>}
          {listing.hours && <span className="ld-chip">🕐 {listing.hours}</span>}
          {isHandyman && listing.experience_years && <span className="ld-chip">🛠️ {listing.experience_years}+ years</span>}
          {listing.listing_type === 'business' && <span className="ld-chip">🏪 Business</span>}
          {isHandyman && <span className="ld-chip">🔧 Handyman</span>}
        </div>

        {/* Description */}
        {listing.description && <p className="ld-desc">{listing.description}</p>}

        {/* Products / Services */}
        {Array.isArray(listing.products) && listing.products.length > 0 && (
          <div style={{ margin: '1rem 0' }}>
            <h3 style={{ fontSize: '0.9rem', fontFamily: 'var(--font-head)', fontWeight: 700, marginBottom: '0.5rem' }}>
              {isHandyman ? 'Services Offered' : 'Products & Services'}
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {listing.products.map((p, i) => (
                <span key={i} className="ld-chip">{p}</span>
              ))}
            </div>
          </div>
        )}

        {/* Service areas (handyman) */}
        {isHandyman && Array.isArray(listing.service_areas) && listing.service_areas.length > 0 && (
          <div style={{ margin: '1rem 0' }}>
            <h3 style={{ fontSize: '0.9rem', fontFamily: 'var(--font-head)', fontWeight: 700, marginBottom: '0.5rem' }}>Areas Served</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {listing.service_areas.map((a, i) => (
                <span key={i} className="ld-chip">📍 {a}</span>
              ))}
            </div>
          </div>
        )}

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
            <a href={`https://wa.me/${formatWhatsApp(listing.whatsapp)}`} target="_blank" rel="noopener noreferrer" className="ld-cta-secondary">
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
      </div>
    </section>
  )
}
