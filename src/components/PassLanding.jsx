import { useState } from 'react'
import { Link } from 'react-router-dom'
import { submitWaitlist } from '../lib/supabase.js'

const PASS_TYPES = [
  {
    id: 'explorer',
    name: 'Explorer Pass',
    tagline: 'Pick your favorites',
    desc: 'Choose 3, 5, or 7 attractions from our curated list. Use them at your own pace within 60 days.',
    options: ['3 Attractions', '5 Attractions', '7 Attractions'],
    icon: '🧭',
    color: 'var(--teal)',
  },
  {
    id: 'allday',
    name: 'All-Day Pass',
    tagline: 'Unlimited access',
    desc: 'Visit as many attractions as you want for 1, 2, or 3 consecutive days. Go at full speed.',
    options: ['1 Day', '2 Days', '3 Days'],
    icon: '🎟️',
    color: 'var(--primary)',
  },
]

const INCLUDED = [
  { icon: '📍', label: 'Attraction entry', desc: 'Skip-the-line at partner venues' },
  { icon: '🚐', label: 'Transport voucher', desc: 'Ride credits for getting between stops' },
  { icon: '🍽️', label: 'Restaurant deals', desc: 'Exclusive discounts at partner restaurants' },
  { icon: '📱', label: 'Digital pass', desc: 'QR code on your phone, no printing needed' },
]

const ATTRACTIONS = [
  'Nike Art Gallery', 'Lekki Conservation Centre', 'New Afrika Shrine',
  'Kalakuta Museum', 'Freedom Park', 'Tarkwa Bay Beach',
  'National Theatre', 'Elegushi Beach', 'Bogobiri House',
  'Olumo Rock', 'Badagry Heritage Museum', 'Inagbe Grand Resort',
]

export default function PassLanding() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [interest, setInterest] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    setSaving(true)
    try {
      await submitWaitlist({
        name: name.trim(),
        email: email.trim(),
        role: 'pass_interest',
        message: interest || 'Wanda Pass waitlist',
      })
    } catch (err) {
      console.error(err)
    }
    setSubmitted(true)
    setSaving(false)
  }

  return (
    <section className="pass-page">
      {/* Hero */}
      <div className="pass-hero">
        <span className="pass-badge">COMING SOON</span>
        <h1 className="pass-title">Wanda Pass</h1>
        <p className="pass-subtitle">
          One pass. Multiple attractions. Zero hassle.
          <br />
          The smartest way to experience Lagos.
        </p>
      </div>

      {/* How it works */}
      <div className="pass-section">
        <h2 className="pass-h2">How it works</h2>
        <div className="pass-steps">
          <div className="pass-step">
            <span className="pass-step-num">1</span>
            <strong>Pick your pass</strong>
            <span>Choose Explorer or All-Day based on your style</span>
          </div>
          <div className="pass-step">
            <span className="pass-step-num">2</span>
            <strong>Get your QR code</strong>
            <span>Instant digital pass on your phone</span>
          </div>
          <div className="pass-step">
            <span className="pass-step-num">3</span>
            <strong>Scan and enter</strong>
            <span>Show your pass at any partner venue</span>
          </div>
        </div>
      </div>

      {/* Pass types */}
      <div className="pass-section">
        <h2 className="pass-h2">Choose your pass</h2>
        <div className="pass-types">
          {PASS_TYPES.map(p => (
            <div key={p.id} className="pass-type-card" style={{ '--pc': p.color }}>
              <span className="pass-type-icon">{p.icon}</span>
              <h3>{p.name}</h3>
              <span className="pass-type-tag">{p.tagline}</span>
              <p>{p.desc}</p>
              <div className="pass-options">
                {p.options.map(o => (
                  <span key={o} className="pass-option">{o}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* What's included */}
      <div className="pass-section">
        <h2 className="pass-h2">What is included</h2>
        <div className="pass-included">
          {INCLUDED.map(i => (
            <div key={i.label} className="pass-inc-item">
              <span className="pass-inc-icon">{i.icon}</span>
              <div>
                <strong>{i.label}</strong>
                <span>{i.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Partner attractions */}
      <div className="pass-section">
        <h2 className="pass-h2">Partner attractions</h2>
        <div className="pass-partners">
          {ATTRACTIONS.map(a => (
            <span key={a} className="pass-partner">{a}</span>
          ))}
        </div>
        <p className="pass-more">...and more being added every week</p>
      </div>

      {/* Waitlist */}
      <div className="pass-section pass-waitlist-section">
        {submitted ? (
          <div className="pass-waitlist-done">
            <span>🎉</span>
            <h3>You are on the list!</h3>
            <p>We will notify you when the Wanda Pass launches.</p>
            <Link to="/explore" className="pass-explore-link">Explore Lagos while you wait →</Link>
          </div>
        ) : (
          <>
            <h2 className="pass-h2">Be first in line</h2>
            <p className="pass-waitlist-desc">
              Join the waitlist to get early access and launch-day pricing.
            </p>
            <form className="pass-form" onSubmit={handleSubmit}>
              <input
                type="text" placeholder="Your name" value={name}
                onChange={e => setName(e.target.value)} required
              />
              <input
                type="email" placeholder="Email address" value={email}
                onChange={e => setEmail(e.target.value)} required
              />
              <select value={interest} onChange={e => setInterest(e.target.value)}>
                <option value="">Which pass interests you?</option>
                <option value="explorer">Explorer Pass (pick attractions)</option>
                <option value="allday">All-Day Pass (unlimited)</option>
                <option value="both">Both - I want options</option>
              </select>
              <button type="submit" disabled={saving}>
                {saving ? 'Joining...' : 'Join the waitlist'}
              </button>
            </form>
          </>
        )}
      </div>
    </section>
  )
}
