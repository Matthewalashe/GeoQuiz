import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase, uploadBusinessFile } from '../lib/supabase.js'

// ─── Expanded categories for informal sector ───
const CATS = [
  // Food & Hospitality
  { value: 'restaurant', label: 'Restaurant', emoji: '🍽️' },
  { value: 'cafe', label: 'Café / Coffee', emoji: '☕' },
  { value: 'hotel', label: 'Hotel / Lodge', emoji: '🏨' },
  { value: 'bar', label: 'Bar / Lounge', emoji: '🍸' },
  { value: 'nightlife', label: 'Nightlife / Club', emoji: '🎶' },
  // Shopping & Markets
  { value: 'shopping', label: 'Shopping / Retail', emoji: '🛍️' },
  { value: 'market', label: 'Market', emoji: '🏪' },
  { value: 'fashion', label: 'Fashion / Clothing', emoji: '👗' },
  // Tourism & Culture
  { value: 'attraction', label: 'Attraction / Landmark', emoji: '📍' },
  { value: 'park', label: 'Park / Nature', emoji: '🌿' },
  { value: 'culture', label: 'Culture / Museum', emoji: '🎭' },
  { value: 'heritage', label: 'Heritage Site', emoji: '🏛️' },
  { value: 'beach', label: 'Beach', emoji: '🏖️' },
  { value: 'experience', label: 'Experience / Activity', emoji: '⭐' },
  { value: 'event', label: 'Events / Venue', emoji: '🎪' },
  { value: 'art', label: 'Art / Gallery', emoji: '🎨' },
  // Services & Informal Sector
  { value: 'artisan', label: 'Artisan / Craftsperson', emoji: '🔨' },
  { value: 'handyman', label: 'Handyman / Repairs', emoji: '🔧' },
  { value: 'tour-guide', label: 'Tour Guide', emoji: '🗺️' },
  { value: 'trader', label: 'Trader / Vendor', emoji: '📦' },
  { value: 'tailor', label: 'Tailor / Seamstress', emoji: '🧵' },
  { value: 'salon', label: 'Salon / Barber', emoji: '💇' },
  { value: 'photography', label: 'Photography / Video', emoji: '📸' },
  { value: 'logistics', label: 'Logistics / Delivery', emoji: '🚚' },
  { value: 'transport', label: 'Transport / Driver', emoji: '🚗' },
  { value: 'cleaning', label: 'Cleaning / Laundry', emoji: '🧹' },
  { value: 'catering', label: 'Catering / Food Service', emoji: '🍲' },
  // Professional
  { value: 'tech', label: 'Tech / Digital', emoji: '💻' },
  { value: 'coworking', label: 'Coworking Space', emoji: '🏢' },
  { value: 'education', label: 'Education / Tutoring', emoji: '📚' },
  { value: 'healthcare', label: 'Healthcare / Clinic', emoji: '🏥' },
  { value: 'fitness', label: 'Fitness / Gym', emoji: '💪' },
  { value: 'spa', label: 'Spa / Wellness', emoji: '🧖' },
  { value: 'real-estate', label: 'Real Estate', emoji: '🏠' },
  { value: 'entertainment', label: 'Entertainment', emoji: '🎬' },
  { value: 'services', label: 'Other Services', emoji: '🛠️' },
]

// ─── Handyman trade categories ───
const TRADES = [
  { value: 'plumber', label: 'Plumber', emoji: '🔧' },
  { value: 'electrician', label: 'Electrician', emoji: '⚡' },
  { value: 'carpenter', label: 'Carpenter', emoji: '🪚' },
  { value: 'painter', label: 'Painter', emoji: '🎨' },
  { value: 'welder', label: 'Welder', emoji: '🔩' },
  { value: 'mechanic', label: 'Mechanic', emoji: '🔧' },
  { value: 'tailor', label: 'Tailor / Seamstress', emoji: '🧵' },
  { value: 'bricklayer', label: 'Bricklayer / Mason', emoji: '🧱' },
  { value: 'tiler', label: 'Tiler', emoji: '🔲' },
  { value: 'ac-technician', label: 'AC / Refrigerator', emoji: '❄️' },
  { value: 'generator-repairer', label: 'Generator Repairer', emoji: '⚙️' },
  { value: 'vulcanizer', label: 'Vulcanizer', emoji: '🛞' },
  { value: 'barber', label: 'Barber / Hairstylist', emoji: '💇' },
  { value: 'phone-repairer', label: 'Phone / Laptop', emoji: '📱' },
  { value: 'cobbler', label: 'Cobbler', emoji: '👞' },
  { value: 'furniture-maker', label: 'Furniture Maker', emoji: '🪑' },
  { value: 'interior-decorator', label: 'POP / Interior', emoji: '🏠' },
  { value: 'pest-control', label: 'Pest Control', emoji: '🐛' },
]

const PRICE_OPTIONS = [
  { value: '₦', label: '₦ — Budget' },
  { value: '₦₦', label: '₦₦ — Mid-range' },
  { value: '₦₦₦', label: '₦₦₦ — Premium' },
  { value: '₦₦₦₦', label: '₦₦₦₦ — Luxury' },
]

const BUSINESS_STEPS = [
  { id: 'info', title: 'Business Info', emoji: '🏪', desc: 'Tell us about your business' },
  { id: 'media', title: 'Logo & Photos', emoji: '📸', desc: 'Show off your business' },
  { id: 'contact', title: 'Contact', emoji: '📞', desc: 'How can customers reach you?' },
  { id: 'details', title: 'Details', emoji: '📝', desc: 'Hours and description' },
  { id: 'review', title: 'Review', emoji: '✅', desc: 'Preview and submit' },
]

const HANDYMAN_STEPS = [
  { id: 'info', title: 'Your Trade', emoji: '🔧', desc: 'Tell us what you do' },
  { id: 'media', title: 'Photos', emoji: '📸', desc: 'Show your work' },
  { id: 'contact', title: 'Contact', emoji: '📞', desc: 'How can customers reach you?' },
  { id: 'details', title: 'Details', emoji: '📝', desc: 'Experience and description' },
  { id: 'review', title: 'Review', emoji: '✅', desc: 'Preview and submit' },
]

export default function ListBusiness({ embedded = false }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [step, setStep] = useState(0)
  const [animDir, setAnimDir] = useState('next') // 'next' | 'prev'

  // Listing type: 'business' or 'handyman'
  const [listingType, setListingType] = useState(() => searchParams.get('type') || 'business')
  const STEPS = listingType === 'handyman' ? HANDYMAN_STEPS : BUSINESS_STEPS

  const [form, setForm] = useState({
    name: '', category: '', subcategory: '', area: '', address: '',
    phone: '', whatsapp: '', website: '', instagram: '',
    hours: '', priceRange: '', description: '',
    products: [''], // array of product/service strings
    // Handyman fields
    trade: '', experienceYears: '', serviceAreas: [''],
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

  // Cleanup blob URLs
  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview)
      photoPreviews.forEach(p => URL.revokeObjectURL(p))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function update(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  // ─── Product handlers ───
  function addProduct() {
    if (form.products.length >= 10) return
    setForm(prev => ({ ...prev, products: [...prev.products, ''] }))
  }
  function updateProduct(idx, value) {
    setForm(prev => {
      const products = [...prev.products]
      products[idx] = value
      return { ...prev, products }
    })
  }
  function removeProduct(idx) {
    if (form.products.length <= 1) return
    setForm(prev => ({ ...prev, products: prev.products.filter((_, i) => i !== idx) }))
  }

  // ─── Service area handlers (handyman) ───
  function addServiceArea() {
    if (form.serviceAreas.length >= 5) return
    setForm(prev => ({ ...prev, serviceAreas: [...prev.serviceAreas, ''] }))
  }
  function updateServiceArea(idx, value) {
    setForm(prev => {
      const serviceAreas = [...prev.serviceAreas]
      serviceAreas[idx] = value
      return { ...prev, serviceAreas }
    })
  }
  function removeServiceArea(idx) {
    if (form.serviceAreas.length <= 1) return
    setForm(prev => ({ ...prev, serviceAreas: prev.serviceAreas.filter((_, i) => i !== idx) }))
  }

  // ─── Logo handlers ───
  function handleLogoSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('Logo image must be under 5MB'); return }
    if (!file.type.startsWith('image/')) { setError('Please upload an image file'); return }
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
    if (photoFiles.length + files.length > 5) { setError('Maximum 5 photos allowed'); return }
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

  // ─── Navigation ───
  function goNext() {
    if (step === 0) {
      if (!form.name.trim() || !form.area.trim()) {
        setError('Please fill in your name and area.')
        return
      }
      if (listingType === 'business' && !form.category) {
        setError('Please select a category.')
        return
      }
      if (listingType === 'handyman' && !form.trade) {
        setError('Please select your trade.')
        return
      }
    }
    setError('')
    setAnimDir('next')
    setStep(s => Math.min(s + 1, STEPS.length - 1))
  }

  function goBack() {
    setError('')
    setAnimDir('prev')
    setStep(s => Math.max(s - 1, 0))
  }

  // ─── Submit ───
  async function handleSubmit() {
    if (!supabase) { setError('Service unavailable.'); return }
    setSubmitting(true)
    setError('')
    setUploadProgress('')

    try {
      let logoUrl = ''
      let photoUrls = []

      if (logoFile) {
        setUploadProgress('Uploading logo...')
        try { logoUrl = await uploadBusinessFile(logoFile, 'logo') }
        catch (e) { console.warn('Logo upload failed:', e.message) }
      }

      if (photoFiles.length > 0) {
        for (let i = 0; i < photoFiles.length; i++) {
          setUploadProgress(`Uploading photo ${i + 1} of ${photoFiles.length}...`)
          try { photoUrls.push(await uploadBusinessFile(photoFiles[i], 'photo')) }
          catch (e) { console.warn(`Photo ${i + 1} upload failed:`, e.message) }
        }
      }

      setUploadProgress('Submitting listing...')

      const products = form.products.map(p => p.trim()).filter(Boolean)
      const serviceAreas = form.serviceAreas.map(a => a.trim()).filter(Boolean)

      const insertData = {
        listing_type: listingType,
        name: form.name.trim(),
        category: listingType === 'handyman' ? 'handyman' : form.category,
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
        products: products.length > 0 ? products : null,
        // Handyman-specific fields
        trade: listingType === 'handyman' ? form.trade : null,
        experience_years: listingType === 'handyman' && form.experienceYears ? parseInt(form.experienceYears, 10) : null,
        service_areas: serviceAreas.length > 0 ? serviceAreas : null,
        status: 'pending',
        submitted_by: session?.user?.id || null,
      }

      const { error: insertError } = await supabase
        .from('business_listings')
        .insert([insertData])

      if (insertError) throw new Error(insertError.message || 'Failed to submit.')

      setDone(true)
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    }
    setSubmitting(false)
    setUploadProgress('')
  }

  // ═══ SUCCESS ═══
  if (done) {
    return (
      <section className="lb-form-page">
        <div className="lb-success">
          <span className="lb-success-icon">🎉</span>
          <h2>Listing submitted!</h2>
          <p>We'll review your business and add it to Wanda within 24-48 hours.</p>
          <div className="lb-success-actions">
            <Link to="/explore" className="lb-back-link">Browse directory →</Link>
            <button className="lb-another-btn" onClick={() => {
              setDone(false); setStep(0)
              setForm({ name: '', category: '', subcategory: '', area: '', address: '', phone: '', whatsapp: '', website: '', instagram: '', hours: '', priceRange: '', description: '', products: [''], trade: '', experienceYears: '', serviceAreas: [''] })
              setListingType('business')
              removeLogo(); setPhotoFiles([]); setPhotoPreviews([])
            }}>Submit another listing</button>
          </div>
        </div>
      </section>
    )
  }

  // ═══ AUTH LOADING ═══
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

  // ═══ NOT LOGGED IN ═══
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

  // ═══ WIZARD ═══
  const catObj = CATS.find(c => c.value === form.category)
  const tradeObj = TRADES.find(t => t.value === form.trade)

  return (
    <section className="lb-form-page">
      <div className="lb-form-header">
        {!embedded && <Link to="/list-your-business" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.5rem' }}>← Back to info</Link>}
        <h1>{listingType === 'handyman' ? 'List your trade' : 'List your business'}</h1>
        <p>Get discovered by thousands of people exploring Lagos. Free to list.</p>
      </div>

      {/* ─── Progress Bar ─── */}
      <div className="lb-wizard-progress">
        {STEPS.map((s, i) => (
          <div key={s.id} className={`lb-wiz-step ${i < step ? 'done' : ''} ${i === step ? 'active' : ''}`}>
            <div className="lb-wiz-dot">
              {i < step ? '✓' : s.emoji}
            </div>
            <span className="lb-wiz-label">{s.title}</span>
          </div>
        ))}
        <div className="lb-wiz-line">
          <div className="lb-wiz-line-fill" style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }} />
        </div>
      </div>

      {error && <div className="lb-error">{error}</div>}

      {/* ─── Step Content ─── */}
      <div className={`lb-step-content lb-anim-${animDir}`} key={`${listingType}-${step}`}>
        <div className="lb-step-header">
          <span className="lb-step-emoji">{STEPS[step].emoji}</span>
          <h2 className="lb-step-title">{STEPS[step].title}</h2>
          <p className="lb-step-desc">{STEPS[step].desc}</p>
        </div>

        {/* ═══ STEP 1: Info ═══ */}
        {step === 0 && (
          <div className="lb-fields">
            {/* Listing type toggle */}
            <div className="lb-type-toggle">
              <button
                type="button"
                className={`lb-type-btn ${listingType === 'business' ? 'active' : ''}`}
                onClick={() => { setListingType('business'); update('trade', '') }}
              >
                <span>🏪</span> I'm a Business
              </button>
              <button
                type="button"
                className={`lb-type-btn ${listingType === 'handyman' ? 'active' : ''}`}
                onClick={() => { setListingType('handyman'); update('category', '') }}
              >
                <span>🔧</span> I'm a Handyman / Artisan
              </button>
            </div>

            <label className="lb-label">
              {listingType === 'handyman' ? 'Your name / business name *' : 'Business name *'}
              <input type="text" value={form.name} onChange={e => update('name', e.target.value)}
                placeholder={listingType === 'handyman' ? 'e.g. Emeka Plumbing, Ade the Electrician' : 'e.g. Mama Cass Restaurant'} />
            </label>

            {/* ── Business-specific fields ── */}
            {listingType === 'business' && (
              <>
                <label className="lb-label">
                  Category *
                  <div className="lb-cat-grid">
                    {CATS.map(c => (
                      <button key={c.value} type="button"
                        className={`lb-cat-chip ${form.category === c.value ? 'selected' : ''}`}
                        onClick={() => update('category', c.value)}>
                        <span>{c.emoji}</span> {c.label}
                      </button>
                    ))}
                  </div>
                </label>

                <label className="lb-label">
                  Sub-category
                  <input type="text" value={form.subcategory} onChange={e => update('subcategory', e.target.value)}
                    placeholder="e.g. Fine Dining, Boutique" />
                </label>
              </>
            )}

            {/* ── Handyman-specific fields ── */}
            {listingType === 'handyman' && (
              <>
                <label className="lb-label">
                  Your trade *
                  <div className="lb-cat-grid">
                    {TRADES.map(t => (
                      <button key={t.value} type="button"
                        className={`lb-cat-chip ${form.trade === t.value ? 'selected' : ''}`}
                        onClick={() => update('trade', t.value)}>
                        <span>{t.emoji}</span> {t.label}
                      </button>
                    ))}
                  </div>
                </label>

                <label className="lb-label">
                  Years of experience
                  <input type="number" value={form.experienceYears} onChange={e => update('experienceYears', e.target.value)}
                    placeholder="e.g. 5" min="0" max="50" />
                </label>
              </>
            )}

            <div className="lb-row">
              <label className="lb-label">
                Area / Neighborhood *
                <input type="text" value={form.area} onChange={e => update('area', e.target.value)}
                  placeholder="e.g. Victoria Island, Lekki" />
              </label>
              {listingType === 'business' && (
                <label className="lb-label">
                  Price range
                  <select value={form.priceRange} onChange={e => update('priceRange', e.target.value)}>
                    <option value="">Select range</option>
                    {PRICE_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </label>
              )}
            </div>

            <label className="lb-label">
              Full address
              <input type="text" value={form.address} onChange={e => update('address', e.target.value)}
                placeholder="Street address" />
            </label>

            {/* Service areas (handyman) */}
            {listingType === 'handyman' && (
              <div className="lb-products-section">
                <label className="lb-label">Areas you serve</label>
                <p className="lb-products-hint">Add neighborhoods or areas you cover (up to 5)</p>
                {form.serviceAreas.map((area, i) => (
                  <div key={i} className="lb-product-row">
                    <input
                      type="text" value={area}
                      onChange={e => updateServiceArea(i, e.target.value)}
                      placeholder={i === 0 ? 'e.g. Lekki, Victoria Island, Surulere...' : 'Add another area...'}
                      maxLength={40}
                    />
                    {form.serviceAreas.length > 1 && (
                      <button type="button" className="lb-product-remove" onClick={() => removeServiceArea(i)}>✕</button>
                    )}
                  </div>
                ))}
                {form.serviceAreas.length < 5 && (
                  <button type="button" className="lb-product-add" onClick={addServiceArea}>
                    + Add {form.serviceAreas.length === 1 && form.serviceAreas[0] === '' ? 'a service area' : 'another area'}
                  </button>
                )}
              </div>
            )}

            {/* Products / Services (business) */}
            {listingType === 'business' && (
              <div className="lb-products-section">
                <label className="lb-label">Products / Services you offer</label>
                <p className="lb-products-hint">Add what you sell or services you provide (up to 10)</p>
                {form.products.map((prod, i) => (
                  <div key={i} className="lb-product-row">
                    <input
                      type="text" value={prod}
                      onChange={e => updateProduct(i, e.target.value)}
                      placeholder={i === 0 ? 'e.g. Jollof Rice, Hair Braiding, Plumbing...' : 'Add another...'}
                      maxLength={60}
                    />
                    {form.products.length > 1 && (
                      <button type="button" className="lb-product-remove" onClick={() => removeProduct(i)}>✕</button>
                    )}
                  </div>
                ))}
                {form.products.length < 10 && (
                  <button type="button" className="lb-product-add" onClick={addProduct}>
                    + Add {form.products.length === 1 && form.products[0] === '' ? 'a product or service' : 'another'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ═══ STEP 2: Logo & Photos ═══ */}
        {step === 1 && (
          <div className="lb-fields">
            <label className="lb-label">Business Logo / Profile Image</label>
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

            <label className="lb-label" style={{ marginTop: '1rem' }}>
              Business Photos <span className="lb-label-hint">(up to 5 — show your best!)</span>
            </label>
            <div className="lb-photos-grid">
              {photoPreviews.map((preview, i) => (
                <div key={i} className="lb-photo-thumb">
                  <img src={preview} alt={`Photo ${i + 1}`} />
                  <button type="button" className="lb-remove-btn" onClick={() => removePhoto(i)}>✕</button>
                </div>
              ))}
              {photoFiles.length < 5 && (
                <div className="lb-photo-add" onClick={() => photoInputRef.current?.click()}>
                  <span className="lb-photo-add-icon">📸</span>
                  <span className="lb-photo-add-label">Add photo</span>
                </div>
              )}
              <input ref={photoInputRef} type="file" accept="image/*" multiple onChange={handlePhotosSelect} style={{ display: 'none' }} />
            </div>
            <p className="lb-upload-hint" style={{ marginTop: '0.5rem' }}>
              Good photos help customers find you. Show your storefront, products, or workspace.
            </p>
          </div>
        )}

        {/* ═══ STEP 3: Contact ═══ */}
        {step === 2 && (
          <div className="lb-fields">
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
          </div>
        )}

        {/* ═══ STEP 4: Details ═══ */}
        {step === 3 && (
          <div className="lb-fields">
            <label className="lb-label">
              Opening hours
              <input type="text" value={form.hours} onChange={e => update('hours', e.target.value)}
                placeholder="e.g. Mon-Sun 9AM-10PM" />
            </label>
            <label className="lb-label">
              Description
              <textarea value={form.description} onChange={e => update('description', e.target.value)}
                placeholder="Tell visitors what makes your business special (max 300 characters)"
                maxLength={300} rows={5} />
              <span className="lb-char-count">{form.description.length}/300</span>
            </label>
          </div>
        )}

        {/* ═══ STEP 5: Review ═══ */}
        {step === 4 && (
          <div className="lb-review">
            <div className="lb-review-card">
              {/* Gallery preview */}
              {(logoPreview || photoPreviews.length > 0) && (
                <div className="lb-review-gallery">
                  {logoPreview && (
                    <div className="lb-review-logo">
                      <img src={logoPreview} alt="Logo" />
                    </div>
                  )}
                  {photoPreviews.length > 0 && (
                    <div className="lb-review-photos">
                      {photoPreviews.map((p, i) => (
                        <img key={i} src={p} alt={`Photo ${i + 1}`} />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Info */}
              <div className="lb-review-info">
                <div className="lb-review-cat">
                  {listingType === 'handyman' && tradeObj && <span className="lb-review-cat-badge">{tradeObj.emoji} {tradeObj.label}</span>}
                  {listingType === 'business' && catObj && <span className="lb-review-cat-badge">{catObj.emoji} {catObj.label}</span>}
                  {form.priceRange && <span className="lb-review-price">{form.priceRange}</span>}
                  {listingType === 'handyman' && <span className="lb-review-cat-badge" style={{ background: 'var(--primary)', color: '#fff' }}>🔧 Handyman</span>}
                </div>
                <h3 className="lb-review-name">{form.name || (listingType === 'handyman' ? 'Your Name' : 'Business Name')}</h3>
                {form.subcategory && <p className="lb-review-sub">{form.subcategory}</p>}
                <p className="lb-review-area">📍 {form.area || 'Area'}{form.address ? ` · ${form.address}` : ''}</p>

                {form.description && <p className="lb-review-desc">{form.description}</p>}

                {/* Experience (handyman) */}
                {listingType === 'handyman' && form.experienceYears && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>🛠️ {form.experienceYears}+ years experience</p>
                )}

                {/* Service areas (handyman) */}
                {listingType === 'handyman' && form.serviceAreas.some(a => a.trim()) && (
                  <div className="lb-review-products">
                    <strong>Areas Served</strong>
                    <div className="lb-review-product-list">
                      {form.serviceAreas.filter(a => a.trim()).map((a, i) => (
                        <span key={i} className="lb-review-product-tag">📍 {a.trim()}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Products (business) */}
                {listingType === 'business' && form.products.some(p => p.trim()) && (
                  <div className="lb-review-products">
                    <strong>Products & Services</strong>
                    <div className="lb-review-product-list">
                      {form.products.filter(p => p.trim()).map((p, i) => (
                        <span key={i} className="lb-review-product-tag">{p.trim()}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact */}
                <div className="lb-review-contact">
                  {form.phone && <div>📞 {form.phone}</div>}
                  {form.whatsapp && <div>💬 {form.whatsapp}</div>}
                  {form.website && <div>🌐 {form.website}</div>}
                  {form.instagram && <div>📷 {form.instagram}</div>}
                  {form.hours && <div>🕐 {form.hours}</div>}
                </div>
              </div>
            </div>

            {uploadProgress && (
              <div className="lb-progress">
                <div className="lb-spinner-small" />
                <span>{uploadProgress}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Navigation ─── */}
      <div className="lb-wizard-nav">
        {step > 0 && (
          <button type="button" className="lb-nav-back" onClick={goBack} disabled={submitting}>
            ← Back
          </button>
        )}
        <div style={{ flex: 1 }} />
        {step < STEPS.length - 1 ? (
          <button type="button" className="lb-nav-next" onClick={goNext}>
            Continue →
          </button>
        ) : (
          <button type="button" className="lb-submit" onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Listing ✨'}
          </button>
        )}
      </div>

      <p className="lb-note">Listings are reviewed within 24-48 hours before going live.</p>
    </section>
  )
}
