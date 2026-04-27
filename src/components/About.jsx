import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function About() {
  const [waitlistForm, setWaitlistForm] = useState({ name: '', email: '', role: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    // Store locally for now — Supabase integration later
    const existing = JSON.parse(localStorage.getItem('geoquiz_waitlist') || '[]')
    existing.push({ ...waitlistForm, date: new Date().toISOString() })
    localStorage.setItem('geoquiz_waitlist', JSON.stringify(existing))
    setSubmitted(true)
  }

  return (
    <section className="about-page">
      {/* Mission */}
      <div className="about-section">
        <div className="about-badge">About GeoQuiz</div>
        <h2>Why GeoQuiz?</h2>
        <div className="about-grid">
          <div className="about-card">
            <div className="about-icon">🎯</div>
            <h3>The Problem</h3>
            <p>
              GIS and spatial analysis skills are increasingly critical in urban planning, 
              environmental management, and governance — yet traditional learning methods 
              lack engagement. Students and professionals need an interactive, gamified way 
              to build spatial thinking skills and geographic knowledge.
            </p>
          </div>
          <div className="about-card">
            <div className="about-icon">💡</div>
            <h3>The Solution</h3>
            <p>
              GeoQuiz turns geographic learning into an engaging pin-drop challenge. 
              By testing spatial knowledge through interactive maps, users build intuition 
              for coordinates, distances, landmarks, and spatial relationships — skills 
              essential for GIS professionals.
            </p>
          </div>
          <div className="about-card">
            <div className="about-icon">🌍</div>
            <h3>The Vision</h3>
            <p>
              Starting with Lagos, we're building a comprehensive GIS training platform 
              that will expand across all 36 Nigerian states, covering urban planning, 
              environmental zones, cultural heritage, economic corridors, and more.
            </p>
          </div>
        </div>
      </div>

      {/* Who Uses It */}
      <div className="about-section">
        <h2>Who Uses GeoQuiz?</h2>
        <div className="users-grid">
          <div className="user-card card card-accent-top">
            <h3>🎓 GIS Students</h3>
            <p>Students learning spatial analysis, cartography, urban planning, and remote sensing use GeoQuiz to practice location awareness and coordinate literacy.</p>
          </div>
          <div className="user-card card card-accent-red">
            <h3>🏛️ Government Staff</h3>
            <p>Lagos State GIS office staff and LASPIC members use GeoQuiz for professional development and spatial reasoning training.</p>
          </div>
          <div className="user-card card card-accent-yellow">
            <h3>🗺️ Urban Planners</h3>
            <p>Professionals working on urban development, land use planning, and infrastructure projects sharpen their Lagos geography knowledge.</p>
          </div>
          <div className="user-card card card-accent-blue">
            <h3>📚 Researchers</h3>
            <p>Academics and researchers studying Nigerian geography, environmental science, and socioeconomic patterns.</p>
          </div>
        </div>
      </div>

      {/* Version Info */}
      <div className="about-section">
        <h2>Version & Roadmap</h2>
        <div className="version-card card">
          <div className="version-header">
            <span className="version-tag">v1.0 — Lagos Edition</span>
            <span className="version-date">April 2026</span>
          </div>
          <div className="version-features">
            <h4>Current Features</h4>
            <ul>
              <li>70+ questions across 8 categories</li>
              <li>Pin-drop gameplay with distance-based scoring</li>
              <li>All 20 Lagos LGAs covered</li>
              <li>Landmarks, markets, transport, culture, education, islands, industry</li>
              <li>Official state boundary from geoBoundaries (GRID3)</li>
              <li>Topographic, terrain, and satellite map layers</li>
              <li>Local leaderboard with score tracking</li>
            </ul>
          </div>
          <div className="version-features">
            <h4>Up Next (v2.0)</h4>
            <ul>
              <li>🗺️ Expand to all 36 Nigerian states + FCT</li>
              <li>✏️ Zone Sketcher — draw boundaries and regions</li>
              <li>🧭 Coordinate Challenge mode</li>
              <li>🛰️ Remote sensing and satellite imagery questions</li>
              <li>📊 Supabase backend with global leaderboard</li>
              <li>👥 Multiplayer challenge mode</li>
              <li>📁 Custom question sets for teachers/trainers</li>
              <li>📱 LCDA-level boundary data integration</li>
              <li>🤖 AI-powered learning from user inputs</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Credits */}
      <div className="about-section credits-section">
        <h2>Credits</h2>
        <div className="credits-card card">
          <p className="credits-line">
            <strong>Conceived by</strong> LASPIC staff to train on GIS and spatial analysis
          </p>
          <p className="credits-line">
            <strong>Developed by</strong> <span className="brand-name">WhiteArts Technologies and Services Limited</span>
          </p>
          <div className="credits-contact">
            <h4>Get in Touch</h4>
            <p>For enquiries, collaboration, ideas, queries, and suggestions:</p>
            <div className="contact-links">
              <a href="mailto:donghinny91@gmail.com" className="btn btn-outline btn-sm" id="contact-email">
                ✉️ donghinny91@gmail.com
              </a>
              <a href="https://wa.me/2348184495633" target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" id="contact-whatsapp">
                💬 WhatsApp: 08184495633
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Waitlist */}
      <div className="about-section waitlist-section">
        <h2>Join the Waitlist</h2>
        <p className="waitlist-desc">
          Be the first to know when GeoQuiz v2.0 launches with all 36 states, multiplayer mode, 
          and the full GIS training platform. Sign up below.
        </p>
        {submitted ? (
          <div className="waitlist-success card card-accent-top">
            <h3>🎉 You're on the list!</h3>
            <p>Thank you for your interest. We'll notify you when the full version launches.</p>
            <Link to="/" className="btn btn-primary mt-2">Back to Home</Link>
          </div>
        ) : (
          <form className="waitlist-form card" onSubmit={handleSubmit} id="waitlist-form">
            <div className="form-group">
              <label htmlFor="wl-name">Full Name *</label>
              <input type="text" id="wl-name" required value={waitlistForm.name}
                onChange={e => setWaitlistForm({ ...waitlistForm, name: e.target.value })}
                placeholder="Your full name" />
            </div>
            <div className="form-group">
              <label htmlFor="wl-email">Email Address *</label>
              <input type="email" id="wl-email" required value={waitlistForm.email}
                onChange={e => setWaitlistForm({ ...waitlistForm, email: e.target.value })}
                placeholder="you@example.com" />
            </div>
            <div className="form-group">
              <label htmlFor="wl-role">Your Role</label>
              <select id="wl-role" value={waitlistForm.role}
                onChange={e => setWaitlistForm({ ...waitlistForm, role: e.target.value })}>
                <option value="">Select your role...</option>
                <option value="student">GIS Student</option>
                <option value="professional">GIS Professional</option>
                <option value="government">Government Staff</option>
                <option value="researcher">Researcher / Academic</option>
                <option value="planner">Urban Planner</option>
                <option value="teacher">Teacher / Trainer</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="wl-message">Message (Optional)</label>
              <textarea id="wl-message" rows="3" value={waitlistForm.message}
                onChange={e => setWaitlistForm({ ...waitlistForm, message: e.target.value })}
                placeholder="Any features you'd like to see?" />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Join Waitlist →
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
