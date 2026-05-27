import { useState, useMemo, useEffect } from 'react'
import { DEAL_CATEGORIES } from '../data/deals.js'
import { getDeals } from '../lib/cms.js'
import { Link } from 'react-router-dom'

// ── Helpers ──────────────────────────────────────────────────────────────────
function daysUntil(dateStr) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const expiry = new Date(dateStr); expiry.setHours(0, 0, 0, 0)
  return Math.ceil((expiry - today) / 86400000)
}

function ExpiryBadge({ dateStr, mechanic }) {
  const days = daysUntil(dateStr)
  if (mechanic === 'flash' || days <= 0) {
    return <span className="deal-tag deal-tag-flash">⚡ Today only!</span>
  }
  if (days <= 7) {
    return <span className="deal-tag deal-tag-urgent">⏳ {days}d left</span>
  }
  return <span className="deal-tag deal-tag-active">✅ Active</span>
}

// ── DealCard ──────────────────────────────────────────────────────────────────
function DealCard({ deal, onClaim }) {
  const days = daysUntil(deal.expiry)
  const expired = days < 0 && deal.mechanic !== 'flash'

  return (
    <div
      className={`deal-card ${deal.featured ? 'deal-card-featured' : ''} ${expired ? 'deal-card-expired' : ''}`}
      style={{ '--deal-color': deal.color }}
    >
      {deal.featured && <div className="deal-featured-banner">⭐ Featured Deal</div>}
      <div className="deal-card-img" style={{ backgroundImage: `url(${deal.image})` }}>
        <span className="deal-badge-emoji">{deal.badge}</span>
        <div className="deal-img-overlay" />
      </div>
      <div className="deal-card-body">
        <div className="deal-card-meta">
          <span className="deal-category-tag">{deal.categoryLabel}</span>
          <ExpiryBadge dateStr={deal.expiry} mechanic={deal.mechanic} />
        </div>
        <h3 className="deal-business">{deal.business}</h3>
        <p className="deal-offer">{deal.offer}</p>
        <div className="deal-location">📍 {deal.location}</div>

        {deal.questUnlock && (
          <div className="deal-quest-unlock">
            🔒 Unlock: <em>{deal.questUnlock}</em>
          </div>
        )}

        <button
          className={`deal-claim-btn ${expired ? 'deal-claim-expired' : ''}`}
          style={{ background: expired ? undefined : deal.color }}
          disabled={expired}
          onClick={() => !expired && onClaim(deal)}
        >
          {expired ? 'Offer Expired' : deal.mechanic === 'quest_complete' ? '🔓 Unlock This Deal' : '🎁 Claim Offer'}
        </button>
      </div>
    </div>
  )
}

// ── Claim Modal ────────────────────────────────────────────────────────────────
function ClaimModal({ deal, onClose }) {
  const [claimed, setClaimed] = useState(false)
  // Pre-compute QR pattern and voucher ID to avoid impure calls during render
  const [qrCells] = useState(() => Array.from({ length: 100 }, () => Math.random() > 0.5))
  const [voucherId] = useState(() => `GQ-${deal.id.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`)
  if (!deal) return null

  return (
    <div className="deal-modal-overlay" onClick={onClose}>
      <div className="deal-modal" onClick={e => e.stopPropagation()}>
        <button className="deal-modal-close" onClick={onClose}>✕</button>

        <div className="deal-modal-header" style={{ background: deal.color }}>
          <span className="deal-modal-emoji">{deal.badge}</span>
          <div>
            <div className="deal-modal-business">{deal.business}</div>
            <div className="deal-modal-location">📍 {deal.location}</div>
          </div>
        </div>

        <div className="deal-modal-body">
          <div className="deal-modal-offer">{deal.offer}</div>

          {claimed ? (
            <>
              {/* QR Code Placeholder — unique per deal */}
              <div className="deal-voucher">
                <div className="deal-voucher-inner">
                  <div className="deal-qr-grid">
                    {qrCells.map((filled, i) => (
                      <div key={i} className={`deal-qr-cell ${filled ? 'filled' : ''}`} />
                    ))}
                  </div>
                  <p className="deal-voucher-id">{voucherId}</p>
                  <p className="deal-voucher-hint">Show this screen to staff</p>
                </div>
                <div className="deal-voucher-pulse" style={{ borderColor: deal.color }} />
              </div>
              <p className="deal-modal-desc">{deal.description}</p>
              <div className="deal-modal-expiry">
                <ExpiryBadge dateStr={deal.expiry} mechanic={deal.mechanic} />
              </div>
              <p className="deal-modal-tip">💡 Keep this screen visible — staff will scan or note your voucher code.</p>
            </>
          ) : deal.mechanic === 'quest_complete' ? (
            <>
              <div className="deal-locked-info">
                <span className="deal-locked-icon">🔒</span>
                <p>This deal unlocks when you: <strong>{deal.questUnlock}</strong></p>
              </div>
              <p className="deal-modal-desc">{deal.description}</p>
              <button className="deal-action-btn" style={{ background: deal.color }}
                onClick={() => setClaimed(true)}>
                I've completed it — Show voucher
              </button>
            </>
          ) : (
            <>
              <p className="deal-modal-desc">{deal.description}</p>
              <button className="deal-action-btn" style={{ background: deal.color }}
                onClick={() => setClaimed(true)}>
                🎁 Tap to reveal voucher
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DealsPage() {
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [claimingDeal, setClaimingDeal] = useState(null)
  const [flashOnly, setFlashOnly] = useState(false)
  const [questOnly, setQuestOnly] = useState(false)
  const [dealsList, setDealsList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDeals()
      .then(data => {
        setDealsList(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    return dealsList.filter(d => {
      const catMatch = activeCategory === 'all' || d.category === activeCategory
      const flashMatch = !flashOnly || d.mechanic === 'flash'
      const questMatch = !questOnly || d.mechanic === 'quest_complete'
      const searchMatch = !searchQuery ||
        d.business.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.offer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.location.toLowerCase().includes(searchQuery.toLowerCase())
      return catMatch && flashMatch && questMatch && searchMatch
    })
  }, [dealsList, activeCategory, searchQuery, flashOnly, questOnly])

  const featuredDeals = filtered.filter(d => d.featured)
  const regularDeals = filtered.filter(d => !d.featured)

  return (
    <div className="deals-page">
      {claimingDeal && <ClaimModal deal={claimingDeal} onClose={() => setClaimingDeal(null)} />}

      {/* Hero header */}
      <div className="deals-hero">
        <div className="deals-hero-inner">
          <div className="deals-hero-badge">🎁 GeoQuiz Deals</div>
          <h1 className="deals-hero-title">Exclusive Offers</h1>
          <p className="deals-hero-sub">Real discounts at Lagos businesses — just for GeoQuiz players</p>
          <div className="deals-stats">
            <div className="deal-stat">
              <span className="deal-stat-num">{dealsList.length}</span>
              <span className="deal-stat-label">Active Deals</span>
            </div>
            <div className="deal-stat-div" />
            <div className="deal-stat">
              <span className="deal-stat-num">{dealsList.filter(d => d.featured).length}</span>
              <span className="deal-stat-label">Featured</span>
            </div>
            <div className="deal-stat-div" />
            <div className="deal-stat">
              <span className="deal-stat-num">{dealsList.filter(d => d.mechanic === 'flash').length}</span>
              <span className="deal-stat-label">Flash Today</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="deals-search-bar">
        <input
          className="deals-search-input"
          type="search"
          placeholder="🔍 Search businesses, areas…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Quick filter pills */}
      <div className="deals-filter-pills">
        <button
          className={`deal-filter-pill ${flashOnly ? 'active' : ''}`}
          onClick={() => { setFlashOnly(f => !f); setQuestOnly(false) }}
          style={{ '--pill-color': '#ef4444' }}
        >
          ⚡ Flash Deals
        </button>
        <button
          className={`deal-filter-pill ${questOnly ? 'active' : ''}`}
          onClick={() => { setQuestOnly(q => !q); setFlashOnly(false) }}
          style={{ '--pill-color': '#8b5cf6' }}
        >
          🔓 Quest Unlocks
        </button>
      </div>

      {/* Category tabs */}
      <div className="deals-cat-scroll">
        {DEAL_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            className={`deals-cat-btn ${activeCategory === cat.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>

      {/* Flash deals banner if any today */}
      {dealsList.filter(d => d.mechanic === 'flash').length > 0 && !flashOnly && !questOnly && activeCategory === 'all' && (
        <div className="deals-flash-banner">
          <span className="flash-pulse">⚡</span>
          <strong> Flash deals available today!</strong>
          <button onClick={() => setFlashOnly(true)}>See all →</button>
        </div>
      )}

      {loading ? (
        <div className="ex-empty" style={{ minHeight: '40vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="loading-icon" style={{ animation: 'float 2s ease-in-out infinite', fontSize: '3rem' }}>🧭</div>
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading deals...</p>
        </div>
      ) : (
        <div className="deals-content">
          {/* Featured grid */}
          {featuredDeals.length > 0 && (
            <section className="deals-section">
              <h2 className="deals-section-title">⭐ Featured Deals</h2>
              <div className="deals-grid deals-grid-featured">
                {featuredDeals.map(deal => (
                  <DealCard key={deal.id} deal={deal} onClaim={setClaimingDeal} />
                ))}
              </div>
            </section>
          )}

          {/* Regular deals */}
          {regularDeals.length > 0 && (
            <section className="deals-section">
              <h2 className="deals-section-title">All Deals</h2>
              <div className="deals-grid">
                {regularDeals.map(deal => (
                  <DealCard key={deal.id} deal={deal} onClaim={setClaimingDeal} />
                ))}
              </div>
            </section>
          )}

          {filtered.length === 0 && (
            <div className="deals-empty">
              <span className="deals-empty-icon">🔍</span>
              <p>No deals found for that search.</p>
              <button className="btn btn-outline" onClick={() => { setSearchQuery(''); setActiveCategory('all'); setFlashOnly(false); setQuestOnly(false) }}>
                Clear filters
              </button>
            </div>
          )}

          {/* List your business CTA */}
          <div className="deals-list-cta">
            <div className="deals-list-cta-inner">
              <span className="deals-list-icon">🏪</span>
              <div>
                <strong>Own a business?</strong>
                <p>Reach GeoQuiz players near your location. From ₦5,000/month.</p>
              </div>
              <Link
                to="/list-your-business"
                className="btn btn-primary deals-list-btn"
              >
                List My Business
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
