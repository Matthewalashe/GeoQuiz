import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase, uploadBusinessFile } from '../lib/supabase.js'

const CATS = [
  'restaurant','hotel','attraction','nightlife','park','culture',
  'experience','shopping','event','heritage','market','beach','art',
  'cafe','fitness','spa','coworking','logistics','education',
  'healthcare','artisan','trader','services','salon','photography',
  'fashion','tech','real-estate','entertainment','transport',
]
const PRICE_OPTIONS = [
  { value: '\u20A6', label: '\u20A6 — Budget' },
  { value: '\u20A6\u20A6', label: '\u20A6\u20A6 — Mid-range' },
  { value: '\u20A6\u20A6\u20A6', label: '\u20A6\u20A6\u20A6 — Premium' },
  { value: '\u20A6\u20A6\u20A6\u20A6', label: '\u20A6\u20A6\u20A6\u20A6 — Luxury' },
]

export default function ListBusiness() {
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)

  const [form, setForm] = useState({
    name: '', category: '', subcategory: '', area: '', address: '',
    phone: '', whatsapp: '', website: '', instagram: '',
    hours: '', priceRange: '', description: '',
  })

  // Logo state
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const logoInputRef = useRef(null)

  // Photos state (up to 5)
  const [photoFiles, setPhotoFiles] = useState([])
  const [photoPreviews, setPhotoPreviews] = useState([])
  const photoInputRef = useRef(null)

  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [uploadProgress, setUploadProgress] = useState('')

  // ─── Check auth on mount ───
  useEffect(() => {
    if (!supabase) { setAuthLoading(false); return }
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setAuthLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  // ─── Cleanup blob URLs on unmount ───
  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview)
      photoPreviews.forEach(p => URL.revokeObjectURL(p))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  // ─── Logo handlers ───
  function handleLogoSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Logo image must be under 5MB')
      return
    }
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }
    if (logoPreview) URL.revokeObjectURL(logoPreview)
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
    setError('')
  }

  function removeLogo() {
    if (logoPreview) URL.revokeObjectURL(logoPreview)
    setLogoFile(null)
    setLogoPreview(null)
    if (logoInputRef.current) logoInputRef.current.value = ''
  }

  // ─── Photo handlers ───
  function handlePhotosSelect(e) {
    const files = Array.from(e.target.files || [])
    if (photoFiles.length + files.length > 4) {
      setError('Maximum 4 photos allowed')
      return
    }
    const validFiles = files.filter(f => {
      if (f.size > 5 * 1024 * 1024) { setError('Each photo must be under 5MB'); return false }
      if (!f.type.startsWith('image/')) { setError('Only image files allowed'); return false }
      return true
    })
    setPhotoFiles(prev => [...prev, ...validFiles])
    setPhotoPreviews(prev => [...prev, ...validFiles.map(f => URL.createObjectURL(f))])
    setError('')
    if (photoInputRef.current) photoInputRef.current.value = ''
  }

  function removePhoto(index) {
    URL.revokeObjectURL(photoPreviews[index])
    setPhotoFiles(prev => prev.filter((_, i) => i !== index))
    setPhotoPreviews(prev => prev.filter((_, i) => i !== index))
  }

  // ─── Submit handler ───
  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.category || !form.area.trim()) {
      setError('Please fill in at least the business name, category, and area.')
      return
    }
    if (!supabase) {
      setError('Service unavailable. Please try again later.')
      return
    }
    setSubmitting(true)
    setError('')
    setUploadProgress('')

    try {
      let logoUrl = ''
      let photoUrls = []

      // Upload logo if provided
      if (logoFile) {
        setUploadProgress('Uploading logo...')
        try {
          logoUrl = await uploadBusinessFile(logoFile, 'logo')
        } catch (uploadErr) {
          console.warn('Logo upload failed:', uploadErr.message)
          // Non-blocking: continue without logo
        }
      }

      // Upload photos if provided
      if (photoFiles.length > 0) {
        for (let i = 0; i < photoFiles.length; i++) {
          setUploadProgress(`Uploading photo ${i + 1} of ${photoFiles.length}...`)
          try {
            const url = await uploadBusinessFile(photoFiles[i], 'photo')
            photoUrls.push(url)
          } catch (uploadErr) {
            console.warn(`Photo ${i + 1} upload failed:`, uploadErr.message)
            // Non-blocking: continue with remaining photos
          }
        }
      }

      setUploadProgress('Submitting listing...')

      const insertData = {
        name: form.name.trim(),
        category: form.category,
        subcategory: form.subcategory.trim() || null,
        area: form.area.trim(),
        address: form.address.trim() || null,
        phone: form.phone.trim() || null,
        whatsapp: form.whatsapp.trim() || null,
        website: form.website.trim() || null,
        instagram: form.instagram.trim() || null,
        hours: form.hours.trim() || null,
        price_range: form.priceRange || null,
        description: form.description.trim() || null,
        logo_url: logoUrl || null,
        photos: photoUrls.length > 0 ? photoUrls : null,
        status: 'pending',
        submitted_by: session?.user?.id || null,
      }

      const { error: insertError } = await supabase
        .from('business_listings')
        .insert([insertData])

      if (insertError) {
        console.error('Insert error:', insertError)
        throw new Error(insertError.message || 'Failed to submit listing. Please try again.')
      }

      setDone(true)
    } catch (err) {
      console.error('Listing submission error:', err)
      setError(err.message || 'Something went wrong. Please try again.')
    }
    setSubmitting(false)
    setUploadProgress('')
  }

  // ─── SUCCESS STATE ───
  if (done) {
    return (
      <section className="lb-form-page">
        <div className="lb-success">
          <span className="lb-success-icon">🎉</span>
          <h2>Listing submitted!</h2>
          <p>We will review your business and add it to Wanda within 24-48 hours.</p>
          <div className="lb-success-actions">
            <Link to="/explore" className="lb-back-link">Browse directory →</Link>
            <button className="lb-another-btn" onClick={() => {
              setDone(false)
              setForm({ name: '', category: '', subcategory: '', area: '', address: '', phone: '', whatsapp: '', website: '', instagram: '', hours: '', priceRange: '', description: '' })
              removeLogo()
              setPhotoFiles([])
              setPhotoPreviews([])
            }}>Submit another listing</button>
          </div>
        </div>
      </section>
    )
  }

  // ─── AUTH LOADING ───
  if (authLoading) {
    return (
      <section className="lb-form-page">
        <div className="lb-auth-prompt">
          <div className="lb-spinner" />
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      </section>
    )
  }

  // ─── NOT LOGGED IN ───
  if (!session) {
    return (
      <section className="lb-form-page">
        <div className="lb-auth-prompt">
          <div className="lb-auth-icon">🏪</div>
          <h2>Sign in to list your business</h2>
          <p>Create a free account to submit your business listing, upload your logo, and add photos.</p>
          <Link to="/auth?redirect=/list-your-business/form" className="lb-submit" style={{ textDecoration: 'none', textAlign: 'center', display: 'block' }}>
            Sign In / Sign Up
          </Link>
          <p className="lb-note" style={{ marginTop: '1rem' }}>
            It only takes 30 seconds. Your listing will be reviewed within 24-48 hours.
          </p>
        </div>
      </section>
    )
  }

  // ─── MAIN FORM ───
  return (
    <section className="lb-form-page">
      <div className="lb-form-header">
        <Link to="/list-your-business" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>← Back to info</Link>
        <h1>List your business</h1>
        <p>Get discovered by thousands of people exploring Lagos. Free to list.</p>
      </div>

      <form className="lb-form" onSubmit={handleSubmit}>
        {error && <div className="lb-error">{error}</div>}

        {/* ─── Basic Info ─── */}
        <fieldset className="lb-fieldset">
          <legend>Basic info</legend>
          <label className="lb-label">
            Business name *
            <input type="text" value={form.name} onChange={e => update('name', e.target.value)}
              placeholder="e.g. Mama Cass Restaurant" required />
          </label>
          <div className="lb-row">
            <label className="lb-label">
              Category *
              <select value={form.category} onChange={e => update('category', e.target.value)} required>
                <option value="">Select category</option>
                {CATS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </select>
            </label>
            <label className="lb-label">
              Sub-category
              <input type="text" value={form.subcategory} onChange={e => update('subcategory', e.target.value)}
                placeholder="e.g. Fine Dining, Boutique" />
            </label>
          </div>
          <div className="lb-row">
            <label className="lb-label">
              Area / Neighborhood *
              <input type="text" value={form.area} onChange={e => update('area', e.target.value)}
                placeholder="e.g. Victoria Island, Lekki" required />
            </label>
            <label className="lb-label">
              Price range
              <select value={form.priceRange} onChange={e => update('priceRange', e.target.value)}>
                <option value="">Select range</option>
                {PRICE_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </label>
          </div>
          <label className="lb-label">
            Full address
            <input type="text" value={form.address} onChange={e => update('address', e.target.value)}
              placeholder="Street address" />
          </label>
        </fieldset>

        {/* ─── Logo & Photos ─── */}
        <fieldset className="lb-fieldset">
          <legend>Logo & Photos</legend>

          <label className="lb-label">Business Logo</label>
          <div className="lb-upload-zone" onClick={() => !logoPreview && logoInputRef.current?.click()}>
            {logoPreview ? (
              <div className="lb-logo-preview">
                <img src={logoPreview} alt="Logo preview" />
                <button type="button" className="lb-remove-btn" onClick={e => { e.stopPropagation(); removeLogo() }}>✕</button>
              </div>
            ) : (
              <div className="lb-upload-placeholder">
                <span className="lb-upload-icon">🏷️</span>
                <span>Tap to upload your business logo</span>
                <span className="lb-upload-hint">JPG, PNG or WebP · Max 5MB</span>
              </div>
            )}
            <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoSelect} style={{ display: 'none' }} />
          </div>

          <label className="lb-label" style={{ marginTop: '0.75rem' }}>
            Business Photos <span className="lb-label-hint">(up to 4 — show your best!)</span>
          </label>
          <div className="lb-photos-grid">
            {photoPreviews.map((preview, i) => (
              <div key={i} className="lb-photo-thumb">
                <img src={preview} alt={`Photo ${i + 1}`} />
                <button type="button" className="lb-remove-btn" onClick={() => removePhoto(i)}>✕</button>
              </div>
            ))}
            {photoFiles.length < 4 && (
              <div className="lb-photo-add" onClick={() => photoInputRef.current?.click()}>
                <span className="lb-photo-add-icon">📸</span>
                <span className="lb-photo-add-label">Add photo</span>
              </div>
            )}
            <input ref={photoInputRef} type="file" accept="image/*" multiple onChange={handlePhotosSelect} style={{ display: 'none' }} />
          </div>
        </fieldset>

        {/* ─── Contact ─── */}
        <fieldset className="lb-fieldset">
          <legend>Contact</legend>
          <div className="lb-row">
            <label className="lb-label">
              Phone
              <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)}
                placeholder="08012345678" />
            </label>
            <label className="lb-label">
              WhatsApp
              <input type="tel" value={form.whatsapp} onChange={e => update('whatsapp', e.target.value)}
                placeholder="08012345678" />
            </label>
          </div>
          <div className="lb-row">
            <label className="lb-label">
              Website
              <input type="url" value={form.website} onChange={e => update('website', e.target.value)}
                placeholder="https://..." />
            </label>
            <label className="lb-label">
              Instagram
              <input type="text" value={form.instagram} onChange={e => update('instagram', e.target.value)}
                placeholder="@yourbusiness" />
            </label>
          </div>
        </fieldset>

        {/* ─── Details ─── */}
        <fieldset className="lb-fieldset">
          <legend>Details</legend>
          <label className="lb-label">
            Opening hours
            <input type="text" value={form.hours} onChange={e => update('hours', e.target.value)}
              placeholder="e.g. Mon-Sun 9AM-10PM" />
          </label>
          <label className="lb-label">
            Description
            <textarea value={form.description} onChange={e => update('description', e.target.value)}
              placeholder="Tell visitors what makes your business special (max 300 characters)"
              maxLength={300} rows={4} />
          </label>
        </fieldset>

        {/* ─── Upload progress indicator ─── */}
        {uploadProgress && (
          <div className="lb-progress">
            <div className="lb-spinner-small" />
            <span>{uploadProgress}</span>
          </div>
        )}

        <button type="submit" className="lb-submit" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit listing'}
        </button>
        <p className="lb-note">Listings are reviewed within 24-48 hours before going live.</p>
      </form>
    </section>
  )
}
