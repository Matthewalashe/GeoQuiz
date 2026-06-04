import { useState, useMemo, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import { SearchRegular, CallRegular, ChatRegular, ArrowRightRegular } from '@fluentui/react-icons'

const TRADES = [
  { value: 'all', label: 'All Trades', emoji: '🔍' },
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

function formatWhatsApp(number) {
  if (!number) return ''
  let digits = number.replace(/\D/g, '')
  if (digits.startsWith('0')) digits = '234' + digits.slice(1)
  else if (!digits.startsWith('234')) digits = '234' + digits
  return digits
}

export default function Handymen() {
  const [params] = useSearchParams()
  const initTrade = params.get('trade') || 'all'
  const [search, setSearch] = useState('')
  const [trade, setTrade] = useState(initTrade)
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        setError(null)
        if (!supabase) throw new Error('Service unavailable.')

        const { data, error: fetchErr } = await supabase
          .from('business_listings')
          .select('*')
          .eq('listing_type', 'handyman')
          .eq('status', 'approved')
          .order('name')

        if (fetchErr) throw fetchErr
        setListings(data || [])
      } catch (err) {
        console.error('Handymen fetch error:', err)
        setError(err.message || 'Failed to load.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    let results = listings
    if (trade !== 'all') results = results.filter(l => l.trade === trade)
    if (search.trim()) {
      const q = search.toLowerCase()
      results = results.filter(l =>
        l.name?.toLowerCase().includes(q) ||
        l.trade?.toLowerCase().includes(q) ||
        l.area?.toLowerCase().includes(q) ||
        l.description?.toLowerCase().includes(q)
      )
    }
    return results
  }, [listings, search, trade])

  const getTradeObj = (val) => TRADES.find(t => t.value === val) || null

  return (
    <section className="hm-page">
      {/* Header */}
      <div className="hm-header">
        <div className="hm-header-text">
          <h1 className="hm-title">🔧 Handymen & Artisans</h1>
          <p className="hm-subtitle">Find skilled tradespeople in Lagos</p>
        </div>
        <Link to="/list-your-business/form?type=handyman" className="hm-list-btn">
          List your trade <ArrowRightRegular fontSize={14} />
        </Link>
      </div>

      {/* Search */}
      <div className="hm-search-bar">
        <SearchRegular fontSize={18} className="hm-search-icon" />
        <input
          className="hm-search-input"
          type="text"
          placeholder="Search by name, trade, or area..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Trade chips */}
      <div className="hm-trades">
        {TRADES.map(t => (
          <button
            key={t.value}
            className={`hm-trade-chip${trade === t.value ? ' active' : ''}`}
            onClick={() => setTrade(t.value)}
          >
            <span>{t.emoji}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div className="hm-results-meta">
        <span>{filtered.length} {filtered.length === 1 ? 'handyman' : 'handymen'} found</span>
        {trade !== 'all' && (
          <button className="hm-clear" onClick={() => setTrade('all')}>Clear filter</button>
        )}
      </div>

      {/* Error */}
      {error ? (
        <div className="hm-empty">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h3>Failed to load</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>Try Again</button>
        </div>
      ) : loading ? (
        /* Skeleton */
        <div className="hm-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="hm-card hm-skeleton">
              <div className="hm-skeleton-avatar" />
              <div className="hm-skeleton-lines">
                <div className="hm-skeleton-line" style={{ width: '70%' }} />
                <div className="hm-skeleton-line" style={{ width: '50%' }} />
                <div className="hm-skeleton-line" style={{ width: '40%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        /* Empty state */
        <div className="hm-empty">
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🔧</div>
          <h3>No handymen listed yet</h3>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0.5rem auto 1.5rem' }}>
            Know a handyman? Share Wanda with them so they can list their services for free.
          </p>
          <Link to="/list-your-business/form?type=handyman" className="btn btn-primary">
            List as a Handyman
          </Link>
        </div>
      ) : (
        /* Cards grid */
        <div className="hm-grid">
          {filtered.map(person => {
            const tradeInfo = getTradeObj(person.trade)
            const hasPhoto = person.photos?.length > 0 || person.logo_url
            const photoSrc = person.logo_url || person.photos?.[0]
            const hasPhone = person.phone?.trim()
            const hasWhatsapp = person.whatsapp?.trim()

            return (
              <div key={person.id} className="hm-card">
                {/* Avatar / Photo */}
                <div className="hm-card-avatar">
                  {hasPhoto ? (
                    <img src={photoSrc} alt={person.name} onError={e => { e.target.style.display = 'none' }} />
                  ) : (
                    <span className="hm-card-avatar-emoji">{tradeInfo?.emoji || '🔧'}</span>
                  )}
                </div>

                {/* Info */}
                <div className="hm-card-info">
                  <h3 className="hm-card-name">{person.name}</h3>
                  {tradeInfo && (
                    <span className="hm-card-trade">{tradeInfo.emoji} {tradeInfo.label}</span>
                  )}
                  <span className="hm-card-area">📍 {person.area}</span>
                  {person.experience_years && (
                    <span className="hm-card-exp">🛠️ {person.experience_years}+ years</span>
                  )}
                  {person.service_areas?.length > 0 && (
                    <span className="hm-card-areas">Serves: {person.service_areas.join(', ')}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="hm-card-actions">
                  {hasPhone && (
                    <a href={`tel:${person.phone}`} className="hm-action-btn hm-action-call" title="Call">
                      <CallRegular fontSize={16} /> Call
                    </a>
                  )}
                  {hasWhatsapp && (
                    <a
                      href={`https://wa.me/${formatWhatsApp(person.whatsapp)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hm-action-btn hm-action-wa"
                      title="WhatsApp"
                    >
                      <ChatRegular fontSize={16} /> WhatsApp
                    </a>
                  )}
                  {!hasPhone && !hasWhatsapp && (
                    <span className="hm-card-no-contact">Contact via listing</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
