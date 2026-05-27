import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'

export default function ListBusinessLanding() {
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (!supabase) { setChecking(false); return }
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setChecking(false)
    })
  }, [])

  function handleContinue() {
    if (session) {
      navigate('/list-your-business/form')
    } else {
      navigate('/auth?redirect=/list-your-business/form')
    }
  }

  return (
    <section className="lyb-page">
      {/* Hero */}
      <div className="lyb-hero">
        <div className="lyb-hero-badge">FREE TO LIST</div>
        <h1 className="lyb-hero-title">Put your business on the map</h1>
        <p className="lyb-hero-sub">
          Join hundreds of Lagos businesses being discovered by thousands of explorers every day on Wanda.
        </p>
      </div>

      {/* Stats banner */}
      <div className="lyb-stats">
        <div className="lyb-stat">
          <span className="lyb-stat-num">5,000+</span>
          <span className="lyb-stat-label">Monthly explorers</span>
        </div>
        <div className="lyb-stat">
          <span className="lyb-stat-num">46+</span>
          <span className="lyb-stat-label">Businesses listed</span>
        </div>
        <div className="lyb-stat">
          <span className="lyb-stat-num">100%</span>
          <span className="lyb-stat-label">Free to start</span>
        </div>
      </div>

      {/* Why list */}
      <div className="lyb-section">
        <h2 className="lyb-h2">Why list on Wanda?</h2>
        <div className="lyb-benefits">
          <div className="lyb-benefit">
            <div className="lyb-benefit-icon">{'\ud83d\udccd'}</div>
            <div>
              <h3>Get discovered</h3>
              <p>Your business appears on our interactive map and Explore feed — seen by people actively looking for places to visit in Lagos.</p>
            </div>
          </div>
          <div className="lyb-benefit">
            <div className="lyb-benefit-icon">{'\ud83d\udcac'}</div>
            <div>
              <h3>Direct WhatsApp leads</h3>
              <p>Customers can message or call you directly from your listing. No middleman, no commission — just direct connections.</p>
            </div>
          </div>
          <div className="lyb-benefit">
            <div className="lyb-benefit-icon">{'\ud83c\udfaf'}</div>
            <div>
              <h3>Targeted audience</h3>
              <p>Wanda users are explorers, foodies, and experience-seekers. They're not just browsing — they're looking for their next outing.</p>
            </div>
          </div>
          <div className="lyb-benefit">
            <div className="lyb-benefit-icon">{'\ud83c\udfae'}</div>
            <div>
              <h3>Gamified engagement</h3>
              <p>Users earn points for visiting listed places. This means real foot traffic driven to your door through our unique quiz and check-in features.</p>
            </div>
          </div>
          <div className="lyb-benefit">
            <div className="lyb-benefit-icon">{'\ud83e\udd1d'}</div>
            <div>
              <h3>Partnership opportunities</h3>
              <p>Top-performing businesses get invited to run exclusive deals and featured promotions through Wanda's Deals section.</p>
            </div>
          </div>
          <div className="lyb-benefit">
            <div className="lyb-benefit-icon">{'\ud83d\udcca'}</div>
            <div>
              <h3>Analytics & insights</h3>
              <p>See how many people view your listing, tap your WhatsApp, and save your business. Data that helps you understand your reach.</p>
            </div>
          </div>
        </div>
      </div>

      {/* What you need */}
      <div className="lyb-section">
        <h2 className="lyb-h2">What you'll need</h2>
        <div className="lyb-checklist">
          <div className="lyb-check-item"><span className="lyb-check">{'\u2713'}</span> Business name and category</div>
          <div className="lyb-check-item"><span className="lyb-check">{'\u2713'}</span> Area / neighborhood in Lagos</div>
          <div className="lyb-check-item"><span className="lyb-check">{'\u2713'}</span> Contact info (phone, WhatsApp, or Instagram)</div>
          <div className="lyb-check-item"><span className="lyb-check">{'\u25cb'}</span> Business logo <span className="lyb-optional">(optional but recommended)</span></div>
          <div className="lyb-check-item"><span className="lyb-check">{'\u25cb'}</span> Photos of your business <span className="lyb-optional">(up to 5)</span></div>
          <div className="lyb-check-item"><span className="lyb-check">{'\u25cb'}</span> Short description <span className="lyb-optional">(what makes you special)</span></div>
        </div>
      </div>

      {/* How it works */}
      <div className="lyb-section">
        <h2 className="lyb-h2">How it works</h2>
        <div className="lyb-steps">
          <div className="lyb-step">
            <div className="lyb-step-num">1</div>
            <div>
              <h3>Fill out your details</h3>
              <p>Takes about 3 minutes. Add your business info, upload your logo and photos.</p>
            </div>
          </div>
          <div className="lyb-step">
            <div className="lyb-step-num">2</div>
            <div>
              <h3>We review & approve</h3>
              <p>Our team reviews every submission within 24-48 hours to maintain quality.</p>
            </div>
          </div>
          <div className="lyb-step">
            <div className="lyb-step-num">3</div>
            <div>
              <h3>Go live on Wanda</h3>
              <p>Once approved, your listing appears on the Explore page, map, and search — instantly reachable by all users.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="lyb-section">
        <h2 className="lyb-h2">Who can list?</h2>
        <p className="lyb-section-sub">We welcome businesses across all categories:</p>
        <div className="lyb-categories">
          {['🍽️ Restaurants', '🏨 Hotels', '🎭 Attractions', '🌊 Beaches', '🏛️ Heritage sites', '🛍️ Shopping', '🌙 Nightlife', '🎨 Art galleries', '🏪 Markets', '🌿 Parks', '💪 Fitness', '☕ Cafés', '💇 Salons', '🔧 Artisans', '🏗️ Services', '📸 Photography', '👗 Fashion', '🏥 Healthcare', '📚 Education', '🚚 Logistics'].map(cat => (
            <span key={cat} className="lyb-cat-chip">{cat}</span>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="lyb-section">
        <h2 className="lyb-h2">Frequently asked questions</h2>
        <div className="lyb-faq">
          <details className="lyb-faq-item">
            <summary>Is it really free?</summary>
            <p>Yes, listing your business on Wanda is completely free during our early access period. We may introduce premium features later, but basic listings will always remain free.</p>
          </details>
          <details className="lyb-faq-item">
            <summary>How long until my listing goes live?</summary>
            <p>We review all submissions within 24-48 hours. Once approved, your listing appears instantly to all Wanda users.</p>
          </details>
          <details className="lyb-faq-item">
            <summary>Can I edit my listing after submission?</summary>
            <p>Currently, you can contact us to make changes. We're working on a self-service dashboard where you'll be able to edit your listing, update photos, and view analytics.</p>
          </details>
          <details className="lyb-faq-item">
            <summary>What if my business is rejected?</summary>
            <p>We only reject listings that appear to be spam or contain inaccurate information. If rejected, you'll receive feedback and can resubmit with corrections.</p>
          </details>
          <details className="lyb-faq-item">
            <summary>Do I need a physical location?</summary>
            <p>Yes, Wanda is focused on places people can visit. If you offer services without a physical location (e.g., delivery-only), include the area you serve.</p>
          </details>
        </div>
      </div>

      {/* CTA */}
      <div className="lyb-cta-section">
        <h2 className="lyb-cta-title">Ready to get discovered?</h2>
        <p className="lyb-cta-sub">It takes less than 3 minutes to list your business. No fees, no contracts.</p>
        <button className="lyb-cta-btn" onClick={handleContinue} disabled={checking}>
          {checking ? 'Loading...' : session ? 'Continue to listing form \u2192' : 'Sign up & list your business \u2192'}
        </button>
        {!session && (
          <p className="lyb-cta-note">Already have an account? <Link to="/auth?redirect=/list-your-business/form">Sign in here</Link></p>
        )}
      </div>
    </section>
  )
}
