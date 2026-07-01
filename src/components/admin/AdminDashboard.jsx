import { useState, useEffect, useCallback } from 'react'
import '../../admin.css'
import { adminFetch, adminUpsert, adminDelete, uploadFile, clearCache } from '../../lib/cms.js'
import { supabase, signOut } from '../../lib/supabase.js'
import AdminGuard from './AdminGuard.jsx'
import {
  DataBarVerticalRegular, LocationRegular, GiftRegular, DiamondRegular,
  MapRegular, QuestionRegular, SettingsRegular, CheckmarkCircleRegular,
  DismissCircleRegular, MailInboxRegular, WrenchRegular, PeopleRegular,
  PersonRegular, ShieldCheckmarkRegular, EditRegular,
  CoinMultipleRegular, StoreMicrosoftRegular, PlayCircleRegular,
  ArrowSortRegular, BookQuestionMarkRegular, CalendarRegular,
  ImageRegular, TextFontRegular, GlobeRegular
} from '@fluentui/react-icons'

// Section configs
const SECTIONS = [
  { id: 'overview', label: 'Overview', icon: <DataBarVerticalRegular /> },
  { id: 'listings', label: 'Listings', icon: <LocationRegular />, table: 'cms_listings' },
  { id: 'deals', label: 'Deals', icon: <GiftRegular />, table: 'cms_deals' },
  { id: 'sponsors', label: 'Sponsors', icon: <DiamondRegular />, table: 'cms_sponsors' },
  { id: 'discovery', label: 'Discovery', icon: <MapRegular />, table: 'cms_discovery' },
  { id: 'questions', label: 'Questions', icon: <QuestionRegular />, table: 'cms_questions' },
  { id: 'wordgame', label: 'Word Game', icon: <TextFontRegular />, table: 'cms_wordgame' },
  { id: 'submissions', label: 'Submissions', icon: <MailInboxRegular />, },
  { id: 'handymen', label: 'Handymen', icon: <WrenchRegular />, },
  { id: 'hero_page', label: 'Hero Page', icon: <ImageRegular /> },
  { id: 'seo_og', label: 'SEO / OG Images', icon: <GlobeRegular /> },
  { id: 'users', label: 'Users', icon: <PeopleRegular /> },
  { id: 'settings', label: 'Settings', icon: <SettingsRegular /> },
  // ─── Game Engine Config ───
  { id: '_divider_game', label: '── Game Engine ──', divider: true },
  { id: 'coin_config', label: 'Coin Config', icon: <CoinMultipleRegular />, gameTable: 'coin_config' },
  { id: 'store_items', label: 'Store Items', icon: <StoreMicrosoftRegular />, gameTable: 'store_items' },
  { id: 'game_config', label: 'Games', icon: <PlayCircleRegular />, gameTable: 'game_config' },
  { id: 'level_config', label: 'Level Config', icon: <ArrowSortRegular />, gameTable: 'level_config' },
  { id: 'question_bank', label: 'Question Bank', icon: <BookQuestionMarkRegular />, gameTable: 'questions' },
  { id: 'seasons', label: 'Seasons', icon: <CalendarRegular />, gameTable: 'seasons' },
]

const FIELD_DEFS = {
  cms_listings: [
    { key: 'id', label: 'Slug ID', type: 'text', required: true, placeholder: 'e.g. nok-vi' },
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'category', label: 'Category', type: 'select', options: ['restaurant','hotel','attraction','nightlife','park','culture','experience','shopping','event','heritage','market','beach','art'] },
    { key: 'subcategory', label: 'Subcategory', type: 'text' },
    { key: 'area', label: 'Area', type: 'text', placeholder: 'e.g. Victoria Island' },
    { key: 'price_min', label: 'Price From (₦)', type: 'number', placeholder: 'e.g. 3000' },
    { key: 'price_max', label: 'Price To (₦)', type: 'number', placeholder: 'e.g. 15000' },
    { key: 'rating', label: 'Rating', type: 'number', step: '0.1', min: 0, max: 5 },
    { key: 'phone', label: 'Phone', type: 'text' },
    { key: 'whatsapp', label: 'WhatsApp', type: 'text' },
    { key: 'website', label: 'Website', type: 'text' },
    { key: 'instagram', label: 'Instagram', type: 'text' },
    { key: 'hours', label: 'Hours', type: 'text' },
    { key: 'lat', label: 'Latitude', type: 'number', step: '0.000001' },
    { key: 'lng', label: 'Longitude', type: 'number', step: '0.000001' },
    { key: 'description', label: 'Description', type: 'textarea', full: true },
    { key: 'tags', label: 'Tags (comma-separated)', type: 'text', full: true, placeholder: 'fine dining, african, date night' },
    { key: 'status', label: 'Status', type: 'select', options: ['draft','published','archived'] },
  ],
  cms_deals: [
    { key: 'id', label: 'Deal ID', type: 'text', required: true },
    { key: 'business', label: 'Business', type: 'text', required: true },
    { key: 'category', label: 'Category', type: 'select', options: ['food','hotels','beaches','fitness','cowork','cinema','theater','shopping','bars'] },
    { key: 'category_label', label: 'Category Label', type: 'text' },
    { key: 'location', label: 'Location', type: 'text' },
    { key: 'lat', label: 'Latitude', type: 'number', step: '0.000001' },
    { key: 'lng', label: 'Longitude', type: 'number', step: '0.000001' },
    { key: 'offer', label: 'Offer Text', type: 'text', required: true },
    { key: 'mechanic', label: 'Mechanic', type: 'select', options: ['show_screen','quest_complete','flash'] },
    { key: 'quest_unlock', label: 'Quest Unlock', type: 'text' },
    { key: 'description', label: 'Description', type: 'textarea', full: true },
    { key: 'expiry', label: 'Expiry Date', type: 'date' },
    { key: 'badge', label: 'Badge Emoji', type: 'text' },
    { key: 'color', label: 'Color', type: 'color' },
    { key: 'sponsor', label: 'Sponsored', type: 'checkbox' },
    { key: 'featured', label: 'Featured', type: 'checkbox' },
    { key: 'status', label: 'Status', type: 'select', options: ['draft','published','archived'] },
  ],
  cms_sponsors: [
    { key: 'id', label: 'Sponsor ID', type: 'text', required: true },
    { key: 'brand', label: 'Brand Name', type: 'text', required: true },
    { key: 'icon', label: 'Icon Emoji', type: 'text' },
    { key: 'message', label: 'Message', type: 'text' },
    { key: 'cta', label: 'CTA Label', type: 'text' },
    { key: 'url', label: 'CTA URL', type: 'text' },
    { key: 'tier', label: 'Tier', type: 'select', options: ['bronze','silver','gold'] },
    { key: 'active', label: 'Active', type: 'checkbox' },
    { key: 'status', label: 'Status', type: 'select', options: ['draft','published','archived'] },
  ],
  cms_discovery: [
    { key: 'id', label: 'POI ID', type: 'text', required: true },
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'category', label: 'Category', type: 'select', options: ['food','nightlife','bars','beaches','parks','cinema','art','fitness','shopping','hotels','coworking','sports','kids','transport','wifi','handymen','services'] },
    { key: 'lat', label: 'Latitude', type: 'number', step: '0.000001' },
    { key: 'lng', label: 'Longitude', type: 'number', step: '0.000001' },
    { key: 'area', label: 'Area', type: 'text' },
    { key: 'rating', label: 'Rating', type: 'number', step: '0.1', min: 0, max: 5 },
    { key: 'description', label: 'Description', type: 'textarea', full: true },
    { key: 'cta', label: 'CTA Label', type: 'text' },
    { key: 'map_url', label: 'Map URL', type: 'text', full: true },
    { key: 'sponsored', label: 'Sponsored', type: 'checkbox' },
    { key: 'status', label: 'Status', type: 'select', options: ['draft','published','archived'] },
  ],
  cms_questions: [
    { key: 'id', label: 'Question ID', type: 'text', required: true, placeholder: 'e.g. lga-21' },
    { key: 'category', label: 'Category', type: 'select', options: ['lgas','landmarks','markets','transport','education','islands','culture','industry','tourism','nature','health','history'] },
    { key: 'category_label', label: 'Category Label', type: 'text' },
    { key: 'difficulty', label: 'Difficulty', type: 'select', options: ['beginner','intermediate','expert'] },
    { key: 'region', label: 'Region', type: 'select', options: ['lagos','abuja'] },
    { key: 'question', label: 'Question', type: 'textarea', required: true, full: true },
    { key: 'hint', label: 'Hint', type: 'text', full: true },
    { key: 'answer_lat', label: 'Answer Lat', type: 'number', step: '0.000001' },
    { key: 'answer_lng', label: 'Answer Lng', type: 'number', step: '0.000001' },
    { key: 'answer_name', label: 'Answer Name', type: 'text' },
    { key: 'answer_description', label: 'Answer Desc', type: 'textarea', full: true },
    { key: 'fun_fact', label: 'Fun Fact', type: 'textarea', full: true },
    { key: 'status', label: 'Status', type: 'select', options: ['draft','published','archived'] },
  ],
  cms_wordgame: [
    { key: 'word_id', label: 'Word ID', type: 'text', required: true, placeholder: 'e.g. w-101' },
    { key: 'word', label: 'Word', type: 'text', required: true, placeholder: 'e.g. LAGOS' },
    { key: 'clue', label: 'Clue', type: 'text', required: true, full: true, placeholder: 'A hint to help players guess' },
    { key: 'category', label: 'Category', type: 'select', options: ['Place','Person','Culture','Food','Nature','History','Language','Sport','Music','Art'] },
    { key: 'image', label: 'Image URL', type: 'text', full: true },
    { key: 'description', label: 'Description', type: 'textarea', required: true, full: true },
    { key: 'history', label: 'History Notes (JSON array)', type: 'textarea', full: true, placeholder: '["Fact 1", "Fact 2", "Fact 3"]' },
    { key: 'footnotes', label: 'Footnotes (JSON array)', type: 'textarea', full: true, placeholder: '["Source 1", "Source 2"]' },
    { key: 'sort_order', label: 'Sort Order', type: 'number' },
  ],
}

const TABLE_COLS = {
  cms_listings: ['name','category','area','rating','status'],
  cms_deals: ['business','offer','category','expiry','featured','status'],
  cms_sponsors: ['brand','tier','active','status'],
  cms_discovery: ['name','category','area','rating','sponsored','status'],
  cms_questions: ['question','category','difficulty','region','status'],
  cms_wordgame: ['word','clue','category','sort_order'],
}

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [onClose])
  return <div className={`admin-toast admin-toast-${type}`}>{type === 'success' ? <CheckmarkCircleRegular style={{ verticalAlign: 'middle' }} /> : <DismissCircleRegular style={{ verticalAlign: 'middle' }} />} {msg}</div>
}

function CrudSection({ table, session, profile }) {
  const userRole = profile?.role || 'user'
  const canCreate = userRole === 'admin' || userRole === 'editor'
  const canDelete = userRole === 'admin'
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // null | 'create' | row object
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [uploading, setUploading] = useState(false)

  const fields = FIELD_DEFS[table] || []
  const cols = TABLE_COLS[table] || []

  const load = useCallback(async () => {
    setLoading(true)
    try { 
      setRows(await adminFetch(table)) 
    } catch (e) { 
      console.error(e)
      if (e.message?.includes('relation') || e.code === '42P01') {
        setToast({ msg: `Table ${table} does not exist. Run migration-cms.sql`, type: 'error' })
      }
    }
    setLoading(false)
  }, [table])

  useEffect(() => { load() }, [load])

  function openCreate() {
    const defaults = {}
    fields.forEach(f => { defaults[f.key] = f.type === 'checkbox' ? false : '' })
    defaults.status = 'draft'
    setForm(defaults)
    setModal('create')
  }

  function openEdit(row) {
    const formData = { ...row }
    // Convert tags array to comma-separated string for editing
    if (Array.isArray(formData.tags)) {
      formData.tags = formData.tags.join(', ')
    }
    // For discovery: map 'images' column → 'photos' for the form UI
    if (table === 'cms_discovery' && !formData.photos && formData.images) {
      formData.photos = Array.isArray(formData.images) ? formData.images : []
    }
    setForm(formData)
    setModal(row)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const record = { ...form }
      if (modal === 'create') {
        record.created_by = session.user.id
      }
      record.updated_by = session.user.id
      record.updated_at = new Date().toISOString()
      
      // Convert tags from comma-separated string to array
      if (typeof record.tags === 'string') {
        record.tags = record.tags.split(',').map(t => t.trim()).filter(Boolean)
      }
      // Ensure photos is always an array
      if (record.photos && !Array.isArray(record.photos)) {
        record.photos = [record.photos]
      }
      // Convert price fields to numbers
      if (record.price_min) record.price_min = parseInt(record.price_min, 10) || null
      if (record.price_max) record.price_max = parseInt(record.price_max, 10) || null

      // For discovery: sync photos → images column too
      if (table === 'cms_discovery' && record.photos) {
        record.images = record.photos
      }

      // Strip fields not defined in FIELD_DEFS for this table to avoid
      // "column not found in schema cache" errors from unknown fields.
      const knownKeys = new Set((FIELD_DEFS[table] || []).map(f => f.key))
      // Always allow these system fields
      ;['created_by','updated_by','created_at','updated_at','photos','images','tags'].forEach(k => knownKeys.add(k))
      const cleanRecord = {}
      for (const [k, v] of Object.entries(record)) {
        if (knownKeys.has(k)) cleanRecord[k] = v
      }

      await adminUpsert(table, cleanRecord)
      setToast({ msg: 'Saved successfully', type: 'success' })
      setModal(null)
      load()
    } catch (e) {
      if (e.message?.includes('row-level security') || e.code === '42501' || e.message?.includes('relation') || e.code === '42P01') {
        setToast({ msg: 'Database not ready: Please run fix-cms-schema-alignment.sql in your Supabase SQL Editor.', type: 'error' })
      } else if (e.message?.includes('schema cache') || e.message?.includes('column')) {
        setToast({ msg: 'Schema mismatch: Please run fix-cms-schema-alignment.sql in Supabase.', type: 'error' })
      } else {
        setToast({ msg: e.message, type: 'error' })
      }
    }
    setSaving(false)
  }

  async function handleDelete(id) {
    try {
      await adminDelete(table, id)
      setToast({ msg: 'Deleted', type: 'success' })
      setConfirm(null)
      load()
    } catch (e) {
      if (e.message?.includes('row-level security') || e.code === '42501' || e.message?.includes('relation') || e.code === '42P01') {
        setToast({ msg: 'Database not ready: Please run migration-cms.sql in Supabase.', type: 'error' })
      } else {
        setToast({ msg: e.message, type: 'error' })
      }
    }
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadFile(file)
      // Add to photos array
      const existing = Array.isArray(form.photos) ? form.photos : []
      setForm(f => ({ ...f, photos: [...existing, url] }))
      setToast({ msg: 'Image uploaded', type: 'success' })
    } catch (err) {
      setToast({ msg: 'Upload failed: ' + err.message, type: 'error' })
    }
    setUploading(false)
  }

  function removePhoto(idx) {
    const photos = Array.isArray(form.photos) ? [...form.photos] : []
    photos.splice(idx, 1)
    setForm(f => ({ ...f, photos }))
  }

  function addPhotoUrl(url) {
    if (!url.trim()) return
    const existing = Array.isArray(form.photos) ? form.photos : []
    setForm(f => ({ ...f, photos: [...existing, url.trim()] }))
  }

  const filtered = rows.filter(r =>
    !search || Object.values(r).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <>
      <div className="admin-toolbar">
        <input className="admin-search" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        {canCreate && <button className="admin-btn admin-btn-primary" onClick={openCreate}>+ Add New</button>}
      </div>

      <div className="admin-table-wrap">
        {loading ? (
          <div className="admin-empty"><p>Loading...</p></div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon"><MailInboxRegular fontSize={48} /></div>
            <p>No records found. Click "Add New" to create one.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                {cols.map(c => <th key={c}>{c.replace(/_/g, ' ')}</th>)}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(row => (
                <tr key={row.id}>
                  {cols.map(c => (
                    <td key={c}>
                      {c === 'status' ? (
                        <span className={`admin-badge admin-badge-${row[c]}`}>{row[c]}</span>
                      ) : c === 'tier' ? (
                        <span className={`admin-badge admin-badge-${row[c]}`}>{row[c]}</span>
                      ) : typeof row[c] === 'boolean' ? (
                        row[c] ? <CheckmarkCircleRegular style={{ color: 'var(--green)' }} /> : '—'
                      ) : (
                        String(row[c] || '—').slice(0, 60)
                      )}
                    </td>
                  ))}
                  <td>
                    <button className="admin-btn admin-btn-ghost admin-btn-sm" onClick={() => openEdit(row)}>Edit</button>{' '}
                    {canDelete && <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => setConfirm(row.id)}>Delete</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="admin-pagination">{filtered.length} records</div>
      </div>

      {/* Create/Edit Modal */}
      {modal && (
        <div className="admin-modal-overlay" onClick={() => setModal(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{modal === 'create' ? 'Create New' : `Edit: ${form.name || form.id}`}</h2>
              <button className="admin-modal-close" onClick={() => setModal(null)}>✕</button>
            </div>
            <div className="admin-modal-body">
              <div className="admin-form-grid">
                {fields.map(f => (
                  <div key={f.key} className={`admin-field ${f.full ? 'full-width' : ''}`}>
                    <label>{f.label}</label>
                    {f.type === 'textarea' ? (
                      <textarea
                        value={form[f.key] || ''}
                        onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                      />
                    ) : f.type === 'select' ? (
                      <select value={form[f.key] || ''} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}>
                        <option value="">Select...</option>
                        {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : f.type === 'checkbox' ? (
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={!!form[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.checked }))} />
                        {form[f.key] ? 'Yes' : 'No'}
                      </label>
                    ) : f.type === 'color' ? (
                      <input type="color" value={form[f.key] || '#0ea5e9'} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} />
                    ) : (
                      <input
                        type={f.type}
                        value={form[f.key] ?? ''}
                        onChange={e => setForm(prev => ({ ...prev, [f.key]: f.type === 'number' ? e.target.value : e.target.value }))}
                        placeholder={f.placeholder}
                        required={f.required}
                        step={f.step}
                        min={f.min}
                        max={f.max}
                        readOnly={f.key === 'id' && modal !== 'create'}
                      />
                    )}
                  </div>
                ))}
                {/* Multi-image gallery for listings */}
                {(table === 'cms_listings' || table === 'cms_deals' || table === 'cms_discovery') && (
                  <div className="admin-field full-width">
                    <label>Photos ({(Array.isArray(form.photos) ? form.photos : []).length} / 8)</label>
                    
                    {/* Existing photos grid */}
                    {Array.isArray(form.photos) && form.photos.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        {form.photos.map((url, i) => (
                          <div key={i} style={{ position: 'relative', borderRadius: '0.5rem', overflow: 'hidden', aspectRatio: '4/3', background: '#1e293b' }}>
                            <img src={url} alt={`Photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={e => { e.target.style.display = 'none' }} />
                            <button
                              type="button"
                              onClick={() => removePhoto(i)}
                              style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '22px', height: '22px', cursor: 'pointer', fontSize: '12px', lineHeight: 1, display: 'grid', placeItems: 'center' }}
                            >✕</button>
                            {i === 0 && <span style={{ position: 'absolute', bottom: '4px', left: '4px', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '0.6rem', padding: '0.1rem 0.4rem', borderRadius: '0.25rem' }}>Cover</span>}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload button */}
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <label style={{ padding: '0.5rem 1rem', background: 'rgba(14,165,233,0.15)', color: '#0ea5e9', border: '1px dashed #0ea5e9', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                        📷 Upload Image
                        <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                      </label>
                      {uploading && <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>Uploading...</span>}
                      
                      {/* Manual URL input */}
                      <input
                        type="text"
                        placeholder="Or paste image URL..."
                        style={{ flex: 1, minWidth: '200px' }}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addPhotoUrl(e.target.value); e.target.value = '' } }}
                      />
                    </div>
                    <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.4rem' }}>First image is the cover photo. Upload up to 8 images. Press Enter to add a URL.</p>
                  </div>
                )}
              </div>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {confirm && (
        <div className="admin-modal-overlay" onClick={() => setConfirm(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="admin-modal-header">
              <h2>Confirm Delete</h2>
              <button className="admin-modal-close" onClick={() => setConfirm(null)}>✕</button>
            </div>
            <div className="admin-modal-body">
              <p className="admin-confirm-msg">Are you sure you want to delete this record?</p>
              <p className="admin-confirm-warn">This action cannot be undone.</p>
            </div>
            <div className="admin-modal-footer">
              <button className="admin-btn admin-btn-ghost" onClick={() => setConfirm(null)}>Cancel</button>
              <button className="admin-btn admin-btn-danger" onClick={() => handleDelete(confirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  )
}

function Overview() {
  const [stats, setStats] = useState({})
  const [userCount, setUserCount] = useState(0)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    async function load() {
      const tables = ['cms_listings','cms_deals','cms_sponsors','cms_discovery','cms_questions','cms_wordgame']
      const s = {}
      for (const t of tables) {
        try { s[t] = (await adminFetch(t)).length } catch { s[t] = 0 }
      }
      setStats(s)
      // User count
      try {
        const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
        setUserCount(count || 0)
      } catch { setUserCount(0) }
    }
    load()
  }, [])

  const totalContent = (stats.cms_listings || 0) + (stats.cms_deals || 0) + (stats.cms_sponsors || 0) + (stats.cms_discovery || 0) + (stats.cms_questions || 0) + (stats.cms_wordgame || 0)

  return (
    <>
      {/* Content Stats */}
      <div className="admin-stats">
        <div className="admin-stat-card"><div className="stat-icon"><LocationRegular /></div><div className="stat-value">{stats.cms_listings || 0}</div><div className="stat-label">Listings</div></div>
        <div className="admin-stat-card"><div className="stat-icon"><GiftRegular /></div><div className="stat-value">{stats.cms_deals || 0}</div><div className="stat-label">Deals</div></div>
        <div className="admin-stat-card"><div className="stat-icon"><DiamondRegular /></div><div className="stat-value">{stats.cms_sponsors || 0}</div><div className="stat-label">Sponsors</div></div>
        <div className="admin-stat-card"><div className="stat-icon"><MapRegular /></div><div className="stat-value">{stats.cms_discovery || 0}</div><div className="stat-label">Discovery</div></div>
        <div className="admin-stat-card"><div className="stat-icon"><QuestionRegular /></div><div className="stat-value">{stats.cms_questions || 0}</div><div className="stat-label">Questions</div></div>
        <div className="admin-stat-card"><div className="stat-icon"><TextFontRegular /></div><div className="stat-value">{stats.cms_wordgame || 0}</div><div className="stat-label">Word Game</div></div>
        <div className="admin-stat-card"><div className="stat-icon"><PeopleRegular /></div><div className="stat-value">{userCount}</div><div className="stat-label">Users</div></div>
      </div>

      <div className="admin-table-wrap" style={{ padding: '2rem' }}>
        <div>
          <h3 style={{ color: '#fff', marginBottom: '0.75rem' }}>Welcome to Wanda CMS</h3>
          <p style={{ color: '#94a3b8', marginBottom: '1rem' }}>
            You have <strong style={{ color: '#fff' }}>{totalContent}</strong> content items in your database.
            Use the sidebar to manage listings, deals, sponsors, discovery POIs, quiz questions, and users.
          </p>
          <p style={{ fontSize: '0.75rem', color: '#64748b' }}>
            All changes go live immediately when status is "published". Set to "draft" to hide content.
          </p>
        </div>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  )
}

const SETTINGS_DEFAULTS = {
  site_name: 'Wanda',
  site_tagline: 'Experience Nigeria',
  contact_email: '',
  features: '{"deals":true,"discovery":true,"community":true,"explore":true}',
  hero_slides: JSON.stringify([
    { title: 'Explore Places', subtitle: 'Attractions, restaurants, hotels & hidden gems', cta: 'Explore Now', link: '/explore', img: '/images/sites/nike-art_image_1.jpg', emoji: '🗺️' },
    { title: 'Events & Experiences', subtitle: 'Tours, concerts, cultural experiences near you', cta: 'Browse Events', link: '/explore?category=experience', img: '/images/sites/freedom-park_image_1.jpg', emoji: '🎉' },
    { title: 'Join Wanda App', subtitle: 'Save places, earn points & compete — for free', cta: 'Join Free', link: '/auth', img: '/images/sites/lekki-conservation_image_1.jpg', emoji: '🚀' },
    { title: 'List Your Business', subtitle: 'Get discovered by thousands of users', cta: 'Get Started', link: '/list-your-business', img: '/images/sites/bungalow-ikoyi_image_1.jpg', emoji: '🏪' },
    { title: 'Play & Win', subtitle: 'Quizzes, trivia games & daily rewards', cta: 'Play Now', link: '/play', img: '/images/sites/new-afrika-shrine_image_1.jpg', emoji: '🎮' },
    { title: 'Find a Service', subtitle: 'Artisans, plumbers, electricians & more', cta: 'Find Now', link: '/handymen', img: '/images/sites/craft-gourmet_image_1.jpg', emoji: '🔧' },
  ], null, 2),
}

const SETTINGS_DESCRIPTIONS = {
  site_name: 'The display name of your platform shown in headers and metadata.',
  site_tagline: 'A short tagline or subtitle shown alongside the site name.',
  contact_email: 'Primary contact email for admin notifications and support.',
  features: 'JSON object toggling platform features on/off (deals, discovery, community, explore).',
  hero_slides: 'JSON array of homepage hero carousel cards. Each card: { title, subtitle, cta, link, img, emoji }. "link" is where the card navigates (internal path like /explore or external URL). "img" is the background image. "emoji" is optional decorative icon.',
}

function SettingsSection({ session }) {
  const [configs, setConfigs] = useState({})
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const { adminFetch: af } = await import('../../lib/cms.js')
        const rows = await af('cms_config')
        const c = {}
        rows.forEach(r => { c[r.key] = typeof r.value === 'string' ? r.value : JSON.stringify(r.value) })
        // Apply defaults for any missing keys
        for (const [key, val] of Object.entries(SETTINGS_DEFAULTS)) {
          if (!(key in c)) c[key] = val
        }
        setConfigs(c)
      } catch {
        // If table doesn't exist yet, use all defaults
        setConfigs({ ...SETTINGS_DEFAULTS })
      }
    }
    load()
  }, [])

  async function save() {
    setSaving(true)
    try {
      const { adminUpdateConfig } = await import('../../lib/cms.js')
      for (const [key, value] of Object.entries(configs)) {
        let parsed
        try { parsed = JSON.parse(value) } catch { parsed = value }
        await adminUpdateConfig(key, parsed, session.user.id)
      }
      setToast({ msg: 'Settings saved', type: 'success' })
    } catch (e) {
      setToast({ msg: e.message, type: 'error' })
    }
    setSaving(false)
  }

  return (
    <>
      <div className="admin-table-wrap" style={{ padding: '1.5rem' }}>
        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(14,165,233,0.06)', borderRadius: '0.75rem', border: '1px solid rgba(14,165,233,0.15)' }}>
          <h3 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '0.5rem' }}>⚙️ Platform Settings</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0, lineHeight: 1.6 }}>
            Configure core platform settings below. Changes are saved directly to the database
            and take effect immediately. Use the <strong style={{ color: '#fff' }}>features</strong> field
            to enable or disable major sections of the app.
          </p>
        </div>
        <div className="admin-form-grid">
          {Object.entries(configs).map(([key, val]) => (
            <div key={key} className="admin-field">
              <label>{key.replace(/_/g, ' ')}</label>
              <input
                type="text"
                value={val}
                onChange={e => setConfigs(prev => ({ ...prev, [key]: e.target.value }))}
              />
              {SETTINGS_DESCRIPTIONS[key] && (
                <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.3rem' }}>{SETTINGS_DESCRIPTIONS[key]}</p>
              )}
            </div>
          ))}
        </div>
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="admin-btn admin-btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  )
}

// ─── HERO PAGE SECTION (visual carousel editor) ─────────────
const HERO_DEFAULT_SLIDES = [
  { title: 'Explore Places', subtitle: 'Attractions, restaurants, hotels & hidden gems', cta: 'Explore Now', link: '/explore', img: '/images/sites/nike-art_image_1.jpg', emoji: '🗺️' },
  { title: 'Events & Experiences', subtitle: 'Tours, concerts, cultural experiences near you', cta: 'Browse Events', link: '/explore?category=experience', img: '/images/sites/freedom-park_image_1.jpg', emoji: '🎉' },
  { title: 'Join Wanda App', subtitle: 'Save places, earn points & compete — for free', cta: 'Join Free', link: '/auth', img: '/images/sites/lekki-conservation_image_1.jpg', emoji: '🚀' },
  { title: 'List Your Business', subtitle: 'Get discovered by thousands of users', cta: 'Get Started', link: '/list-your-business', img: '/images/sites/bungalow-ikoyi_image_1.jpg', emoji: '🏪' },
  { title: 'Play & Win', subtitle: 'Quizzes, trivia games & daily rewards', cta: 'Play Now', link: '/play', img: '/images/sites/new-afrika-shrine_image_1.jpg', emoji: '🎮' },
  { title: 'Find a Service', subtitle: 'Artisans, plumbers, electricians & more', cta: 'Find Now', link: '/handymen', img: '/images/sites/craft-gourmet_image_1.jpg', emoji: '🔧' },
]

function HeroPageSection({ session }) {
  const [slides, setSlides] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ title: '', subtitle: '', cta: '', link: '', img: '', emoji: '' })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const { adminFetch: af } = await import('../../lib/cms.js')
        const rows = await af('cms_config')
        const heroRow = rows.find(r => r.key === 'hero_slides')
        if (heroRow?.value && Array.isArray(heroRow.value)) {
          setSlides(heroRow.value)
        } else if (heroRow?.value && typeof heroRow.value === 'string') {
          try { setSlides(JSON.parse(heroRow.value)) } catch { setSlides(HERO_DEFAULT_SLIDES) }
        } else {
          setSlides(HERO_DEFAULT_SLIDES)
        }
      } catch {
        setSlides(HERO_DEFAULT_SLIDES)
      }
    }
    load()
  }, [])

  async function saveSlides(updated) {
    setSaving(true)
    try {
      const { adminUpdateConfig } = await import('../../lib/cms.js')
      await adminUpdateConfig('hero_slides', updated, session.user.id)
      setSlides(updated)
      setToast({ msg: 'Hero slides saved!', type: 'success' })
    } catch (e) {
      setToast({ msg: e.message || 'Failed to save', type: 'error' })
    }
    setSaving(false)
  }

  function openEdit(idx) { setForm({ ...slides[idx] }); setEditing(idx) }
  function openNew() { setForm({ title: '', subtitle: '', cta: 'Learn More', link: '/', img: '', emoji: '✨' }); setEditing('new') }
  function handleSave() {
    if (!form.title.trim()) return
    const updated = [...slides]
    if (editing === 'new') updated.push({ ...form })
    else updated[editing] = { ...form }
    setEditing(null)
    saveSlides(updated)
  }
  function handleDelete(idx) { saveSlides(slides.filter((_, i) => i !== idx)) }
  function moveSlide(idx, dir) {
    const updated = [...slides]
    const t = idx + dir
    if (t < 0 || t >= updated.length) return
    ;[updated[idx], updated[t]] = [updated[t], updated[idx]]
    saveSlides(updated)
  }

  const cs = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.75rem', padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.75rem' }
  const is = { width: 80, height: 50, objectFit: 'cover', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }

  return (
    <>
      <div className="admin-table-wrap" style={{ padding: '1.5rem' }}>
        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(200,150,62,0.08)', borderRadius: '0.75rem', border: '1px solid rgba(200,150,62,0.2)' }}>
          <h3 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '0.5rem' }}>🖼️ Hero Carousel</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0, lineHeight: 1.6 }}>
            Manage the homepage hero carousel slides. Each slide has a title, subtitle, CTA button, link, background image, and emoji.
            Changes take effect immediately on the homepage.
          </p>
        </div>

        {slides.map((slide, i) => (
          <div key={i} style={cs}>
            {slide.img ? <img src={slide.img} alt="" style={is} /> : <div style={{ ...is, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>{slide.emoji || '🖼️'}</div>}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.85rem' }}>{slide.emoji} {slide.title}</div>
              <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '0.2rem' }}>{slide.subtitle}</div>
              <div style={{ color: '#64748b', fontSize: '0.7rem', marginTop: '0.2rem' }}>CTA: &quot;{slide.cta}&quot; → {slide.link}</div>
            </div>
            <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
              <button onClick={() => moveSlide(i, -1)} disabled={i === 0} style={{ background: 'none', border: 'none', color: i === 0 ? '#334155' : '#94a3b8', cursor: 'pointer', fontSize: '1rem' }} title="Move up">▲</button>
              <button onClick={() => moveSlide(i, 1)} disabled={i === slides.length - 1} style={{ background: 'none', border: 'none', color: i === slides.length - 1 ? '#334155' : '#94a3b8', cursor: 'pointer', fontSize: '1rem' }} title="Move down">▼</button>
              <button onClick={() => openEdit(i)} style={{ background: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.3)', color: '#38bdf8', borderRadius: '0.4rem', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.7rem' }}>Edit</button>
              <button onClick={() => handleDelete(i)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '0.4rem', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.7rem' }}>Delete</button>
            </div>
          </div>
        ))}

        <button onClick={openNew} className="admin-btn admin-btn-primary" style={{ marginTop: '1rem' }}>+ Add Slide</button>

        {editing !== null && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setEditing(null)}>
            <div style={{ background: '#1e293b', borderRadius: '1rem', padding: '1.5rem', width: '90%', maxWidth: 480, maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ color: '#fff', marginBottom: '1rem' }}>{editing === 'new' ? '➕ New Slide' : '✏️ Edit Slide'}</h3>
              {['title', 'subtitle', 'cta', 'link', 'emoji'].map(field => (
                <div key={field} style={{ marginBottom: '0.75rem' }}>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.3rem', textTransform: 'capitalize' }}>{field === 'cta' ? 'CTA Button Text' : field}</label>
                  <input
                    type="text"
                    value={form[field] || ''}
                    onChange={e => setForm(prev => ({ ...prev, [field]: e.target.value }))}
                    style={{ width: '100%', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: '#fff', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    placeholder={field === 'link' ? '/explore or https://...' : ''}
                  />
                </div>
              ))}
              {/* Image field with upload */}
              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '0.75rem', marginBottom: '0.3rem' }}>Image</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={form.img || ''}
                    onChange={e => setForm(prev => ({ ...prev, img: e.target.value }))}
                    style={{ flex: 1, padding: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: '#fff', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    placeholder="/images/sites/my-image.jpg or paste URL"
                  />
                  <label style={{ padding: '0.5rem 0.75rem', background: 'rgba(200,150,62,0.15)', border: '1px solid rgba(200,150,62,0.3)', borderRadius: '0.5rem', color: '#C8963E', cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    📷 Upload
                    <input type="file" accept="image/*" hidden onChange={async e => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      try {
                        setSaving(true)
                        const { uploadFile: uf } = await import('../../lib/cms.js')
                        const url = await uf(file, 'hero')
                        if (url) setForm(prev => ({ ...prev, img: url }))
                      } catch (err) {
                        setToast({ msg: 'Upload failed: ' + (err.message || ''), type: 'error' })
                      }
                      setSaving(false)
                    }} />
                  </label>
                </div>
              </div>
              {form.img && <img src={form.img} alt="Preview" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: '0.5rem', marginBottom: '0.75rem' }} />}
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button onClick={() => setEditing(null)} style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: '#94a3b8', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleSave} disabled={saving} className="admin-btn admin-btn-primary">{saving ? 'Saving...' : editing === 'new' ? 'Add Slide' : 'Save Changes'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  )
}

const ROLE_CONFIG = {
  admin:     { color: '#a78bfa', bg: 'rgba(168,139,250,0.15)', border: '#a78bfa44', icon: <ShieldCheckmarkRegular fontSize={12} />, label: 'Admin' },
  moderator: { color: '#60a5fa', bg: 'rgba(96,165,250,0.15)',  border: '#60a5fa44', icon: <CheckmarkCircleRegular fontSize={12} />, label: 'Moderator' },
  editor:    { color: '#2dd4bf', bg: 'rgba(45,212,191,0.15)',   border: '#2dd4bf44', icon: <EditRegular fontSize={12} />, label: 'Editor' },
  user:      { color: '#64748b', bg: 'rgba(255,255,255,0.05)',  border: 'transparent', icon: <PersonRegular fontSize={12} />, label: 'User' },
}

const ROLE_OPTIONS = ['admin', 'moderator', 'editor', 'user']

function UsersSection({ session, profile }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [search, setSearch] = useState('')
  const isReadOnly = profile?.role === 'moderator'
  const isSuperAdmin = profile?.role === 'admin'

  // Invitations state
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('editor')
  const [inviting, setInviting] = useState(false)
  const [invitations, setInvitations] = useState([])

  useEffect(() => {
    loadUsers()
    if (isSuperAdmin) {
      loadInvitations()
    }
  }, [isSuperAdmin])

  async function loadUsers() {
    setLoading(true)
    try {
      // Try ordering by updated_at first; if column is missing, fall back to no ordering
      let result = await supabase.from('profiles').select('*').order('updated_at', { ascending: false })
      if (result.error) {
        // Retry without ordering (handles missing updated_at column)
        result = await supabase.from('profiles').select('*')
      }
      if (result.error) throw result.error
      setUsers(result.data || [])
    } catch (e) {
      console.error('Could not load users:', e)
      setToast({ msg: 'Could not load users. Run apply-all-fixes.sql in Supabase.', type: 'error' })
    }
    setLoading(false)
  }

  async function loadInvitations() {
    try {
      const { data, error } = await supabase.from('staff_invitations').select('*').order('created_at', { ascending: false })
      if (error) {
        // Table might not exist yet — silently ignore
        if (error.code === '42P01') return
        throw error
      }
      setInvitations(data || [])
    } catch (e) {
      console.warn('Could not load invitations:', e.message)
    }
  }

  async function changeRole(user, newRole) {
    if (user.id === session?.user?.id) return
    if (isReadOnly) return
    try {
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', user.id)
      if (error) throw error
      setToast({ msg: `${user.username || user.id} is now ${newRole}`, type: 'success' })
      loadUsers()
    } catch (e) {
      setToast({ msg: e.message, type: 'error' })
    }
  }

  async function handleInvite(e) {
    e.preventDefault()
    if (!inviteEmail) return
    setInviting(true)
    try {
      const { error } = await supabase.from('staff_invitations').upsert({
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
        invited_by: session?.user?.id
      })
      if (error) throw error
      setToast({ msg: `Successfully invited ${inviteEmail} as ${inviteRole}!`, type: 'success' })
      setInviteEmail('')
      loadInvitations()
      loadUsers() // Refresh user list in case they already signed up
    } catch (e) {
      setToast({ msg: 'Failed to invite: ' + e.message, type: 'error' })
    }
    setInviting(false)
  }

  async function handleRevokeInvite(email) {
    try {
      const { error } = await supabase.from('staff_invitations').delete().eq('email', email)
      if (error) throw error
      setToast({ msg: `Revoked invitation for ${email}`, type: 'success' })
      loadInvitations()
    } catch (e) {
      setToast({ msg: e.message, type: 'error' })
    }
  }

  const filtered = users.filter(u => {
    if (!search) return true
    const s = search.toLowerCase()
    return (u.username || '').toLowerCase().includes(s)
      || (u.full_name || '').toLowerCase().includes(s)
      || (u.id || '').toLowerCase().includes(s)
      || (u.email || '').toLowerCase().includes(s)
  })

  // Pending invites are those whose email is not yet associated with any registered user profile
  const registeredEmails = new Set(users.map(u => (u.email || '').toLowerCase()))
  const pendingInvites = invitations.filter(inv => !registeredEmails.has(inv.email.toLowerCase()))

  return (
    <>
      {/* Invite Staff Section — Only for Super Admins */}
      {isSuperAdmin && (
        <div className="admin-table-wrap" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
          <h3 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '0.25rem' }}>Invite Staff / Team Member</h3>
          <p style={{ color: '#64748b', fontSize: '0.78rem', marginBottom: '1rem' }}>
            Enter the email address of a team member and select their role. Once they sign up using this email, they will automatically be granted staff access.
          </p>
          <form onSubmit={handleInvite} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="admin-field" style={{ flex: 2, minWidth: '220px' }}>
              <label>Email Address</label>
              <input
                type="email"
                placeholder="staff@example.com"
                required
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="admin-field" style={{ flex: 1, minWidth: '150px' }}>
              <label>Role</label>
              <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
                <option value="editor">Editor</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" className="admin-btn admin-btn-primary" disabled={inviting} style={{ height: '40px' }}>
              {inviting ? 'Inviting...' : 'Send Invite'}
            </button>
          </form>
        </div>
      )}

      {/* Role descriptions */}
      <div className="admin-table-wrap" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <h3 style={{ color: '#fff', fontSize: '0.9rem', marginBottom: '0.75rem' }}>Role Permissions</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {ROLE_OPTIONS.map(role => {
            const rc = ROLE_CONFIG[role]
            const descriptions = {
              admin: 'Full access — manage all content, users, invitations, and settings',
              moderator: 'Can approve/reject submissions, edit existing content',
              editor: 'Can create and edit content, upload images',
              user: 'Regular user, no admin access',
            }
            return (
              <div key={role} style={{ padding: '0.6rem 0.75rem', background: rc.bg, borderRadius: '0.5rem', border: `1px solid ${rc.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem' }}>
                  <span style={{ color: rc.color }}>{rc.icon}</span>
                  <strong style={{ color: rc.color, fontSize: '0.8rem' }}>{rc.label}</strong>
                </div>
                <p style={{ color: '#94a3b8', fontSize: '0.7rem', margin: 0, lineHeight: 1.4 }}>{descriptions[role]}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Pending Invitations List */}
      {isSuperAdmin && pendingInvites.length > 0 && (
        <div className="admin-table-wrap" style={{ marginBottom: '1.5rem' }}>
          <div style={{ padding: '0.8rem 1.25rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 style={{ color: '#fff', fontSize: '0.88rem', margin: 0 }}>Pending Invitations ({pendingInvites.length})</h3>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email Address</th>
                <th>Assigned Role</th>
                <th>Invited On</th>
                <th style={{ width: '100px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingInvites.map(inv => {
                const rc = ROLE_CONFIG[inv.role] || ROLE_CONFIG.editor
                return (
                  <tr key={inv.email}>
                    <td>
                      <strong style={{ color: '#fff' }}>{inv.email}</strong>
                    </td>
                    <td>
                      <span style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: rc.bg,
                        color: rc.color,
                        border: `1px solid ${rc.border}`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}>
                        {rc.icon} {rc.label}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {new Date(inv.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        className="admin-btn admin-btn-danger admin-btn-sm"
                        onClick={() => handleRevokeInvite(inv.email)}
                        title="Cancel this invitation"
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="admin-toolbar">
        <input
          type="text"
          placeholder="Search users..."
          className="admin-search"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{users.length} total users</span>
      </div>

      <div className="admin-table-wrap">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading users...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Avatar</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>XP</th>
                <th>Level</th>
                <th>Streak</th>
                <th>Joined</th>
                {!isReadOnly && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={isReadOnly ? 8 : 9} style={{ textAlign: 'center', color: '#64748b' }}>No users found</td></tr>
              ) : filtered.map(u => {
                const rc = ROLE_CONFIG[u.role] || ROLE_CONFIG.user
                const isSelf = u.id === session?.user?.id
                return (
                  <tr key={u.id}>
                    <td>{u.avatar_url && u.avatar_url.startsWith('http') ? <img src={u.avatar_url} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} onError={e => { e.target.style.display = 'none'; e.target.insertAdjacentText('afterend', '🧭') }} /> : <span style={{ fontSize: '1.3rem' }}>{u.avatar_url || '🧭'}</span>}</td>
                    <td>
                      <strong>{u.username || 'Unnamed'}</strong>
                      {u.full_name && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{u.full_name}</div>}
                    </td>
                    <td style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                      {u.email || <span style={{ color: '#475569' }}>{u.id.slice(0, 8)}…</span>}
                    </td>
                    <td>
                      <span style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: rc.bg,
                        color: rc.color,
                        border: `1px solid ${rc.border}`,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                      }}>
                        {rc.icon} {rc.label}
                      </span>
                    </td>
                    <td>{u.total_xp || 0}</td>
                    <td>{u.level || 1}</td>
                    <td>{u.streak_days || 0}</td>
                    <td style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                    </td>
                    {!isReadOnly && (
                      <td>
                        <select
                          value={u.role || 'user'}
                          onChange={e => changeRole(u, e.target.value)}
                          disabled={isSelf}
                          title={isSelf ? "Can't change your own role" : 'Change user role'}
                          style={{
                            background: 'rgba(255,255,255,0.06)',
                            color: rc.color,
                            border: `1px solid ${rc.border}`,
                            borderRadius: '0.4rem',
                            padding: '0.3rem 0.5rem',
                            fontSize: '0.75rem',
                            cursor: isSelf ? 'not-allowed' : 'pointer',
                            opacity: isSelf ? 0.5 : 1,
                          }}
                        >
                          {ROLE_OPTIONS.map(r => (
                            <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>
                          ))}
                        </select>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  )
}

function SubmissionsSection({ session }) {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [toast, setToast] = useState(null)
  const [actioning, setActioning] = useState(null)

  const loadSubmissions = useCallback(async () => {
    setLoading(true)
    try {
      if (!supabase) throw new Error('Supabase client not initialized')
      const { data, error } = await supabase
        .from('business_listings')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setSubmissions(data || [])
    } catch (e) {
      setToast({ msg: 'Failed to load submissions: ' + e.message, type: 'error' })
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadSubmissions()
  }, [loadSubmissions])

  async function handleApprove(sub) {
    setActioning(sub.id)
    try {
      if (!supabase) throw new Error('Supabase client not initialized')

      // For handyman listings: just approve in business_listings (they are browsed from there)
      if (sub.listing_type === 'handyman') {
        const { error: updateError } = await supabase
          .from('business_listings')
          .update({ status: 'approved' })
          .eq('id', sub.id)
        if (updateError) throw updateError
        clearCache()
        setToast({ msg: `Handyman "${sub.name}" approved!`, type: 'success' })
        // Approval email (fire-and-forget)
        if (sub.email || sub.whatsapp) {
          fetch('/api/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'listing_approved', to: sub.email || '', data: { name: sub.name, listingType: 'handyman', listingId: sub.id } }) }).catch(() => {})
        }
        loadSubmissions()
        setActioning(null)
        return
      }
      
      // For business listings: copy to cms_listings then approve
      // Auto-generate unique slug
      let slug = sub.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      // Check if slug exists in cms_listings
      const { data: existing } = await supabase.from('cms_listings').select('id').eq('id', slug)
      if (existing && existing.length > 0) {
        slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`
      }

      // Copy to cms_listings
      const PRICE_MIN_MAP = {
        '₦': 1000,
        '₦₦': 5000,
        '₦₦₦': 15000,
        '₦₦₦₦': 30000,
        '₦ Budget': 1000,
        '₦₦ Mid-range': 5000,
        '₦₦₦ Premium': 15000,
        '₦₦₦₦ Luxury': 30000
      }
      const pMin = PRICE_MIN_MAP[sub.price_range] || 5000

      const newListing = {
        id: slug,
        name: sub.name,
        category: sub.category || 'shopping',
        subcategory: sub.subcategory || '',
        area: sub.area,
        address: sub.address || '',
        price_min: pMin,
        price_max: pMin * 3,
        phone: sub.phone || '',
        whatsapp: sub.whatsapp || '',
        website: sub.website || '',
        instagram: sub.instagram || '',
        hours: sub.hours || '',
        description: sub.description || '',
        status: 'published',
        rating: 4.0,
        lat: 6.45,
        lng: 3.39,
        created_at: new Date().toISOString(),
        created_by: session?.user?.id,
        photo: sub.logo_url || (sub.photos && sub.photos.length > 0 ? sub.photos[0] : ''),
        photos: sub.photos || []
      }

      const { error: insertError } = await supabase.from('cms_listings').insert([newListing])
      if (insertError) throw insertError

      // Update business_listings status
      const { error: updateError } = await supabase
        .from('business_listings')
        .update({ status: 'approved' })
        .eq('id', sub.id)
      if (updateError) throw updateError

      // Clear cache so changes propagate to users instantly
      clearCache()

      setToast({ msg: 'Listing approved and published successfully!', type: 'success' })
      // Approval email (fire-and-forget)
      if (sub.email || sub.whatsapp) {
        fetch('/api/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'listing_approved', to: sub.email || '', data: { name: sub.name, listingType: sub.listing_type || 'business', listingId: slug } }) }).catch(() => {})
      }
      loadSubmissions()
    } catch (e) {
      setToast({ msg: 'Error: ' + e.message, type: 'error' })
    }
    setActioning(null)
  }

  async function handleReject(subId) {
    setActioning(subId)
    try {
      if (!supabase) throw new Error('Supabase client not initialized')
      const { error } = await supabase
        .from('business_listings')
        .update({ status: 'rejected' })
        .eq('id', subId)
      if (error) throw error
      setToast({ msg: 'Listing rejected.', type: 'success' })
      loadSubmissions()
    } catch (e) {
      setToast({ msg: 'Error: ' + e.message, type: 'error' })
    }
    setActioning(null)
  }

  const filtered = submissions.filter(s => {
    const query = search.toLowerCase()
    return !search || 
      (s.name || '').toLowerCase().includes(query) ||
      (s.area || '').toLowerCase().includes(query) ||
      (s.category || '').toLowerCase().includes(query) ||
      (s.trade || '').toLowerCase().includes(query) ||
      (s.listing_type || '').toLowerCase().includes(query) ||
      (s.status || '').toLowerCase().includes(query)
  })

  return (
    <>
      <div className="admin-toolbar">
        <input 
          className="admin-search" 
          placeholder="Search submissions by name, category, status..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />
        <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{submissions.length} total submissions</span>
      </div>

      <div className="admin-table-wrap">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading submissions...</div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon"><MailInboxRegular fontSize={48} /></div>
            <p>No business submissions found.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Area & Address</th>
                <th>Contact info</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(sub => (
                <tr key={sub.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {sub.logo_url && <img src={sub.logo_url} alt="" style={{ width: 32, height: 32, borderRadius: '6px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />}
                      <div>
                        <strong>{sub.name}</strong>
                        {sub.price_range && <span style={{ marginLeft: '0.4rem', fontSize: '0.7rem', color: '#a78bfa' }}>{sub.price_range}</span>}
                        {sub.description && (
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', maxWidth: '280px', whiteSpace: 'normal' }}>
                            {sub.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    {sub.listing_type === 'handyman' ? (
                      <>
                        <span className="admin-badge" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}>🔧 Handyman</span>
                        {sub.trade && <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>{sub.trade}</div>}
                        {sub.experience_years && <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{sub.experience_years}+ yrs</div>}
                      </>
                    ) : (
                      <>
                        <span className="admin-badge admin-badge-info">{sub.category || 'business'}</span>
                        {sub.subcategory && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{sub.subcategory}</div>}
                      </>
                    )}
                  </td>
                  <td>
                    <div>📍 <strong>{sub.area}</strong></div>
                    {sub.address && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{sub.address}</div>}
                    {sub.hours && <div style={{ fontSize: '0.75rem', color: '#a78bfa' }}>🕒 {sub.hours}</div>}
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                      {sub.phone && <div>📞 {sub.phone}</div>}
                      {sub.whatsapp && <div>💬 {sub.whatsapp}</div>}
                      {sub.website && <div>🌐 <a href={sub.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>Website</a></div>}
                      {sub.instagram && <div>📸 <a href={`https://instagram.com/${sub.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>{sub.instagram}</a></div>}
                    </div>
                    {sub.photos && sub.photos.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                        {sub.photos.slice(0, 4).map((url, i) => (
                          <img key={i} src={url} alt="" style={{ width: 40, height: 40, borderRadius: '4px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
                        ))}
                        {sub.photos.length > 4 && <span style={{ fontSize: '0.7rem', color: '#64748b', alignSelf: 'center' }}>+{sub.photos.length - 4}</span>}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`admin-badge admin-badge-${sub.status}`}>
                      {sub.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {sub.created_at ? new Date(sub.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    {sub.status === 'pending' ? (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button 
                          className="admin-btn admin-btn-primary admin-btn-sm"
                          onClick={() => handleApprove(sub)}
                          disabled={actioning !== null}
                        >
                          Approve
                        </button>
                        <button 
                          className="admin-btn admin-btn-danger admin-btn-sm"
                          onClick={() => handleReject(sub.id)}
                          disabled={actioning !== null}
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Resolved</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  )
}
// ─── HANDYMEN CMS SECTION ───────────────────────────────────────────
// Dedicated CMS panel for managing handyman listings from business_listings.
// Supports editing, approving, rejecting, and searching/filtering.

const TRADE_OPTIONS = [
  'plumber', 'electrician', 'carpenter', 'painter', 'welder', 'mechanic',
  'tailor', 'wig-maker', 'bricklayer', 'tiler', 'ac-technician',
  'generator-repairer', 'vulcanizer', 'barber', 'phone-repairer',
  'cobbler', 'furniture-maker', 'interior-decorator', 'pest-control', 'arts-crafts'
]

function HandymenCMSSection({ session }) {
  const [handymen, setHandymen] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterTrade, setFilterTrade] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [toast, setToast] = useState(null)
  const [actioning, setActioning] = useState(null)
  const [editing, setEditing] = useState(null) // id of row being edited
  const [editData, setEditData] = useState({})

  const loadHandymen = useCallback(async () => {
    setLoading(true)
    try {
      if (!supabase) throw new Error('Supabase client not initialized')
      const { data, error } = await supabase
        .from('business_listings')
        .select('*')
        .eq('listing_type', 'handyman')
        .order('created_at', { ascending: false })
      if (error) throw error
      setHandymen(data || [])
    } catch (e) {
      setToast({ msg: 'Failed to load handymen: ' + e.message, type: 'error' })
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadHandymen() }, [loadHandymen])

  const filtered = handymen.filter(h => {
    if (filterTrade !== 'all' && h.trade !== filterTrade) return false
    if (filterStatus !== 'all' && h.status !== filterStatus) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return (h.name?.toLowerCase().includes(q) || h.trade?.toLowerCase().includes(q) ||
        h.area?.toLowerCase().includes(q) || h.phone?.includes(q) || h.email?.toLowerCase().includes(q))
    }
    return true
  })

  // Count by status
  const counts = { pending: 0, approved: 0, rejected: 0 }
  handymen.forEach(h => { if (counts[h.status] !== undefined) counts[h.status]++ })

  async function handleApprove(item) {
    setActioning(item.id)
    try {
      const { error } = await supabase
        .from('business_listings')
        .update({ status: 'approved' })
        .eq('id', item.id)
      if (error) throw error
      clearCache()
      setToast({ msg: `"${item.name}" approved!`, type: 'success' })
      // Approval email
      if (item.email) {
        fetch('/api/send-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'listing_approved', to: item.email, data: { name: item.name, listingType: 'handyman', listingId: item.id } }) }).catch(() => {})
      }
      loadHandymen()
    } catch (e) { setToast({ msg: 'Error: ' + e.message, type: 'error' }) }
    setActioning(null)
  }

  async function handleReject(id) {
    setActioning(id)
    try {
      const { error } = await supabase
        .from('business_listings')
        .update({ status: 'rejected' })
        .eq('id', id)
      if (error) throw error
      setToast({ msg: 'Listing rejected.', type: 'success' })
      loadHandymen()
    } catch (e) { setToast({ msg: 'Error: ' + e.message, type: 'error' }) }
    setActioning(null)
  }

  function startEdit(h) {
    setEditing(h.id)
    setEditData({
      name: h.name || '', trade: h.trade || '', area: h.area || '',
      address: h.address || '', phone: h.phone || '', whatsapp: h.whatsapp || '',
      email: h.email || '', description: h.description || '',
      experience_years: h.experience_years || '', status: h.status || 'pending',
    })
  }

  async function saveEdit() {
    if (!editing) return
    setActioning(editing)
    try {
      const updates = { ...editData, experience_years: editData.experience_years ? parseInt(editData.experience_years, 10) : null }
      const { error } = await supabase
        .from('business_listings')
        .update(updates)
        .eq('id', editing)
      if (error) throw error
      clearCache()
      setToast({ msg: 'Handyman updated!', type: 'success' })
      setEditing(null)
      loadHandymen()
    } catch (e) { setToast({ msg: 'Error: ' + e.message, type: 'error' }) }
    setActioning(null)
  }

  async function handleDelete(id, name) {
    if (!confirm(`Delete "${name}" permanently?`)) return
    setActioning(id)
    try {
      const { error } = await supabase.from('business_listings').delete().eq('id', id)
      if (error) throw error
      clearCache()
      setToast({ msg: `"${name}" deleted.`, type: 'success' })
      loadHandymen()
    } catch (e) { setToast({ msg: 'Error: ' + e.message, type: 'error' }) }
    setActioning(null)
  }

  const editField = (field, value) => setEditData(prev => ({ ...prev, [field]: value }))

  return (
    <>
      {/* Status summary bar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: '10px', padding: '0.75rem 1.25rem', flex: '1', minWidth: '120px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#eab308' }}>{counts.pending}</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Pending Review</div>
        </div>
        <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '10px', padding: '0.75rem 1.25rem', flex: '1', minWidth: '120px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#22c55e' }}>{counts.approved}</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Approved</div>
        </div>
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '0.75rem 1.25rem', flex: '1', minWidth: '120px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ef4444' }}>{counts.rejected}</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Rejected</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="admin-toolbar" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
        <input
          className="admin-search"
          placeholder="Search by name, trade, area, phone, email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: '1', minWidth: '180px' }}
        />
        <select value={filterTrade} onChange={e => setFilterTrade(e.target.value)}
          style={{ background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}>
          <option value="all">All Trades</option>
          {TRADE_OPTIONS.map(t => <option key={t} value={t}>{t.replace(/-/g, ' ')}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}>
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <span style={{ color: '#64748b', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{filtered.length} of {handymen.length}</span>
      </div>

      {/* Table */}
      <div className="admin-table-wrap">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Loading handymen...</div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon"><WrenchRegular fontSize={48} /></div>
            <p>No handymen found.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Trade</th>
                <th>Area</th>
                <th>Contact</th>
                <th>Experience</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(h => {
                const isEditing = editing === h.id
                return (
                  <tr key={h.id} style={{ background: isEditing ? 'rgba(200,150,62,0.05)' : undefined }}>
                    <td>
                      {isEditing ? (
                        <input value={editData.name} onChange={e => editField('name', e.target.value)}
                          style={{ background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px', padding: '4px 6px', width: '100%', fontSize: '0.8rem' }} />
                      ) : (
                        <div>
                          <strong>{h.name}</strong>
                          {h.description && <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '3px', maxWidth: '220px', whiteSpace: 'normal' }}>{h.description.slice(0, 80)}{h.description.length > 80 ? '...' : ''}</div>}
                        </div>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <select value={editData.trade} onChange={e => editField('trade', e.target.value)}
                          style={{ background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px', padding: '4px', fontSize: '0.8rem' }}>
                          <option value="">Select trade</option>
                          {TRADE_OPTIONS.map(t => <option key={t} value={t}>{t.replace(/-/g, ' ')}</option>)}
                        </select>
                      ) : (
                        <span className="admin-badge" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)' }}>
                          🔧 {h.trade || 'N/A'}
                        </span>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <input placeholder="Area" value={editData.area} onChange={e => editField('area', e.target.value)}
                            style={{ background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px', padding: '4px 6px', fontSize: '0.8rem' }} />
                          <input placeholder="Address" value={editData.address} onChange={e => editField('address', e.target.value)}
                            style={{ background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px', padding: '4px 6px', fontSize: '0.8rem' }} />
                        </div>
                      ) : (
                        <div>
                          <div>📍 <strong>{h.area}</strong></div>
                          {h.address && <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{h.address}</div>}
                        </div>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <input placeholder="Phone" value={editData.phone} onChange={e => editField('phone', e.target.value)}
                            style={{ background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px', padding: '4px 6px', fontSize: '0.8rem' }} />
                          <input placeholder="WhatsApp" value={editData.whatsapp} onChange={e => editField('whatsapp', e.target.value)}
                            style={{ background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px', padding: '4px 6px', fontSize: '0.8rem' }} />
                          <input placeholder="Email" value={editData.email} onChange={e => editField('email', e.target.value)}
                            style={{ background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px', padding: '4px 6px', fontSize: '0.8rem' }} />
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                          {h.phone && <div>📞 {h.phone}</div>}
                          {h.whatsapp && <div>💬 {h.whatsapp}</div>}
                          {h.email && <div>✉️ {h.email}</div>}
                        </div>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input type="number" placeholder="Years" value={editData.experience_years} onChange={e => editField('experience_years', e.target.value)}
                          style={{ background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px', padding: '4px 6px', width: '60px', fontSize: '0.8rem' }} />
                      ) : (
                        h.experience_years ? `${h.experience_years}+ yrs` : '—'
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <select value={editData.status} onChange={e => editField('status', e.target.value)}
                          style={{ background: 'rgba(255,255,255,0.06)', color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px', padding: '4px', fontSize: '0.8rem' }}>
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      ) : (
                        <span className={`admin-badge admin-badge-${h.status}`}>{h.status}</span>
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={saveEdit} disabled={actioning !== null}>Save</button>
                          <button className="admin-btn admin-btn-sm" onClick={() => setEditing(null)} style={{ background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}>Cancel</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <button className="admin-btn admin-btn-sm" onClick={() => startEdit(h)} disabled={actioning !== null}
                            style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }}>
                            <EditRegular fontSize={12} /> Edit
                          </button>
                          {h.status === 'pending' && (
                            <>
                              <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={() => handleApprove(h)} disabled={actioning !== null}>
                                <CheckmarkCircleRegular fontSize={12} /> Approve
                              </button>
                              <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => handleReject(h.id)} disabled={actioning !== null}>
                                Reject
                              </button>
                            </>
                          )}
                          {h.status === 'rejected' && (
                            <button className="admin-btn admin-btn-primary admin-btn-sm" onClick={() => handleApprove(h)} disabled={actioning !== null}>
                              Re-approve
                            </button>
                          )}
                          <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => handleDelete(h.id, h.name)} disabled={actioning !== null}
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}>
                            <DismissCircleRegular fontSize={12} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  )
}

// ─── SEO / OG IMAGE MANAGEMENT ──────────────────────────────────────
// Stores OG image URLs per route in cms_config under the key 'seo_og_images'.
// The OG images are referenced by the SEO.jsx component and served to crawlers
// via the Vercel serverless function (api/og.js) and Cloudflare middleware.

const SEO_ROUTES = [
  { path: '/', label: 'Home', key: 'home' },
  { path: '/explore', label: 'Explore', key: 'explore' },
  { path: '/play', label: 'Play Games', key: 'play' },
  { path: '/pass', label: 'Wanda Pass', key: 'pass' },
  { path: '/list-your-business', label: 'List Your Business', key: 'listBusiness' },
  { path: '/handymen', label: 'Handymen', key: 'handymen' },
  { path: '/about', label: 'About', key: 'about' },
  { path: '/leaderboard', label: 'Leaderboard', key: 'leaderboard' },
  { path: '/community', label: 'Community', key: 'community' },
  { path: '/deals', label: 'Deals', key: 'deals' },
  { path: '/discovery', label: 'Discovery', key: 'discovery' },
  { path: '/rewards', label: 'Rewards', key: 'rewards' },
  { path: '/wordgame', label: 'Word Game', key: 'wordGame' },
  { path: '/trivia', label: 'Trivia', key: 'trivia' },
  { path: '/challenge', label: 'Challenge', key: 'challenge' },
]

const DEFAULT_OG_IMAGES = {
  home: '/og/og-home.png',
  explore: '/og/og-explore.png',
  play: '/og/og-play.png',
  pass: '/og/og-pass.png',
  listBusiness: '/og/og-list-business.png',
  handymen: '/og/og-handymen.png',
  about: '/og/og-home.png',
  leaderboard: '/og/og-play.png',
  community: '/og/og-home.png',
  deals: '/og/og-explore.png',
  discovery: '/og/og-explore.png',
  rewards: '/og/og-play.png',
  wordGame: '/og/og-play.png',
  trivia: '/og/og-play.png',
  challenge: '/og/og-play.png',
}

function SEOSection({ session }) {
  const [images, setImages] = useState({ ...DEFAULT_OG_IMAGES })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [uploading, setUploading] = useState(null) // which route key is uploading

  useEffect(() => {
    async function load() {
      try {
        const { getConfig } = await import('../../lib/cms.js')
        const saved = await getConfig('seo_og_images')
        if (saved && typeof saved === 'object') {
          setImages(prev => ({ ...prev, ...saved }))
        }
      } catch { /* use defaults */ }
    }
    load()
  }, [])

  async function save() {
    setSaving(true)
    try {
      const { adminUpdateConfig } = await import('../../lib/cms.js')
      await adminUpdateConfig('seo_og_images', images, session.user.id)
      setToast({ msg: 'OG images saved! Deploy to apply.', type: 'success' })
    } catch (e) {
      setToast({ msg: e.message, type: 'error' })
    }
    setSaving(false)
  }

  async function handleUpload(routeKey, e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(routeKey)
    try {
      const { uploadFile } = await import('../../lib/cms.js')
      const url = await uploadFile(file, 'og')
      setImages(prev => ({ ...prev, [routeKey]: url }))
      setToast({ msg: 'Image uploaded', type: 'success' })
    } catch (err) {
      setToast({ msg: 'Upload failed: ' + err.message, type: 'error' })
    }
    setUploading(null)
  }

  const cardStyle = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '0.75rem',
    padding: '1rem',
    marginBottom: '0.75rem',
  }
  const imgPreview = {
    width: '100%',
    maxWidth: 300,
    aspectRatio: '1200/630',
    objectFit: 'cover',
    borderRadius: '0.5rem',
    background: 'rgba(255,255,255,0.06)',
  }

  return (
    <>
      <div className="admin-table-wrap" style={{ padding: '1.5rem' }}>
        <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(14,165,233,0.06)', borderRadius: '0.75rem', border: '1px solid rgba(14,165,233,0.15)' }}>
          <h3 style={{ color: '#fff', fontSize: '0.95rem', marginBottom: '0.5rem' }}>🌐 SEO / Open Graph Images</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0, lineHeight: 1.6 }}>
            Manage the OG (Open Graph) images shown when links are shared on WhatsApp, Facebook, Twitter, and other social platforms.
            Recommended size: <strong style={{ color: '#fff' }}>1200×630 pixels</strong>. Upload or paste a URL for each route.
            Changes are saved to the database. Re-deploy to apply to the edge middleware.
          </p>
        </div>

        {SEO_ROUTES.map(route => (
          <div key={route.key} style={cardStyle}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              {/* Preview */}
              <div style={{ flexShrink: 0 }}>
                {images[route.key] ? (
                  <img
                    src={images[route.key].startsWith('http') ? images[route.key] : `https://visitnaija.online${images[route.key]}`}
                    alt={`OG for ${route.label}`}
                    style={imgPreview}
                    onError={e => { e.target.style.display = 'none' }}
                  />
                ) : (
                  <div style={{ ...imgPreview, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '0.8rem' }}>No image</div>
                )}
              </div>
              {/* Info & Controls */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem', marginBottom: '0.25rem' }}>{route.label}</div>
                <div style={{ color: '#64748b', fontSize: '0.75rem', marginBottom: '0.75rem' }}>Route: {route.path}</div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  <input
                    type="text"
                    value={images[route.key] || ''}
                    onChange={e => setImages(prev => ({ ...prev, [route.key]: e.target.value }))}
                    placeholder="/og/og-home.png or paste full URL"
                    style={{ flex: 1, minWidth: 180, padding: '0.45rem 0.6rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: '#fff', fontSize: '0.8rem', boxSizing: 'border-box' }}
                  />
                  <label style={{ padding: '0.45rem 0.75rem', background: 'rgba(200,150,62,0.15)', border: '1px solid rgba(200,150,62,0.3)', borderRadius: '0.5rem', color: '#C8963E', cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    📷 Upload
                    <input type="file" accept="image/*" hidden onChange={e => handleUpload(route.key, e)} />
                  </label>
                  {uploading === route.key && <span style={{ color: '#94a3b8', fontSize: '0.75rem', alignSelf: 'center' }}>Uploading...</span>}
                </div>
                <button
                  onClick={() => setImages(prev => ({ ...prev, [route.key]: DEFAULT_OG_IMAGES[route.key] || '' }))}
                  style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.7rem', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                >Reset to default</button>
              </div>
            </div>
          </div>
        ))}

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="admin-btn admin-btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save OG Images'}
          </button>
        </div>
      </div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  )
}

export default function AdminDashboard({ session, profile }) {
  const [active, setActive] = useState('overview')
  const userRole = profile?.role || 'user'

  // Filter sidebar tabs by role
  const visibleSections = SECTIONS.filter(s => {
    if (userRole === 'admin') return true
    if (userRole === 'moderator') return s.id !== 'settings'
    if (userRole === 'editor') return s.id !== 'settings' && s.id !== 'users'
    return true
  })

  const section = visibleSections.find(s => s.id === active) || visibleSections[0]

  return (
    <AdminGuard session={session} profile={profile}>
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-brand">
            <h2><WrenchRegular fontSize={24} style={{ verticalAlign: 'text-bottom', marginRight: '4px' }} /> Wanda <span>CMS</span></h2>
          </div>
          <nav className="admin-nav">
            {visibleSections.map((s, i) => (
              <div key={s.id}>
                {i === 1 && <div className="admin-nav-divider" />}
                {i === visibleSections.length - 1 && <div className="admin-nav-divider" />}
                {s.divider ? (
                  <div className="admin-nav-divider" style={{ padding: '0.5rem 1rem 0.2rem', fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{s.label}</div>
                ) : (
                <button
                  className={`admin-nav-item ${active === s.id ? 'active' : ''}`}
                  onClick={() => setActive(s.id)}
                >
                  <span className="nav-icon">{s.icon}</span>
                  {s.label}
                </button>
                )}
              </div>
            ))}
          </nav>
        </aside>
        <main className="admin-main">
          <div className="admin-page-header">
            <div>
              <h1>{section?.icon} {section?.label}</h1>
              <p>Manage your {section?.label.toLowerCase()} content</p>
            </div>
          </div>
          {active === 'overview' && <Overview />}
          {active === 'users' && <UsersSection session={session} profile={profile} />}
          {active === 'settings' && <SettingsSection session={session} />}
          {active === 'hero_page' && <HeroPageSection session={session} />}
          {active === 'submissions' && <SubmissionsSection session={session} />}
          {active === 'handymen' && <HandymenCMSSection session={session} />}
          {active === 'seo_og' && <SEOSection session={session} />}
          {section?.table && <CrudSection table={section.table} session={session} profile={profile} />}
          {section?.gameTable && <GameConfigSection table={section.gameTable} session={session} />}
        </main>
      </div>
    </AdminGuard>
  )
}

// ─── GAME ENGINE CONFIG SECTION ─────────────────────────────────
// Generic CRUD for game engine config tables.
// Reads/writes directly to Supabase (admin role has RLS write access).

const GAME_TABLE_FIELDS = {
  coin_config: [
    { key: 'key', label: 'Config Key', type: 'text', required: true, readOnlyOnEdit: true },
    { key: 'value', label: 'Value (integer)', type: 'number', required: true },
    { key: 'description', label: 'Description', type: 'text', full: true },
  ],
  store_items: [
    { key: 'slug', label: 'Slug', type: 'text', required: true, readOnlyOnEdit: true },
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'description', label: 'Description', type: 'text', full: true },
    { key: 'category', label: 'Category', type: 'select', options: ['consumable','cosmetic','tangible'] },
    { key: 'price_coins', label: 'Price (coins)', type: 'number', required: true },
    { key: 'icon', label: 'Icon (emoji)', type: 'text' },
    { key: 'is_available', label: 'Available', type: 'checkbox' },
    { key: 'is_one_time', label: 'One-time purchase', type: 'checkbox' },
    { key: 'sort_order', label: 'Sort Order', type: 'number' },
    { key: 'saving_count', label: 'Users Saving', type: 'number' },
  ],
  game_config: [
    { key: 'slug', label: 'Slug', type: 'text', required: true, readOnlyOnEdit: true },
    { key: 'name', label: 'Display Name', type: 'text', required: true },
    { key: 'description', label: 'Description', type: 'text', full: true },
    { key: 'icon', label: 'Icon (emoji)', type: 'text' },
    { key: 'max_levels', label: 'Max Levels', type: 'number' },
    { key: 'is_enabled', label: 'Enabled', type: 'checkbox' },
    { key: 'sort_order', label: 'Sort Order', type: 'number' },
    { key: 'route', label: 'Frontend Route', type: 'text' },
  ],
  level_config: [
    { key: 'level_min', label: 'Level Min', type: 'number', required: true },
    { key: 'level_max', label: 'Level Max', type: 'number', required: true },
    { key: 'difficulty', label: 'Difficulty (1-5)', type: 'number', required: true, min: 1, max: 5 },
    { key: 'time_limit_secs', label: 'Time Limit (secs)', type: 'number', required: true },
    { key: 'description', label: 'Description', type: 'text', full: true },
  ],
  questions: [
    { key: 'game_type', label: 'Game Type', type: 'select', required: true, options: ['map_quiz','postcards','guessword','trivia','pinpoint','flagstack'] },
    { key: 'category', label: 'Category', type: 'text' },
    { key: 'difficulty', label: 'Difficulty (1-5)', type: 'number', required: true, min: 1, max: 5 },
    { key: 'question_text', label: 'Question', type: 'textarea', required: true, full: true },
    { key: 'options', label: 'Options (JSON array)', type: 'textarea', full: true, placeholder: '["Option A","Option B","Option C","Option D"]' },
    { key: 'correct_answer', label: 'Correct Answer', type: 'text', required: true },
    { key: 'explanation', label: 'Explanation', type: 'textarea', full: true },
    { key: 'media_url', label: 'Media URL', type: 'text', full: true },
    { key: 'lat', label: 'Latitude', type: 'number', step: '0.000001' },
    { key: 'lng', label: 'Longitude', type: 'number', step: '0.000001' },
    { key: 'source', label: 'Source', type: 'select', options: ['manual','ai','community','opentdb','restcountries'] },
    { key: 'is_active', label: 'Active', type: 'checkbox' },
  ],
  seasons: [
    { key: 'name', label: 'Season Name', type: 'text', required: true },
    { key: 'starts_at', label: 'Start Date', type: 'datetime-local', required: true },
    { key: 'ends_at', label: 'End Date', type: 'datetime-local', required: true },
    { key: 'is_active', label: 'Active', type: 'checkbox' },
  ],
}

const GAME_TABLE_COLS = {
  coin_config: ['key', 'value', 'description'],
  store_items: ['name', 'category', 'price_coins', 'is_available', 'sort_order'],
  game_config: ['name', 'slug', 'max_levels', 'is_enabled', 'sort_order'],
  level_config: ['level_min', 'level_max', 'difficulty', 'time_limit_secs'],
  questions: ['game_type', 'category', 'difficulty', 'question_text', 'source', 'is_active'],
  seasons: ['name', 'starts_at', 'ends_at', 'is_active'],
}

const GAME_TABLE_PK = {
  coin_config: 'key',
  store_items: 'id',
  game_config: 'slug',
  level_config: 'id',
  questions: 'id',
  seasons: 'id',
}

function GameConfigSection({ table, session }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const fields = GAME_TABLE_FIELDS[table] || []
  const cols = GAME_TABLE_COLS[table] || []
  const pk = GAME_TABLE_PK[table] || 'id'
  const isEditing = modal && modal !== 'create'

  const load = useCallback(async () => {
    setLoading(true)
    try {
      if (!supabase) throw new Error('Supabase not available')
      let query = supabase.from(table).select('*')
      // Order by sort_order if available, else by first column
      if (['store_items', 'game_config'].includes(table)) query = query.order('sort_order')
      else if (table === 'level_config') query = query.order('level_min')
      else if (table === 'questions') query = query.order('created_at', { ascending: false }).limit(200)
      else if (table === 'seasons') query = query.order('starts_at', { ascending: false })
      else query = query.order(pk)
      const { data, error } = await query
      if (error) throw error
      setRows(data || [])
    } catch (e) {
      const msg = e.message || ''
      if (msg.includes('relation') || e.code === '42P01' || msg.includes('does not exist')) {
        setToast({ msg: `Table "${table}" does not exist in your database yet. Create it in Supabase SQL Editor or run the game engine migration.`, type: 'error' })
      } else {
        setToast({ msg: 'Load failed: ' + msg, type: 'error' })
      }
    }
    setLoading(false)
  }, [table, pk])

  useEffect(() => { load() }, [load])

  function openCreate() {
    const defaults = {}
    fields.forEach(f => {
      if (f.type === 'checkbox') defaults[f.key] = false
      else if (f.type === 'number') defaults[f.key] = ''
      else defaults[f.key] = ''
    })
    setForm(defaults)
    setModal('create')
  }

  function openEdit(row) {
    const formData = { ...row }
    // Convert options JSONB to string for editing
    if (formData.options && typeof formData.options !== 'string') {
      formData.options = JSON.stringify(formData.options)
    }
    // Convert dates for datetime-local inputs
    if (formData.starts_at) formData.starts_at = formData.starts_at.slice(0, 16)
    if (formData.ends_at) formData.ends_at = formData.ends_at.slice(0, 16)
    setForm(formData)
    setModal(row)
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (!supabase) throw new Error('Supabase not available')
      const record = { ...form }

      // Parse options JSON if present
      if (typeof record.options === 'string' && record.options.trim()) {
        try { record.options = JSON.parse(record.options) } catch { /* keep as string */ }
      }

      // Convert numeric fields
      fields.forEach(f => {
        if (f.type === 'number' && record[f.key] !== '' && record[f.key] != null) {
          record[f.key] = Number(record[f.key])
        }
      })

      record.updated_at = new Date().toISOString()

      // Only keep fields that are in the field def
      const knownKeys = new Set(fields.map(f => f.key))
      ;['id','updated_at','created_at'].forEach(k => knownKeys.add(k))
      const clean = {}
      for (const [k, v] of Object.entries(record)) {
        if (knownKeys.has(k)) clean[k] = v
      }

      if (modal === 'create') {
        const { error } = await supabase.from(table).insert(clean)
        if (error) throw error
      } else {
        const { error } = await supabase.from(table).update(clean).eq(pk, record[pk])
        if (error) throw error
      }

      setToast({ msg: 'Saved!', type: 'success' })
      setModal(null)
      load()
    } catch (e) {
      setToast({ msg: e.message, type: 'error' })
    }
    setSaving(false)
  }

  async function handleDelete(row) {
    try {
      if (!supabase) throw new Error('Supabase not available')
      const { error } = await supabase.from(table).delete().eq(pk, row[pk])
      if (error) throw error
      setToast({ msg: 'Deleted', type: 'success' })
      setConfirm(null)
      load()
    } catch (e) {
      setToast({ msg: e.message, type: 'error' })
    }
  }

  const filtered = rows.filter(r =>
    !search || Object.values(r).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <>
      <div className="admin-toolbar">
        <input className="admin-search" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        <button className="admin-btn admin-btn-primary" onClick={openCreate}>+ Add New</button>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: 'auto' }}>{filtered.length} records</span>
      </div>

      <div className="admin-table-wrap">
        {loading ? (
          <div className="admin-empty"><p>Loading...</p></div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty"><p>No records. Click "Add New" to create one.</p></div>
        ) : (
          <table className="admin-table">
            <thead><tr>
              {cols.map(c => <th key={c}>{c.replace(/_/g, ' ')}</th>)}
              <th>Actions</th>
            </tr></thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr key={row[pk] || i}>
                  {cols.map(c => {
                    let val = row[c]
                    if (typeof val === 'boolean') val = val ? '✅' : '—'
                    if (c === 'question_text' && typeof val === 'string') val = val.slice(0, 60) + (val.length > 60 ? '…' : '')
                    return <td key={c}>{val != null ? String(val) : '—'}</td>
                  })}
                  <td>
                    <button className="admin-btn admin-btn-sm" onClick={() => openEdit(row)}>Edit</button>
                    {' '}
                    <button className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => setConfirm(row)}>Del</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit/Create Modal */}
      {modal && (
        <div className="admin-modal-overlay" onClick={() => setModal(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()}>
            <h2>{modal === 'create' ? 'Create Record' : 'Edit Record'}</h2>
            <div className="admin-modal-fields">
              {fields.map(f => {
                const isReadOnly = isEditing && f.readOnlyOnEdit
                return (
                  <div key={f.key} className={`admin-field ${f.full ? 'full' : ''}`}>
                    <label>{f.label}{f.required && ' *'}</label>
                    {f.type === 'select' ? (
                      <select value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} disabled={isReadOnly}>
                        <option value="">—</option>
                        {(f.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : f.type === 'checkbox' ? (
                      <input type="checkbox" checked={!!form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.checked }))} disabled={isReadOnly} />
                    ) : f.type === 'textarea' ? (
                      <textarea value={form[f.key] || ''} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} rows={3} placeholder={f.placeholder} readOnly={isReadOnly} />
                    ) : (
                      <input
                        type={f.type === 'datetime-local' ? 'datetime-local' : f.type}
                        value={form[f.key] ?? ''}
                        onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        readOnly={isReadOnly}
                        min={f.min} max={f.max} step={f.step}
                      />
                    )}
                  </div>
                )
              })}
            </div>
            <div className="admin-modal-actions">
              <button className="admin-btn admin-btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button className="admin-btn" onClick={() => setModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirm && (
        <div className="admin-modal-overlay" onClick={() => setConfirm(null)}>
          <div className="admin-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <h3>Delete this record?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>This action cannot be undone.</p>
            <div className="admin-modal-actions">
              <button className="admin-btn admin-btn-danger" onClick={() => handleDelete(confirm)}>Delete</button>
              <button className="admin-btn" onClick={() => setConfirm(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </>
  )
}
