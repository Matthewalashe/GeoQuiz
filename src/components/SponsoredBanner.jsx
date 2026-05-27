import { useState, useEffect } from 'react'
import { getSponsors } from '../lib/cms.js'

// Sponsor logo with fallback to emoji
function SponsorLogo({ sponsor, size = 36 }) {
  const [failed, setFailed] = useState(false)
  if (!sponsor.logo || failed) {
    return <span className="sponsor-emoji" style={{ fontSize: size * 0.7 }}>{sponsor.icon}</span>
  }
  return (
    <img
      src={sponsor.logo}
      alt={sponsor.brand}
      className="sponsor-logo-img"
      width={size}
      height={size}
      onError={() => setFailed(true)}
      loading="lazy"
      style={{ width: size, height: size, objectFit: 'contain', borderRadius: 6, background: '#fff' }}
    />
  )
}

// In-game sponsored banner — shows below funFact during feedback
export function SponsoredBanner({ questionId }) {
  const [sponsor, setSponsor] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSponsors()
      .then(sponsors => {
        const found = sponsors.find(s => s.active && s.questionIds?.includes(questionId))
        if (found) {
          // 30% chance to show (respect user experience)
          if (Math.random() <= 0.3) {
            setSponsor(found)
          }
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [questionId])

  if (loading || !sponsor) return null

  return (
    <div className="sponsored-banner">
      <span className="sponsored-label">Sponsored</span>
      <div className="sponsored-brand">
        <SponsorLogo sponsor={sponsor} size={28} />
        <span>{sponsor.brand}</span>
      </div>
      <div className="sponsored-msg">{sponsor.message}</div>
      <a href={sponsor.url} target="_blank" rel="noopener noreferrer" className="sponsored-cta">
        {sponsor.cta} →
      </a>
    </div>
  )
}

// Results page Journey Card — shows nearby sponsors based on quiz areas
export function JourneyCard({ results }) {
  const [sponsorsList, setSponsorsList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSponsors()
      .then(sponsors => {
        setSponsorsList(sponsors)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (!results || results.length === 0 || loading) return null

  const questionIds = results.map(r => r.question.id)
  
  const seen = new Set()
  const journeySponsors = sponsorsList.filter(s => {
    if (!s.active || seen.has(s.id)) return false
    const match = s.questionIds?.some(qid => questionIds.includes(qid))
    if (match) {
      seen.add(s.id)
      return true
    }
    return false
  }).slice(0, 3) // Max 3 sponsors on results

  if (journeySponsors.length === 0) return null

  // Build route from answer names
  const route = results
    .slice(0, 5)
    .map(r => r.question.answer.name.split(',')[0].split('(')[0].trim())
    .filter((v, i, a) => a.indexOf(v) === i) // unique
    .join(' → ')

  return (
    <div className="journey-card">
      <div className="journey-header">
        <h4>🗺️ Your Quiz Journey</h4>
        <div className="journey-route">{route}</div>
      </div>
      <div className="journey-sponsors">
        {journeySponsors.map(s => (
          <div key={s.id} className="journey-sponsor-item">
            <div className="journey-sponsor-icon">
              <SponsorLogo sponsor={s} size={40} />
            </div>
            <div className="journey-sponsor-info">
              <div className="journey-sponsor-name">{s.brand}</div>
              <div className="journey-sponsor-msg">{s.message}</div>
              <div className="journey-sponsor-actions">
                <a href={s.url} target="_blank" rel="noopener noreferrer">{s.cta}</a>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="journey-footer">📍 Powered by visitnaija.online</div>
    </div>
  )
}

// Reusable sponsor card for landing + results pages
export function SponsorCard({ sponsor }) {
  return (
    <a href={sponsor.url} target="_blank" rel="noopener noreferrer" className="sponsor-card-link">
      <SponsorLogo sponsor={sponsor} size={36} />
      <div className="sponsor-card-info">
        <div className="sponsor-card-brand">{sponsor.brand}</div>
        <div className="sponsor-card-msg">{sponsor.message}</div>
      </div>
      <span className="sponsor-card-cta">{sponsor.cta} →</span>
    </a>
  )
}
