import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { uploadFile } from '../lib/cms.js'
import {
  CalendarRegular, LocationRegular, MoneyRegular, PeopleRegular,
  ImageRegular, ArrowLeftRegular, CheckmarkCircleRegular,
  LinkRegular, VideoRegular
} from '@fluentui/react-icons'

const VENUE_TYPES = [
  { id: 'physical', label: '📍 Physical Location', desc: 'In-person venue' },
  { id: 'virtual', label: '💻 Virtual / Online', desc: 'Google Meet, Zoom, WhatsApp' },
  { id: 'both', label: '🌐 Hybrid (Both)', desc: 'Physical + virtual link' },
]

function generateSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
    + '-' + Math.random().toString(36).slice(2, 8)
}

export default function CreateEvent() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [categories, setCategories] = useState([])
  const [session, setSession] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  // Form state
  const [form, setForm] = useState({
    category: '', subcategory: '', customCategory: '',
    title: '', description: '', image: null, imagePreview: null,
    venueType: 'physical', venueName: '', venueAddress: '', meetingLink: '',
    startDate: '', endDate: '', startTime: '', endTime: '',
    isFree: true, price: '', currency: 'NGN', paymentLink: '',
    maxCapacity: '', visibility: 'public',
    asoEbiDetails: '', asoEbiLink: '',
    organizerName: '', organizerLogo: null, organizerLogoPreview: null,
    sponsors: [{ name: '', logoUrl: '', link: '' }],
    coAdminEmails: [''],
  })

  useEffect(() => {
    supabase?.auth.getSession().then(({ data }) => {
      setSession(data?.session)
      if (!data?.session) navigate('/auth?redirect=/pass/create')
    })
    // Load categories
    supabase?.from('event_categories').select('*').order('name').then(({ data }) => {
      setCategories(data || [])
    })
  }, [])

  function update(key, val) { setForm(p => ({ ...p, [key]: val })) }

  async function handleSubmit() {
    if (!session) return navigate('/auth?redirect=/pass/create')
    setSubmitting(true)
    setError(null)
    try {
      let imageUrl = null
      if (form.image) {
        imageUrl = await uploadFile(form.image, 'events')
      }

      const cat = form.category === '_custom' ? form.customCategory.trim() : form.category
      // If custom category, insert into event_categories
      if (form.category === '_custom' && form.customCategory.trim()) {
        await supabase.from('event_categories')
          .upsert({ name: form.customCategory.trim(), is_custom: true, created_by: session.user.id },
            { onConflict: 'name' })
      }

      const slug = generateSlug(form.title)

      // Upload organizer logo if provided
      let orgLogoUrl = null
      if (form.organizerLogo) {
        orgLogoUrl = await uploadFile(form.organizerLogo, 'events')
      }

      // Filter valid sponsors
      const validSponsors = form.sponsors.filter(s => s.name.trim()).map(s => ({
        name: s.name.trim(), link: s.link.trim() || null
      }))

      const { error: insertError } = await supabase.from('events').insert({
        organizer_id: session.user.id,
        title: form.title.trim(),
        slug,
        description: form.description.trim() || null,
        category: cat,
        subcategory: form.subcategory.trim() || null,
        image_url: imageUrl,
        venue_type: form.venueType,
        venue_name: form.venueName.trim() || null,
        venue_address: form.venueAddress.trim() || null,
        meeting_link: form.meetingLink.trim() || null,
        start_date: new Date(form.startDate + 'T' + (form.startTime || '00:00')).toISOString(),
        end_date: form.endDate ? new Date(form.endDate + 'T' + (form.endTime || '23:59')).toISOString() : null,
        start_time: form.startTime || null,
        end_time: form.endTime || null,
        is_free: form.isFree,
        price: form.isFree ? null : parseFloat(form.price) || null,
        currency: form.currency,
        payment_link: form.isFree ? null : form.paymentLink.trim() || null,
        max_capacity: form.maxCapacity ? parseInt(form.maxCapacity) : null,
        visibility: form.visibility,
        aso_ebi_details: form.asoEbiDetails.trim() || null,
        aso_ebi_link: form.asoEbiLink.trim() || null,
        organizer_name: form.organizerName.trim() || null,
        organizer_logo_url: orgLogoUrl || null,
        sponsors: validSponsors.length > 0 ? validSponsors : null,
        status: 'published',
      })
      if (insertError) throw insertError

      // Insert co-admins
      const validEmails = form.coAdminEmails.filter(e => e.trim() && e.includes('@'))
      if (validEmails.length > 0) {
        const { data: eventData } = await supabase.from('events').select('id').eq('slug', slug).single()
        if (eventData) {
          await supabase.from('event_admins').insert(
            validEmails.map(email => ({
              event_id: eventData.id, email: email.trim().toLowerCase(),
              role: 'admin', invited_by: session.user.id, status: 'pending'
            }))
          )
        }
      }

      navigate(`/pass/${slug}`)
    } catch (e) {
      setError(e.message || 'Failed to create event')
    }
    setSubmitting(false)
  }

  const totalSteps = 6
  const canNext = () => {
    if (step === 1) return form.category && form.title.trim().length >= 3
    if (step === 2) return (form.venueType === 'virtual' ? form.meetingLink.trim() : form.venueName.trim())
    if (step === 3) return form.startDate
    return true
  }

  return (
    <div className="ce-wrapper">
      <div className="ce-container">
        {/* Header */}
        <div className="ce-header">
          <button className="ce-back" onClick={() => step > 1 ? setStep(s => s - 1) : navigate('/pass')}>
            <ArrowLeftRegular fontSize={18} />
          </button>
          <div className="ce-progress">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div key={i} className={`ce-dot ${i + 1 <= step ? 'active' : ''} ${i + 1 === step ? 'current' : ''}`} />
            ))}
          </div>
          <span className="ce-step-label">Step {step}/{totalSteps}</span>
        </div>

        {/* Step 1: Category + Details */}
        {step === 1 && (
          <div className="ce-step">
            <h2 className="ce-title">What are you planning?</h2>
            <p className="ce-subtitle">Pick a category and name your event</p>

            <div className="ce-cat-grid">
              {categories.map(cat => (
                <button key={cat.name}
                  className={`ce-cat-chip ${form.category === cat.name ? 'selected' : ''}`}
                  onClick={() => update('category', cat.name)}>
                  {cat.emoji} {cat.name}
                </button>
              ))}
              <button
                className={`ce-cat-chip ${form.category === '_custom' ? 'selected' : ''}`}
                onClick={() => update('category', '_custom')}>
                ✏️ Other
              </button>
            </div>

            {form.category === '_custom' && (
              <input className="ce-input" placeholder="Type category, e.g. Brunch, Pool Party..."
                value={form.customCategory} onChange={e => update('customCategory', e.target.value)} />
            )}

            <input className="ce-input ce-input-lg" placeholder="Event title *"
              value={form.title} onChange={e => update('title', e.target.value)} maxLength={80} />

            <textarea className="ce-textarea" placeholder="Add a description (optional)"
              value={form.description} onChange={e => update('description', e.target.value)}
              rows={3} maxLength={500} />

            <label className="ce-upload-label">
              <ImageRegular fontSize={18} /> {form.imagePreview ? 'Change Image' : 'Upload Event Image (optional)'}
              <input type="file" accept="image/*" hidden onChange={e => {
                const f = e.target.files?.[0]
                if (f) { update('image', f); update('imagePreview', URL.createObjectURL(f)) }
              }} />
            </label>
            {form.imagePreview && <img src={form.imagePreview} alt="Preview" className="ce-preview-img" />}
          </div>
        )}

        {/* Step 2: Venue */}
        {step === 2 && (
          <div className="ce-step">
            <h2 className="ce-title"><LocationRegular fontSize={22} /> Where?</h2>
            <p className="ce-subtitle">Set the venue for your event</p>

            <div className="ce-venue-types">
              {VENUE_TYPES.map(vt => (
                <button key={vt.id}
                  className={`ce-venue-chip ${form.venueType === vt.id ? 'selected' : ''}`}
                  onClick={() => update('venueType', vt.id)}>
                  <strong>{vt.label}</strong>
                  <span>{vt.desc}</span>
                </button>
              ))}
            </div>

            {(form.venueType === 'physical' || form.venueType === 'both') && (
              <>
                <input className="ce-input" placeholder="Venue name *"
                  value={form.venueName} onChange={e => update('venueName', e.target.value)} />
                <input className="ce-input" placeholder="Address"
                  value={form.venueAddress} onChange={e => update('venueAddress', e.target.value)} />
              </>
            )}
            {(form.venueType === 'virtual' || form.venueType === 'both') && (
              <div className="ce-field-group">
                <label><VideoRegular fontSize={16} /> Meeting Link *</label>
                <input className="ce-input" placeholder="https://meet.google.com/... or zoom link"
                  value={form.meetingLink} onChange={e => update('meetingLink', e.target.value)} />
              </div>
            )}
          </div>
        )}

        {/* Step 3: Date & Time */}
        {step === 3 && (
          <div className="ce-step">
            <h2 className="ce-title"><CalendarRegular fontSize={22} /> When?</h2>
            <p className="ce-subtitle">Set the date and time</p>
            <div className="ce-row">
              <div className="ce-field-group">
                <label>Start Date *</label>
                <input className="ce-input" type="date" value={form.startDate}
                  onChange={e => update('startDate', e.target.value)} />
              </div>
              <div className="ce-field-group">
                <label>End Date</label>
                <input className="ce-input" type="date" value={form.endDate}
                  onChange={e => update('endDate', e.target.value)} />
              </div>
            </div>
            <div className="ce-row">
              <div className="ce-field-group">
                <label>Start Time</label>
                <input className="ce-input" type="time" value={form.startTime}
                  onChange={e => update('startTime', e.target.value)} />
              </div>
              <div className="ce-field-group">
                <label>End Time</label>
                <input className="ce-input" type="time" value={form.endTime}
                  onChange={e => update('endTime', e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Pricing & Capacity */}
        {step === 4 && (
          <div className="ce-step">
            <h2 className="ce-title"><MoneyRegular fontSize={22} /> Pricing & Capacity</h2>
            <p className="ce-subtitle">Set pricing and attendee limits</p>

            <div className="ce-toggle-row">
              <span>This event is free</span>
              <button className={`ce-toggle ${form.isFree ? 'on' : ''}`}
                onClick={() => update('isFree', !form.isFree)}>
                <div className="ce-toggle-thumb" />
              </button>
            </div>

            {!form.isFree && (
              <>
                <div className="ce-row">
                  <div className="ce-field-group" style={{ flex: 1 }}>
                    <label>Price</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <select className="ce-input" value={form.currency}
                        onChange={e => update('currency', e.target.value)}
                        style={{ width: '90px', flex: 'none' }}>
                        <option value="NGN">₦ NGN</option>
                        <option value="USD">$ USD</option>
                        <option value="GBP">£ GBP</option>
                        <option value="EUR">€ EUR</option>
                      </select>
                      <input className="ce-input" type="number" inputMode="decimal" step="any" min="0"
                        placeholder="e.g. 5000"
                        value={form.price} onChange={e => update('price', e.target.value)} />
                    </div>
                  </div>
                </div>
                <div className="ce-field-group">
                  <label><LinkRegular fontSize={14} /> Payment Link / Bank Details</label>
                  <input className="ce-input" placeholder="Bank account details or WhatsApp link"
                    value={form.paymentLink} onChange={e => update('paymentLink', e.target.value)} />
                </div>
              </>
            )}

            <div className="ce-field-group">
              <label><PeopleRegular fontSize={14} /> Max Capacity (leave empty for unlimited)</label>
              <input className="ce-input" type="number" placeholder="e.g. 50"
                value={form.maxCapacity} onChange={e => update('maxCapacity', e.target.value)} />
            </div>

            <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'rgba(156,39,176,0.06)', borderRadius: '12px', border: '1px solid rgba(156,39,176,0.15)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600, fontSize: '0.9rem', color: '#ce93d8', marginBottom: '0.75rem' }}>
                👗 Aso-Ebi / Souvenir Sales (Optional)
              </label>
              <textarea className="ce-input" placeholder="Describe the Aso-Ebi, souvenir package, or dress code details..."
                value={form.asoEbiDetails} onChange={e => update('asoEbiDetails', e.target.value)}
                rows={3} style={{ resize: 'vertical', minHeight: '60px' }} />
              <input className="ce-input" placeholder="Purchase link, WhatsApp number, or contact details"
                value={form.asoEbiLink} onChange={e => update('asoEbiLink', e.target.value)}
                style={{ marginTop: '0.5rem' }} />
            </div>
          </div>
        )}

        {/* Step 5: Organizer, Sponsors & Admins */}
        {step === 5 && (
          <div className="ce-step">
            <h2 className="ce-title">Organizer & Sponsors</h2>
            <p className="ce-subtitle">Brand your event with organizer details, sponsors, and co-admins</p>

            {/* Organizer Branding */}
            <div style={{ padding: '1rem', background: 'rgba(200,150,62,0.06)', borderRadius: '12px', border: '1px solid rgba(200,150,62,0.15)', marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '0.75rem' }}>
                🏢 Organized By (Optional)
              </label>
              <input className="ce-input" placeholder="Company or organizer name, e.g. WhiteArts Events"
                value={form.organizerName} onChange={e => update('organizerName', e.target.value)} />
              <label className="ce-upload-label" style={{ marginTop: '0.5rem' }}>
                <ImageRegular fontSize={16} /> {form.organizerLogoPreview ? 'Change Logo' : 'Upload Organizer Logo'}
                <input type="file" accept="image/*" hidden onChange={e => {
                  const f = e.target.files[0]
                  if (f) update('organizerLogo', f) || update('organizerLogoPreview', URL.createObjectURL(f))
                }} />
              </label>
              {form.organizerLogoPreview && <img src={form.organizerLogoPreview} alt="" style={{ height: 48, borderRadius: 8, marginTop: '0.5rem', objectFit: 'contain' }} />}
            </div>

            {/* Sponsors */}
            <div style={{ padding: '1rem', background: 'rgba(59,130,246,0.06)', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.15)', marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', color: '#60a5fa', marginBottom: '0.75rem' }}>
                🤝 Event Sponsors (Optional)
              </label>
              {form.sponsors.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                  <input className="ce-input" placeholder="Sponsor name" style={{ flex: 1 }}
                    value={s.name} onChange={e => {
                      const arr = [...form.sponsors]; arr[i] = { ...arr[i], name: e.target.value }; update('sponsors', arr)
                    }} />
                  <input className="ce-input" placeholder="Website or link" style={{ flex: 1 }}
                    value={s.link} onChange={e => {
                      const arr = [...form.sponsors]; arr[i] = { ...arr[i], link: e.target.value }; update('sponsors', arr)
                    }} />
                  {form.sponsors.length > 1 && (
                    <button type="button" onClick={() => {
                      update('sponsors', form.sponsors.filter((_, j) => j !== i))
                    }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem', padding: '0.25rem' }}>✕</button>
                  )}
                </div>
              ))}
              <button type="button" className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                onClick={() => update('sponsors', [...form.sponsors, { name: '', logoUrl: '', link: '' }])}>
                + Add Sponsor
              </button>
            </div>

            {/* Co-Admin Invites */}
            <div style={{ padding: '1rem', background: 'rgba(168,85,247,0.06)', borderRadius: '12px', border: '1px solid rgba(168,85,247,0.15)' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', color: '#c084fc', marginBottom: '0.75rem' }}>
                👥 Invite Co-Admins (Optional)
              </label>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Co-admins can manage RSVPs and event details. Enter their email addresses.
              </p>
              {form.coAdminEmails.map((email, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                  <input className="ce-input" type="email" placeholder="co-admin@email.com" style={{ flex: 1 }}
                    value={email} onChange={e => {
                      const arr = [...form.coAdminEmails]; arr[i] = e.target.value; update('coAdminEmails', arr)
                    }} />
                  {form.coAdminEmails.length > 1 && (
                    <button type="button" onClick={() => {
                      update('coAdminEmails', form.coAdminEmails.filter((_, j) => j !== i))
                    }} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem', padding: '0.25rem' }}>✕</button>
                  )}
                </div>
              ))}
              <button type="button" className="btn btn-outline" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                onClick={() => update('coAdminEmails', [...form.coAdminEmails, ''])}>
                + Add Another
              </button>
            </div>
          </div>
        )}

        {/* Step 6: Visibility & Publish */}
        {step === 6 && (
          <div className="ce-step">
            <h2 className="ce-title">Almost done!</h2>
            <p className="ce-subtitle">Choose visibility and publish your event</p>

            <div className="ce-visibility">
              <button className={`ce-vis-card ${form.visibility === 'public' ? 'selected' : ''}`}
                onClick={() => update('visibility', 'public')}>
                <span className="ce-vis-icon">🌍</span>
                <strong>Public</strong>
                <span>Visible on Wanda — hero, events, pass pages</span>
              </button>
              <button className={`ce-vis-card ${form.visibility === 'private' ? 'selected' : ''}`}
                onClick={() => update('visibility', 'private')}>
                <span className="ce-vis-icon">🔒</span>
                <strong>Private</strong>
                <span>Invite only — accessible via shareable link</span>
              </button>
            </div>

            {/* Summary */}
            <div className="ce-summary">
              <h3>Event Summary</h3>
              {form.imagePreview && <img src={form.imagePreview} alt="" className="ce-summary-img" />}
              <div className="ce-summary-row"><strong>Title:</strong> {form.title}</div>
              <div className="ce-summary-row"><strong>Category:</strong> {form.category === '_custom' ? form.customCategory : form.category}</div>
              <div className="ce-summary-row"><strong>Venue:</strong> {form.venueType === 'virtual' ? 'Online' : form.venueName || 'TBD'}</div>
              <div className="ce-summary-row"><strong>Date:</strong> {form.startDate}{form.endDate ? ` — ${form.endDate}` : ''}</div>
              {form.startTime && <div className="ce-summary-row"><strong>Time:</strong> {form.startTime}{form.endTime ? ` — ${form.endTime}` : ''}</div>}
              <div className="ce-summary-row"><strong>Price:</strong> {form.isFree ? 'Free 🎉' : `${form.currency === 'NGN' ? '₦' : form.currency === 'USD' ? '$' : form.currency === 'GBP' ? '£' : '€'}${Number(form.price || 0).toLocaleString()}`}</div>
              <div className="ce-summary-row"><strong>Capacity:</strong> {form.maxCapacity || 'Unlimited'}</div>
              <div className="ce-summary-row"><strong>Visibility:</strong> {form.visibility === 'public' ? '🌍 Public' : '🔒 Private'}</div>
              {form.organizerName && <div className="ce-summary-row"><strong>Organized by:</strong> {form.organizerName}</div>}
              {form.sponsors.filter(s => s.name.trim()).length > 0 && (
                <div className="ce-summary-row"><strong>Sponsors:</strong> {form.sponsors.filter(s => s.name.trim()).map(s => s.name).join(', ')}</div>
              )}
              {form.coAdminEmails.filter(e => e.trim()).length > 0 && (
                <div className="ce-summary-row"><strong>Co-Admins:</strong> {form.coAdminEmails.filter(e => e.trim()).join(', ')}</div>
              )}
            </div>

            {error && <p className="ce-error">{error}</p>}
          </div>
        )}

        {/* Navigation */}
        <div className="ce-nav">
          {step > 1 && (
            <button className="btn btn-outline" onClick={() => setStep(s => s - 1)}>← Back</button>
          )}
          <div style={{ flex: 1 }} />
          {step < totalSteps ? (
            <button className="btn btn-primary" disabled={!canNext()} onClick={() => setStep(s => s + 1)}>
              Next →
            </button>
          ) : (
            <button className="btn btn-primary ce-publish-btn" disabled={submitting} onClick={handleSubmit}>
              <CheckmarkCircleRegular fontSize={18} />
              {submitting ? 'Publishing...' : 'Publish Event 🎉'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
