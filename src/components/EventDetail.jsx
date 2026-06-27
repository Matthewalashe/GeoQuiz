import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { uploadFile } from '../lib/cms.js'
import {
  CalendarRegular, LocationRegular, PeopleRegular, ShareRegular,
  CopyRegular, CheckmarkCircleRegular, ArrowLeftRegular,
  VideoRegular, MoneyRegular, PersonRegular, ImageRegular
} from '@fluentui/react-icons'

function currencySymbol(c) {
  return c === 'USD' ? '$' : c === 'GBP' ? '£' : c === 'EUR' ? '€' : '₦'
}

function formatPrice(event) {
  const p = Number(event?.price)
  if (!p || isNaN(p)) return 'Contact organizer'
  return `${currencySymbol(event.currency)}${p.toLocaleString()}`
}

function timeUntil(dateStr) {
  const diff = new Date(dateStr) - new Date()
  if (diff <= 0) return 'Event started'
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} to go`
  return `${hours} hour${hours > 1 ? 's' : ''} to go`
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

export default function EventDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [rsvp, setRsvp] = useState(null)
  const [rsvps, setRsvps] = useState([])
  const [guestForm, setGuestForm] = useState({ name: '', phone: '', email: '' })
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [toast, setToast] = useState(null)
  const [organizer, setOrganizer] = useState(null)
  const [showImageOverlay, setShowImageOverlay] = useState(false)
  const imageInputRef = useRef(null)

  useEffect(() => {
    supabase?.auth.getSession().then(({ data }) => {
      setSession(data?.session)
      if (data?.session?.user?.id) {
        supabase.from('profiles').select('*').eq('id', data.session.user.id).single()
          .then(({ data: p }) => setProfile(p))
      }
      // Load event AFTER session is resolved so we can match RSVP
      loadEvent(data?.session?.user?.id)
    })
  }, [slug])

  // Auto-dismiss toast notifications
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500)
      return () => clearTimeout(t)
    }
  }, [toast])

  async function loadEvent(userId) {
    setLoading(true)
    try {
      const { data, error } = await supabase.from('events').select('*').eq('slug', slug).single()
      if (error) throw error
      setEvent(data)
      // Load organizer profile
      if (data.organizer_id) {
        supabase.from('profiles').select('id,username,full_name,avatar_url').eq('id', data.organizer_id).single()
          .then(({ data: org }) => { if (org) setOrganizer(org) })
          .catch(() => {})
      }
      // Load RSVPs with profile data
      const { data: rsvpData } = await supabase.from('event_rsvps')
        .select('*, profiles:user_id(username,full_name,avatar_url)').eq('event_id', data.id)
      setRsvps(rsvpData || [])
      // Check if current user already RSVPd — use passed userId (guaranteed available)
      const uid = userId || session?.user?.id
      if (uid) {
        const myRsvp = (rsvpData || []).find(r => r.user_id === uid)
        if (myRsvp) setRsvp(myRsvp)
      }
    } catch (e) {
      console.warn('Load event:', e.message)
    }
    setLoading(false)
  }

  async function handleRsvp(status) {
    setSubmitting(true)
    try {
      if (session?.user?.id) {
        // Logged-in RSVP
        const { data, error } = await supabase.from('event_rsvps').upsert({
          event_id: event.id, user_id: session.user.id, status, updated_at: new Date().toISOString(),
        }, { onConflict: 'event_id,user_id' }).select().single()
        if (error) throw error
        setRsvp(data)
        setToast(status === 'interested' ? "You're in! 🎉" : status === 'maybe' ? 'Saved as maybe' : 'RSVP updated')
      } else {
        // Guest RSVP — need name
        if (!guestForm.name.trim()) {
          setToast('Please enter your name')
          setSubmitting(false)
          return
        }
        const { error } = await supabase.from('event_rsvps').insert({
          event_id: event.id, guest_name: guestForm.name.trim(),
          guest_phone: guestForm.phone.trim() || null,
          guest_email: guestForm.email.trim() || null, status,
        })
        if (error) throw error
        setRsvp({ status })
        setToast("You're in! Create an account for the full experience.")
      }
      loadEvent() // refresh counts
    } catch (e) {
      setToast(e.message)
    }
    setSubmitting(false)
  }

  async function markPaid() {
    if (!rsvp?.id) return
    setSubmitting(true)
    try {
      const { error } = await supabase.from('event_rsvps').update({
        has_paid: true, paid_at: new Date().toISOString()
      }).eq('id', rsvp.id)
      if (error) throw error
      setRsvp(p => ({ ...p, has_paid: true }))
      setToast("Marked as paid! Organizer will confirm.")
      loadEvent()
    } catch (e) { setToast(e.message) }
    setSubmitting(false)
  }

  function copyReminder() {
    if (!event) return
    const confirmed = rsvps.filter(r => r.status === 'interested').length
    const total = event.max_capacity || '∞'
    const paid = rsvps.filter(r => r.has_paid).length
    const raised = paid * (event.price || 0)
    const target = (event.max_capacity || confirmed) * (event.price || 0)
    const countdown = timeUntil(event.start_date)
    const url = `https://visitnaija.online/pass/${event.slug}`
    const emoji = event.category === 'Hangout' ? '🏖️' : event.category === 'Party' ? '🎉' : event.category === 'Concert' ? '🎵' : '🔥'
    const spotsLeft = event.max_capacity ? event.max_capacity - confirmed : null
    let msg = `${emoji} ${event.title}\n⏰ ${countdown}\n👥 ${confirmed}/${total} spots filled`
    if (spotsLeft !== null && spotsLeft <= 10 && spotsLeft > 0) msg += ` — Only ${spotsLeft} left! 🔥`
    if (!event.is_free) msg += `\n💰 ${formatPrice(event)} per person`
    msg += `\n\n🚀 Don't miss out! RSVP now:\n${url}`
    navigator.clipboard?.writeText(msg)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function shareEvent() {
    const url = `https://visitnaija.online/pass/${event.slug}`
    const dateStr = event.start_date ? new Date(event.start_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }) : ''
    const venueStr = event.venue_name || (event.venue_type === 'virtual' ? 'Online' : '')
    const priceStr = event.is_free ? 'FREE 🎉' : formatPrice(event)
    const emoji = event.category === 'Hangout' ? '🏖️' : event.category === 'Party' ? '🎉' : event.category === 'Concert' ? '🎵' : event.category === 'Workshop' ? '📚' : '🔥'
    const text = `${emoji} You're invited!\n\n${event.title}\n📅 ${dateStr}${venueStr ? ` • 📍 ${venueStr}` : ''}\n💰 ${priceStr}\n👥 ${interested.length} already going\n\nRSVP now 👇`
    if (navigator.share) {
      navigator.share({ title: event.title, text, url })
    } else {
      navigator.clipboard?.writeText(`${text}\n${url}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const isOrganizer = session?.user?.id && event?.organizer_id === session.user.id
  const interested = rsvps.filter(r => r.status === 'interested')
  const maybes = rsvps.filter(r => r.status === 'maybe')
  const paidCount = rsvps.filter(r => r.has_paid).length
  const raisedAmount = paidCount * (event?.price || 0)
  const isFull = event?.max_capacity && interested.length >= event.max_capacity

  if (loading) return (
    <div className="ed-loading">
      <div className="ed-spinner" />
      <p>Loading event...</p>
    </div>
  )

  if (!event) return (
    <div className="ed-loading">
      <h2>Event not found</h2>
      <p>This event may have been removed or the link is incorrect.</p>
      <Link to="/pass" className="btn btn-primary">Browse Events</Link>
    </div>
  )

  return (
    <div className="ed-wrapper">
      {/* Hero Banner */}
      <div className="ed-hero" style={event.image_url ? { backgroundImage: `url(${event.image_url})` } : {}} onClick={() => event.image_url && setShowImageOverlay(true)}>
        <div className="ed-hero-overlay">
          <button className="ed-back" onClick={(e) => { e.stopPropagation(); navigate('/pass') }}><ArrowLeftRegular fontSize={20} /></button>
          <div className="ed-hero-content">
            <span className="ed-category-badge">{event.category}</span>
            <h1 className="ed-title">{event.title}</h1>
            <div className="ed-countdown">{timeUntil(event.start_date)}</div>
          </div>
        </div>
      </div>

      <div className="ed-body">
        {/* Stats Bar */}
        <div className="ed-stats-bar">
          <div className="ed-stat">
            <strong>{interested.length}</strong>
            <span>{event.max_capacity ? `/ ${event.max_capacity}` : ''} Going</span>
          </div>
          <div className="ed-stat">
            <strong>{maybes.length}</strong>
            <span>Maybe</span>
          </div>
          {!event.is_free && (
            <div className="ed-stat">
              <strong>₦{raisedAmount.toLocaleString()}</strong>
              <span>Raised</span>
            </div>
          )}
        </div>

        {/* Payment progress bar */}
        {!event.is_free && event.max_capacity && (
          <div className="ed-progress-section">
            <div className="ed-progress-bar">
              <div className="ed-progress-fill" style={{
                width: `${Math.min(100, (raisedAmount / (event.max_capacity * event.price)) * 100)}%`
              }} />
            </div>
            <span className="ed-progress-label">
              ₦{raisedAmount.toLocaleString()} / ₦{(event.max_capacity * event.price).toLocaleString()} target
            </span>
          </div>
        )}

        {/* Details */}
        <div className="ed-details">
          <div className="ed-detail-row">
            <CalendarRegular fontSize={18} />
            <div>
              <strong>{formatDate(event.start_date)}</strong>
              {event.end_date && <span> — {formatDate(event.end_date)}</span>}
              {event.start_time && <div className="ed-detail-sub">{event.start_time}{event.end_time ? ` — ${event.end_time}` : ''}</div>}
            </div>
          </div>

          {(event.venue_type === 'physical' || event.venue_type === 'both') && event.venue_name && (
            <div className="ed-detail-row">
              <LocationRegular fontSize={18} />
              <div>
                <strong>{event.venue_name}</strong>
                {event.venue_address && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue_address + (event.venue_name ? ', ' + event.venue_name : ''))}`}
                    target="_blank" rel="noopener noreferrer" className="ed-map-link"
                  >
                    📍 {event.venue_address} → Open Map
                  </a>
                )}
              </div>
            </div>
          )}

          {(event.venue_type === 'virtual' || event.venue_type === 'both') && event.meeting_link && (
            <div className="ed-detail-row">
              <VideoRegular fontSize={18} />
              <div>
                <strong>Virtual Event</strong>
                <a href={event.meeting_link} target="_blank" rel="noopener noreferrer" className="ed-meeting-link">
                  Join Meeting →
                </a>
              </div>
            </div>
          )}

          {!event.is_free && (
            <div className="ed-detail-row">
              <MoneyRegular fontSize={18} />
              <div>
                <strong>{formatPrice(event)}</strong>
                {event.payment_link && (
                  <a href={event.payment_link} target="_blank" rel="noopener noreferrer" className="ed-payment-link">
                    Payment Details →
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {event.description && <div className="ed-description"><p>{event.description}</p></div>}

        {/* Organizer Info */}
        {(organizer || event.organizer_name) && (
          <div className="ed-organizer-card">
            <div className="ed-org-avatar">
              {event.organizer_logo_url
                ? <img src={event.organizer_logo_url} alt="" style={{ width: 44, height: 44, borderRadius: '12px', objectFit: 'contain', background: '#fff', padding: 2 }} />
                : organizer?.avatar_url
                  ? <img src={organizer.avatar_url} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                  : <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: 'var(--primary)', fontWeight: 700 }}>{(event.organizer_name || organizer?.full_name || organizer?.username || 'O')[0].toUpperCase()}</div>
              }
            </div>
            <div className="ed-org-info">
              <span className="ed-org-label">Organized by</span>
              <strong className="ed-org-name">{event.organizer_name || organizer?.full_name || organizer?.username || 'Event Organizer'}</strong>
            </div>
            <PersonRegular fontSize={18} style={{ color: 'var(--text-secondary)', marginLeft: 'auto' }} />
          </div>
        )}

        {/* Pricing Details */}
        {!event.is_free && (
          <div className="ed-pricing-card">
            <div className="ed-pricing-header">
              <MoneyRegular fontSize={20} />
              <span>Pricing</span>
            </div>
            <div className="ed-pricing-amount">{formatPrice(event)}</div>
            <p className="ed-pricing-note">per person</p>
            {event.payment_link && (
              <a href={event.payment_link} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ marginTop: '0.75rem', width: '100%', textAlign: 'center' }}>
                💳 Payment Details / Bank Transfer
              </a>
            )}
          </div>
        )}

        {/* Sponsors */}
        {event.sponsors && Array.isArray(event.sponsors) && event.sponsors.length > 0 && (
          <div className="ed-sponsors-card">
            <h3 style={{ fontSize: '0.9rem', fontFamily: 'var(--font-head)', margin: '0 0 0.75rem', color: 'var(--text)' }}>🤝 Sponsored By</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
              {event.sponsors.map((s, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.5rem 0.85rem', background: 'rgba(59,130,246,0.06)',
                  border: '1px solid rgba(59,130,246,0.15)', borderRadius: '10px',
                  fontSize: '0.82rem', fontWeight: 500, color: 'var(--text)'
                }}>
                  <span>🏢</span>
                  {s.link ? (
                    <a href={s.link.startsWith('http') ? s.link : `https://${s.link}`} target="_blank" rel="noopener noreferrer"
                      style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: 600 }}>{s.name}</a>
                  ) : <span>{s.name}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Aso-Ebi / Souvenir Section */}
        {(event.aso_ebi_details || event.aso_ebi_link) && (
          <div className="ed-asoebi-card">
            <div className="ed-asoebi-header">👗 Aso-Ebi / Souvenir</div>
            {event.aso_ebi_details && <p className="ed-asoebi-details">{event.aso_ebi_details}</p>}
            {event.aso_ebi_link && (
              <a href={event.aso_ebi_link} target="_blank" rel="noopener noreferrer" className="btn btn-outline ed-asoebi-btn">
                🛍️ Purchase / Contact
              </a>
            )}
          </div>
        )}

        {/* RSVP Section */}
        <div className="ed-rsvp-section">
          {rsvp ? (
            <div className="ed-rsvp-status">
              {rsvp.status === 'interested' ? (
                <>
                  <div className="ed-going-badge">
                    <CheckmarkCircleRegular fontSize={24} />
                    <span>You're going! 🎉</span>
                  </div>
                  {/* Download Pass - primary CTA */}
                  <Link to={`/pass/${slug}/ticket`} className="ed-download-pass-btn">
                    🎟️ Download Your Event Pass
                  </Link>
                  {/* Payment button for paid events */}
                  {!event.is_free && !rsvp.has_paid && (
                    <button className="btn btn-outline ed-pay-btn" onClick={markPaid} disabled={submitting}>
                      💳 I've Paid — {formatPrice(event)}
                    </button>
                  )}
                  {rsvp.has_paid && !rsvp.organizer_confirmed && (
                    <div className="ed-paid-badge">✅ Payment submitted — awaiting confirmation</div>
                  )}
                  {rsvp.has_paid && rsvp.organizer_confirmed && (
                    <div className="ed-confirmed-badge">💰 Payment Confirmed!</div>
                  )}
                  {/* Change RSVP - intentionally subtle */}
                  <button className="ed-change-rsvp-toggle" onClick={(e) => { const el = e.currentTarget.nextSibling; el.style.display = el.style.display === 'flex' ? 'none' : 'flex' }}>
                    Change RSVP
                  </button>
                  <div className="ed-rsvp-change" style={{ display: 'none' }}>
                    <button className="btn btn-sm btn-outline ed-rsvp-dimmed" onClick={() => handleRsvp('maybe')} disabled={submitting}>Maybe</button>
                    <button className="btn btn-sm btn-outline ed-rsvp-dimmed" onClick={() => handleRsvp('not_interested')} disabled={submitting}>Can't Make It</button>
                  </div>
                </>
              ) : (
                <>
                  <CheckmarkCircleRegular fontSize={22} />
                  <span>You're {rsvp.status === 'maybe' ? 'a maybe 🤔' : 'not going'}</span>
                  <div className="ed-rsvp-change">
                    <button className="btn btn-sm btn-primary" onClick={() => handleRsvp('interested')} disabled={submitting || isFull}>I'm In! 🎉</button>
                    {rsvp.status !== 'maybe' && <button className="btn btn-sm btn-outline" onClick={() => handleRsvp('maybe')} disabled={submitting}>Maybe</button>}
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              {isFull ? (
                <div className="ed-full-badge">🚫 This event is full ({event.max_capacity} spots taken)</div>
              ) : (
                <>
                  {!session && (
                    <div className="ed-guest-form">
                      <p className="ed-guest-prompt">RSVP as a guest or <Link to={`/auth?redirect=/pass/${slug}`}>sign in</Link> for the full experience</p>
                      <input placeholder="Your name *" value={guestForm.name} onChange={e => setGuestForm(p => ({ ...p, name: e.target.value }))} className="ce-input" />
                      <input placeholder="Phone (optional)" value={guestForm.phone} onChange={e => setGuestForm(p => ({ ...p, phone: e.target.value }))} className="ce-input" />
                      <input placeholder="Email (optional)" value={guestForm.email} onChange={e => setGuestForm(p => ({ ...p, email: e.target.value }))} className="ce-input" />
                    </div>
                  )}
                  <div className="ed-rsvp-buttons">
                    <button className="btn btn-primary btn-lg ed-rsvp-in" onClick={() => handleRsvp('interested')} disabled={submitting}>
                      🙋 I'm In!
                    </button>
                    <button className="btn btn-outline btn-lg" onClick={() => handleRsvp('maybe')} disabled={submitting}>
                      🤔 Maybe
                    </button>
                    <button className="btn btn-outline btn-lg ed-rsvp-no" onClick={() => handleRsvp('not_interested')} disabled={submitting}>
                      Not Interested
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Share & Copy Reminder */}
        <div className="ed-actions-row">
          <button className="btn btn-outline" onClick={shareEvent}>
            <ShareRegular fontSize={16} /> Share
          </button>
          <button className="btn btn-outline" onClick={copyReminder}>
            <CopyRegular fontSize={16} /> {copied ? 'Copied!' : 'Copy Reminder'}
          </button>
        </div>

        {/* Public Attendee List - visible to all RSVP'd users */}
        {rsvp && interested.length > 0 && (
          <div className="ed-attendees-section">
            <h3><PeopleRegular fontSize={18} /> Who's Going ({interested.length})</h3>
            <div className="ed-attendees-avatars">
              {interested.slice(0, 8).map((r, i) => {
                const name = r.guest_name || r.profiles?.full_name || r.profiles?.username || 'User'
                const avatar = r.profiles?.avatar_url
                return (
                  <div key={r.id || i} className="ed-attendee-chip" title={name}>
                    {avatar
                      ? <img src={avatar} alt="" className="ed-attendee-avatar" />
                      : <div className="ed-attendee-avatar ed-attendee-initial">{name[0].toUpperCase()}</div>
                    }
                    <span className="ed-attendee-name">{name.split(' ')[0]}</span>
                  </div>
                )
              })}
              {interested.length > 8 && (
                <div className="ed-attendee-chip ed-attendee-more">
                  <div className="ed-attendee-avatar ed-attendee-initial">+{interested.length - 8}</div>
                  <span className="ed-attendee-name">more</span>
                </div>
              )}
            </div>
            {maybes.length > 0 && (
              <p className="ed-maybe-count">🤔 {maybes.length} {maybes.length === 1 ? 'person' : 'people'} said maybe</p>
            )}
          </div>
        )}

        {/* Non-RSVP'd visitors also see attendee count */}
        {!rsvp && interested.length > 0 && (
          <div className="ed-attendees-section">
            <div className="ed-attendees-preview">
              <div className="ed-attendees-stack">
                {interested.slice(0, 4).map((r, i) => {
                  const name = r.guest_name || r.profiles?.full_name || r.profiles?.username || 'U'
                  const avatar = r.profiles?.avatar_url
                  return avatar
                    ? <img key={r.id || i} src={avatar} alt="" className="ed-stack-avatar" style={{ zIndex: 4 - i, marginLeft: i > 0 ? '-10px' : '0' }} />
                    : <div key={r.id || i} className="ed-stack-avatar ed-stack-initial" style={{ zIndex: 4 - i, marginLeft: i > 0 ? '-10px' : '0' }}>{name[0].toUpperCase()}</div>
                })}
              </div>
              <span className="ed-attendees-count">
                <strong>{interested.length}</strong> {interested.length === 1 ? 'person' : 'people'} going
                {maybes.length > 0 && ` · ${maybes.length} maybe`}
              </span>
            </div>
          </div>
        )}

        {/* Organizer Tools */}
        {isOrganizer && (
          <div className="ed-organizer-section">
            <h3>🛠️ Organizer Tools</h3>

            {/* Change Event Image */}
            <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(200,150,62,0.06)', borderRadius: '10px', border: '1px solid rgba(200,150,62,0.15)' }}>
              <input type="file" accept="image/*" ref={imageInputRef} hidden onChange={async (e) => {
                const file = e.target.files[0]
                if (!file) return
                setToast('Uploading image...')
                try {
                  const url = await uploadFile(file, 'events')
                  await supabase.from('events').update({ image_url: url }).eq('id', event.id)
                  setEvent(prev => ({ ...prev, image_url: url }))
                  setToast('Image updated! ✅')
                } catch (err) { setToast('Upload failed: ' + err.message) }
              }} />
              <button className="btn btn-outline btn-sm" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                onClick={() => imageInputRef.current?.click()}>
                <ImageRegular fontSize={16} /> Change Event Image
              </button>
            </div>

            <div className="ed-participants-list">
              <h4><PeopleRegular fontSize={16} /> Participants ({interested.length + maybes.length})</h4>
              {rsvps.filter(r => r.status !== 'not_interested').map(r => {
                const name = r.guest_name || r.profiles?.full_name || r.profiles?.username || 'User'
                const email = r.guest_email || ''
                return (
                  <div key={r.id} className="ed-participant">
                    <div style={{ flex: 1 }}>
                      <span className="ed-p-name">{name}</span>
                      {email && <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>{email}</span>}
                    </div>
                    <span className={`ed-p-status ${r.status}`}>{r.status === 'interested' ? '✅ Going' : '🤔 Maybe'}</span>
                    {!event.is_free && (
                      <span className={`ed-p-paid ${r.has_paid ? 'yes' : ''}`}>
                        {r.has_paid ? (r.organizer_confirmed ? '💰 Confirmed' : '💳 Claims paid') : '⏳ Unpaid'}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="ed-org-actions">
              <Link to="/dashboard" className="btn btn-outline btn-sm">Manage in Dashboard</Link>
            </div>
          </div>
        )}

        {toast && <div className="ed-toast">{toast}</div>}

        {/* Image Overlay Lightbox */}
        {showImageOverlay && event.image_url && (
          <div className="ed-image-overlay" onClick={() => setShowImageOverlay(false)}>
            <button className="ed-overlay-close" onClick={() => setShowImageOverlay(false)}>✕</button>
            <img src={event.image_url} alt={event.title} className="ed-overlay-img" />
          </div>
        )}
      </div>

      <style>{`
        .ed-loading {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          min-height: 80vh; gap: 1rem; color: var(--text-secondary); font-family: var(--font-body);
        }
        .ed-spinner {
          width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: var(--primary);
          border-radius: 50%; animation: ed-spin 0.8s linear infinite;
        }
        @keyframes ed-spin { to { transform: rotate(360deg); } }

        .ed-wrapper {
          max-width: 680px; margin: 0 auto; padding-bottom: 6rem;
          font-family: var(--font-body); color: var(--text); animation: ed-fadeIn 0.4s ease;
        }
        @keyframes ed-fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .ed-hero {
          position: relative; height: 320px;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
          background-size: cover; background-position: center; overflow: hidden;
        }
        .ed-hero-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(to top, rgba(10,10,20,0.95) 0%, rgba(10,10,20,0.4) 50%, rgba(10,10,20,0.2) 100%);
          display: flex; flex-direction: column; justify-content: space-between; padding: 1.25rem;
        }
        .ed-back {
          background: rgba(255,255,255,0.12); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.15); color: #fff; width: 40px; height: 40px;
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s ease;
        }
        .ed-back:hover { background: rgba(255,255,255,0.2); transform: scale(1.05); }
        .ed-hero-content { display: flex; flex-direction: column; gap: 0.5rem; }
        .ed-category-badge {
          display: inline-block; background: rgba(200,150,62,0.2); color: #C8963E;
          padding: 0.25rem 0.85rem; border-radius: 100px; font-size: 0.75rem; font-weight: 600;
          font-family: var(--font-head); letter-spacing: 0.04em; width: fit-content;
          border: 1px solid rgba(200,150,62,0.3);
        }
        .ed-title {
          font-family: var(--font-head); font-size: clamp(1.5rem, 5vw, 2rem); font-weight: 700;
          color: #ffffff; line-height: 1.2; margin: 0; text-shadow: 0 2px 12px rgba(0,0,0,0.3);
        }
        .ed-countdown { font-size: 0.85rem; color: rgba(255,255,255,0.7); font-weight: 500; }

        .ed-body { padding: 0 1.25rem; position: relative; margin-top: -1.5rem; z-index: 2; }

        .ed-stats-bar {
          display: flex; gap: 1px;
          background: linear-gradient(135deg, rgba(26,26,46,0.95), rgba(22,33,62,0.95));
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          border-radius: 16px; border: 1px solid rgba(200,150,62,0.15);
          overflow: hidden; margin-bottom: 1.5rem;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05);
        }
        .ed-stat {
          flex: 1; text-align: center; padding: 1rem 0.5rem;
          display: flex; flex-direction: column; gap: 0.15rem;
        }
        .ed-stat strong {
          font-family: var(--font-head); font-size: 1.5rem; font-weight: 700; color: var(--primary);
        }
        .ed-stat span {
          font-size: 0.7rem; color: var(--text-secondary); font-weight: 500;
          text-transform: uppercase; letter-spacing: 0.04em;
        }

        .ed-progress-section { margin-bottom: 1.5rem; }
        .ed-progress-bar {
          height: 8px; background: rgba(255,255,255,0.06);
          border-radius: 100px; overflow: hidden; margin-bottom: 0.5rem;
        }
        .ed-progress-fill {
          height: 100%; background: linear-gradient(90deg, var(--primary), #d4a84b);
          border-radius: 100px; transition: width 1s cubic-bezier(0.4,0,0.2,1); position: relative;
        }
        .ed-progress-fill::after {
          content: ''; position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          animation: ed-shimmer 2s ease infinite;
        }
        @keyframes ed-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .ed-progress-label { font-size: 0.78rem; color: var(--text-secondary); }

        .ed-details {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 16px; padding: 0.25rem 0; margin-bottom: 1.25rem; overflow: hidden;
        }
        .ed-detail-row {
          display: flex; align-items: flex-start; gap: 1rem;
          padding: 1rem 1.25rem; border-bottom: 1px solid var(--border); color: var(--primary);
        }
        .ed-detail-row:last-child { border-bottom: none; }
        .ed-detail-row div { flex: 1; }
        .ed-detail-row strong { display: block; font-size: 0.9rem; color: var(--text); font-weight: 600; }
        .ed-detail-sub { font-size: 0.78rem; color: var(--text-secondary); margin-top: 0.15rem; }
        .ed-meeting-link, .ed-payment-link {
          display: inline-block; font-size: 0.82rem; color: var(--primary);
          text-decoration: none; font-weight: 600; margin-top: 0.2rem; transition: opacity 0.2s;
        }
        .ed-meeting-link:hover, .ed-payment-link:hover { opacity: 0.8; }
        .ed-map-link {
          display: block; font-size: 0.82rem; color: var(--primary);
          text-decoration: none; font-weight: 600; margin-top: 0.25rem;
          transition: opacity 0.2s;
        }
        .ed-map-link:hover { opacity: 0.8; text-decoration: underline; }

        .ed-description {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 16px; padding: 1.25rem; margin-bottom: 1.25rem;
        }
        .ed-description p {
          font-size: 0.9rem; line-height: 1.65; color: var(--text-secondary);
          white-space: pre-wrap; margin: 0;
        }

        .ed-organizer-card {
          display: flex; align-items: center; gap: 0.85rem;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 16px; padding: 1rem 1.25rem; margin-bottom: 1.25rem;
        }
        .ed-org-info { flex: 1; }
        .ed-org-label {
          font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase;
          letter-spacing: 0.04em; display: block;
        }
        .ed-org-name { font-size: 0.95rem; display: block; margin-top: 0.1rem; }

        .ed-pricing-card {
          background: linear-gradient(135deg, rgba(200,150,62,0.08), rgba(200,150,62,0.03));
          border: 1px solid rgba(200,150,62,0.2); border-radius: 16px;
          padding: 1.5rem; text-align: center; margin-bottom: 1.25rem;
        }
        .ed-pricing-header {
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          color: var(--primary); font-weight: 600; margin-bottom: 0.75rem; font-size: 0.85rem;
        }
        .ed-pricing-amount {
          font-family: var(--font-head); font-size: 2.2rem; font-weight: 700; color: var(--primary);
        }
        .ed-pricing-note { font-size: 0.78rem; color: var(--text-secondary); margin-top: 0.15rem; }

        .ed-asoebi-card {
          background: linear-gradient(135deg, rgba(156,39,176,0.08), rgba(156,39,176,0.02));
          border: 1px solid rgba(156,39,176,0.2); border-radius: 16px;
          padding: 1.25rem; margin-bottom: 1.25rem;
        }
        .ed-asoebi-header {
          font-family: var(--font-head); font-size: 1rem; font-weight: 700;
          color: #ce93d8; margin-bottom: 0.5rem;
        }
        .ed-asoebi-details {
          font-size: 0.88rem; line-height: 1.6; color: var(--text-secondary);
          white-space: pre-wrap; margin: 0 0 0.75rem;
        }
        .ed-asoebi-btn {
          width: 100%; text-align: center; border-color: rgba(156,39,176,0.3);
          color: #ce93d8;
        }
        .ed-asoebi-btn:hover { background: rgba(156,39,176,0.1); }

        .ed-sponsors-card {
          background: linear-gradient(135deg, rgba(59,130,246,0.06), rgba(59,130,246,0.02));
          border: 1px solid rgba(59,130,246,0.15); border-radius: 16px;
          padding: 1.25rem; margin-bottom: 1.25rem;
        }

        .ed-image-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.92);
          z-index: 2000; display: flex; align-items: center; justify-content: center;
          animation: ed-fadeIn 0.2s ease; cursor: zoom-out;
        }
        .ed-overlay-close {
          position: absolute; top: 1rem; right: 1rem;
          background: rgba(255,255,255,0.15); border: none; color: #fff;
          width: 40px; height: 40px; border-radius: 50%; font-size: 1.2rem;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          z-index: 2001; transition: background 0.2s;
        }
        .ed-overlay-close:hover { background: rgba(255,255,255,0.25); }
        .ed-overlay-img {
          max-width: 95vw; max-height: 90vh; object-fit: contain;
          border-radius: 8px; cursor: default;
        }
        .ed-hero { cursor: pointer; }

        .ed-rsvp-section {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 16px; padding: 1.5rem; margin-bottom: 1.25rem;
        }
        .ed-rsvp-status {
          display: flex; flex-direction: column; align-items: center;
          gap: 0.75rem; text-align: center; color: var(--primary); width: 100%;
        }
        .ed-rsvp-status > span { font-size: 1.1rem; font-weight: 600; color: var(--text); }
        .ed-going-badge {
          display: flex; align-items: center; gap: 0.5rem;
          background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.25);
          padding: 0.65rem 1.25rem; border-radius: 100px; color: #4ade80;
          font-weight: 700; font-size: 1rem; font-family: var(--font-head);
        }
        .ed-rsvp-change {
          display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center; margin-top: 0.25rem;
        }
        .ed-change-rsvp-toggle {
          background: none; border: none; color: var(--text-secondary);
          font-size: 0.72rem; cursor: pointer; opacity: 0.5;
          text-decoration: underline; padding: 0.25rem; margin-top: 0.25rem;
          transition: opacity 0.2s;
        }
        .ed-change-rsvp-toggle:hover { opacity: 0.8; }
        .ed-rsvp-dimmed { opacity: 0.6; font-size: 0.75rem !important; }
        .ed-rsvp-dimmed:hover { opacity: 0.9; }

        .ed-download-pass-btn {
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          width: 100%; padding: 1rem 1.5rem;
          background: linear-gradient(135deg, var(--primary), #e8c86a, var(--primary));
          background-size: 200% 200%; color: #fff;
          border: none; border-radius: 14px; font-size: 1.1rem; font-weight: 700;
          font-family: var(--font-head); text-decoration: none; cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(200,150,62,0.35);
          animation: ed-passGlow 2s ease-in-out infinite alternate, ed-passShine 3s linear infinite;
        }
        .ed-download-pass-btn:hover {
          transform: translateY(-3px); box-shadow: 0 8px 30px rgba(200,150,62,0.5);
          color: #fff;
        }
        @keyframes ed-passGlow {
          from { box-shadow: 0 4px 20px rgba(200,150,62,0.3); }
          to { box-shadow: 0 6px 30px rgba(200,150,62,0.5); }
        }
        @keyframes ed-passShine {
          0% { background-position: 200% 50%; }
          100% { background-position: -200% 50%; }
        }

        .ed-pay-btn { width: 100%; margin-top: 0.25rem; }
        .ed-paid-badge, .ed-confirmed-badge {
          width: 100%; text-align: center; padding: 0.75rem 1rem;
          border-radius: 10px; font-size: 0.85rem; font-weight: 600;
        }
        .ed-paid-badge {
          background: rgba(59,130,246,0.1); color: #60a5fa; border: 1px solid rgba(59,130,246,0.2);
        }
        .ed-confirmed-badge {
          background: rgba(34,197,94,0.1); color: #4ade80; border: 1px solid rgba(34,197,94,0.2);
        }
        .ed-full-badge {
          text-align: center; padding: 1rem; background: rgba(239,68,68,0.08);
          color: #f87171; border-radius: 12px; font-weight: 600; font-size: 0.9rem;
          border: 1px solid rgba(239,68,68,0.15);
        }

        .ed-guest-form { margin-bottom: 1rem; }
        .ed-guest-prompt {
          font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.75rem; text-align: center;
        }
        .ed-guest-prompt a { color: var(--primary); font-weight: 600; }
        .ed-guest-form .ce-input { margin-bottom: 0.5rem; }

        .ed-rsvp-buttons { display: flex; flex-direction: column; gap: 0.6rem; }
        .ed-rsvp-in { animation: ed-pulse 2.5s ease-in-out infinite; }
        @keyframes ed-pulse {
          0%, 100% { box-shadow: 0 4px 15px rgba(200,150,62,0.2); }
          50% { box-shadow: 0 4px 30px rgba(200,150,62,0.45); }
        }
        .ed-rsvp-no { opacity: 0.7; }

        .ed-actions-row { display: flex; gap: 0.75rem; margin-bottom: 1.25rem; }
        .ed-actions-row .btn {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.4rem;
        }

        .ed-organizer-section {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 16px; padding: 1.5rem; margin-bottom: 1.25rem;
        }
        .ed-organizer-section h3 { font-family: var(--font-head); font-size: 1.1rem; margin-bottom: 1rem; }
        .ed-participants-list { margin-bottom: 1rem; }
        .ed-participants-list h4 {
          display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem;
          color: var(--text-secondary); margin-bottom: 0.75rem; font-weight: 600;
        }
        .ed-participant {
          display: flex; align-items: center; gap: 0.5rem; padding: 0.65rem 0;
          border-bottom: 1px solid var(--border); font-size: 0.85rem;
        }
        .ed-participant:last-child { border-bottom: none; }
        .ed-p-name { font-weight: 600; }
        .ed-p-status {
          font-size: 0.72rem; padding: 0.2rem 0.6rem; border-radius: 100px;
          font-weight: 600; white-space: nowrap;
        }
        .ed-p-status.interested { background: rgba(34,197,94,0.12); color: #4ade80; }
        .ed-p-status.maybe { background: rgba(251,191,36,0.12); color: #fbbf24; }
        .ed-p-paid {
          font-size: 0.72rem; padding: 0.2rem 0.6rem; border-radius: 100px;
          font-weight: 600; white-space: nowrap;
          background: rgba(255,255,255,0.05); color: var(--text-secondary);
        }
        .ed-p-paid.yes { background: rgba(34,197,94,0.12); color: #4ade80; }
        .ed-org-actions { text-align: center; }

        .ed-attendees-section {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 16px; padding: 1.25rem; margin-bottom: 1.25rem;
        }
        .ed-attendees-section h3 {
          font-family: var(--font-head); font-size: 1rem; font-weight: 700;
          display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; color: var(--text);
        }
        .ed-attendees-avatars {
          display: flex; flex-wrap: wrap; gap: 0.6rem;
        }
        .ed-attendee-chip {
          display: flex; flex-direction: column; align-items: center; gap: 0.3rem; width: 56px;
        }
        .ed-attendee-avatar {
          width: 42px; height: 42px; border-radius: 50%; object-fit: cover;
          border: 2px solid var(--border);
        }
        .ed-attendee-initial {
          display: flex; align-items: center; justify-content: center;
          background: rgba(200,150,62,0.15); color: var(--primary);
          font-weight: 700; font-size: 0.9rem; font-family: var(--font-head);
        }
        .ed-attendee-name {
          font-size: 0.68rem; color: var(--text-secondary); text-align: center;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 56px;
        }
        .ed-attendee-more .ed-attendee-initial {
          background: rgba(255,255,255,0.08); color: var(--text-secondary); font-size: 0.75rem;
        }
        .ed-maybe-count {
          margin-top: 0.75rem; font-size: 0.8rem; color: var(--text-secondary);
        }
        .ed-attendees-preview {
          display: flex; align-items: center; gap: 0.85rem;
        }
        .ed-attendees-stack {
          display: flex; align-items: center;
        }
        .ed-stack-avatar {
          width: 34px; height: 34px; border-radius: 50%; object-fit: cover;
          border: 2px solid var(--surface); position: relative;
        }
        .ed-stack-initial {
          display: flex; align-items: center; justify-content: center;
          background: rgba(200,150,62,0.15); color: var(--primary);
          font-weight: 700; font-size: 0.75rem; font-family: var(--font-head);
        }
        .ed-attendees-count {
          font-size: 0.85rem; color: var(--text-secondary);
        }
        .ed-attendees-count strong { color: var(--text); }

        .ed-toast {
          position: fixed; bottom: 5rem; left: 50%; transform: translateX(-50%);
          background: var(--surface); color: var(--text); padding: 0.85rem 1.5rem;
          border-radius: 12px; font-size: 0.9rem; font-weight: 600;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3); border: 1px solid var(--border);
          z-index: 1000; animation: ed-toastIn 0.4s cubic-bezier(0.16,1,0.3,1); white-space: nowrap;
        }
        @keyframes ed-toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  )
}
