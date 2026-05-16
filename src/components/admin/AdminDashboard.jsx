import { useState, useEffect, useCallback } from 'react'
import '../../admin.css'
import { adminFetch, adminUpsert, adminDelete, uploadFile } from '../../lib/cms.js'
import AdminGuard from './AdminGuard.jsx'
import {
  DataBarVerticalRegular, LocationRegular, GiftRegular, DiamondRegular,
  MapRegular, QuestionRegular, SettingsRegular, CheckmarkCircleRegular,
  DismissCircleRegular, MailInboxRegular, WrenchRegular
} from '@fluentui/react-icons'

// Section configs
const SECTIONS = [
  { id: 'overview', label: 'Overview', icon: <DataBarVerticalRegular /> },
  { id: 'listings', label: 'Listings', icon: <LocationRegular />, table: 'cms_listings' },
  { id: 'deals', label: 'Deals', icon: <GiftRegular />, table: 'cms_deals' },
  { id: 'sponsors', label: 'Sponsors', icon: <DiamondRegular />, table: 'cms_sponsors' },
  { id: 'discovery', label: 'Discovery', icon: <MapRegular />, table: 'cms_discovery' },
  { id: 'questions', label: 'Questions', icon: <QuestionRegular />, table: 'cms_questions' },
  { id: 'settings', label: 'Settings', icon: <SettingsRegular /> },
]

const FIELD_DEFS = {
  cms_listings: [
    { key: 'id', label: 'Slug ID', type: 'text', required: true, placeholder: 'e.g. nok-vi' },
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'category', label: 'Category', type: 'select', options: ['restaurant','hotel','attraction','nightlife','park','culture','experience','shopping'] },
    { key: 'subcategory', label: 'Subcategory', type: 'text' },
    { key: 'area', label: 'Area', type: 'text', placeholder: 'e.g. Victoria Island' },
    { key: 'price_range', label: 'Price Range', type: 'select', options: ['₦','₦₦','₦₦₦','₦₦₦₦'] },
    { key: 'rating', label: 'Rating', type: 'number', step: '0.1', min: 0, max: 5 },
    { key: 'phone', label: 'Phone', type: 'text' },
    { key: 'whatsapp', label: 'WhatsApp', type: 'text' },
    { key: 'website', label: 'Website', type: 'text' },
    { key: 'instagram', label: 'Instagram', type: 'text' },
    { key: 'hours', label: 'Hours', type: 'text' },
    { key: 'lat', label: 'Latitude', type: 'number', step: '0.000001' },
    { key: 'lng', label: 'Longitude', type: 'number', step: '0.000001' },
    { key: 'description', label: 'Description', type: 'textarea', full: true },
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
    { key: 'category', label: 'Category', type: 'select', options: ['food','nightlife','bars','beaches','parks','cinema','art','fitness','shopping','hotels','coworking','sports','kids','transport','wifi'] },
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
}

const TABLE_COLS = {
  cms_listings: ['name','category','area','rating','status'],
  cms_deals: ['business','offer','category','expiry','featured','status'],
  cms_sponsors: ['brand','tier','active','status'],
  cms_discovery: ['name','category','area','rating','sponsored','status'],
  cms_questions: ['question','category','difficulty','region','status'],
}

function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [onClose])
  return <div className={`admin-toast admin-toast-${type}`}>{type === 'success' ? <CheckmarkCircleRegular style={{ verticalAlign: 'middle' }} /> : <DismissCircleRegular style={{ verticalAlign: 'middle' }} />} {msg}</div>
}

function CrudSection({ table, session }) {
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
    setForm({ ...row })
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
      await adminUpsert(table, record)
      setToast({ msg: 'Saved successfully', type: 'success' })
      setModal(null)
      load()
    } catch (e) {
      if (e.message?.includes('row-level security') || e.code === '42501' || e.message?.includes('relation') || e.code === '42P01') {
        setToast({ msg: 'Database not ready: Please run migration-cms.sql in your Supabase SQL Editor.', type: 'error' })
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

  async function handleImageUpload(e, fieldKey) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadFile(file)
      setForm(f => ({ ...f, [fieldKey]: url }))
      setToast({ msg: 'Image uploaded', type: 'success' })
    } catch (err) {
      setToast({ msg: 'Upload failed: ' + err.message, type: 'error' })
    }
    setUploading(false)
  }

  const filtered = rows.filter(r =>
    !search || Object.values(r).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <>
      <div className="admin-toolbar">
        <input className="admin-search" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        <button className="admin-btn admin-btn-primary" onClick={openCreate}>+ Add New</button>
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
                    <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => setConfirm(row.id)}>Delete</button>
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
                {/* Image upload for tables that support it */}
                {(table === 'cms_listings' || table === 'cms_deals' || table === 'cms_discovery') && (
                  <div className="admin-field full-width">
                    <label>Image Upload</label>
                    <div className="admin-upload-area">
                      <input type="file" accept="image/*" onChange={e => handleImageUpload(e, table === 'cms_deals' ? 'image' : 'image')} />
                      {uploading && <p>Uploading...</p>}
                    </div>
                    {form.image && (
                      <div className="admin-upload-preview">
                        <img src={form.image} alt="Preview" />
                      </div>
                    )}
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
  useEffect(() => {
    async function load() {
      const tables = ['cms_listings','cms_deals','cms_sponsors','cms_discovery','cms_questions']
      const s = {}
      for (const t of tables) {
        try { s[t] = (await adminFetch(t)).length } catch { s[t] = 0 }
      }
      setStats(s)
    }
    load()
  }, [])
  return (
    <>
      <div className="admin-stats">
        <div className="admin-stat-card"><div className="stat-icon"><LocationRegular /></div><div className="stat-value">{stats.cms_listings || 0}</div><div className="stat-label">Listings</div></div>
        <div className="admin-stat-card"><div className="stat-icon"><GiftRegular /></div><div className="stat-value">{stats.cms_deals || 0}</div><div className="stat-label">Deals</div></div>
        <div className="admin-stat-card"><div className="stat-icon"><DiamondRegular /></div><div className="stat-value">{stats.cms_sponsors || 0}</div><div className="stat-label">Sponsors</div></div>
        <div className="admin-stat-card"><div className="stat-icon"><MapRegular /></div><div className="stat-value">{stats.cms_discovery || 0}</div><div className="stat-label">Discovery POIs</div></div>
        <div className="admin-stat-card"><div className="stat-icon"><QuestionRegular /></div><div className="stat-value">{stats.cms_questions || 0}</div><div className="stat-label">Quiz Questions</div></div>
      </div>
      <div className="admin-table-wrap" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
        <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>Welcome to Wanda CMS</h3>
        <p>Select a section from the sidebar to manage your content.</p>
        <p style={{ marginTop: '0.75rem', fontSize: '0.8rem' }}>All changes go live immediately when status is set to "published".</p>
      </div>
    </>
  )
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
        setConfigs(c)
      } catch { /* empty */ }
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
        <div className="admin-form-grid">
          {Object.entries(configs).map(([key, val]) => (
            <div key={key} className="admin-field">
              <label>{key.replace(/_/g, ' ')}</label>
              <input
                type="text"
                value={val}
                onChange={e => setConfigs(prev => ({ ...prev, [key]: e.target.value }))}
              />
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

export default function AdminDashboard({ session, profile }) {
  const [active, setActive] = useState('overview')
  const section = SECTIONS.find(s => s.id === active)

  return (
    <AdminGuard session={session} profile={profile}>
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-brand">
            <h2><WrenchRegular fontSize={24} style={{ verticalAlign: 'text-bottom', marginRight: '4px' }} /> Wanda <span>CMS</span></h2>
          </div>
          <nav className="admin-nav">
            {SECTIONS.map((s, i) => (
              <div key={s.id}>
                {i === 1 && <div className="admin-nav-divider" />}
                {i === SECTIONS.length - 1 && <div className="admin-nav-divider" />}
                <button
                  className={`admin-nav-item ${active === s.id ? 'active' : ''}`}
                  onClick={() => setActive(s.id)}
                >
                  <span className="nav-icon">{s.icon}</span>
                  {s.label}
                </button>
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
          {active === 'settings' && <SettingsSection session={session} />}
          {section?.table && <CrudSection table={section.table} session={session} />}
        </main>
      </div>
    </AdminGuard>
  )
}
