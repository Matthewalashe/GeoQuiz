import { Link } from 'react-router-dom'
import { CATEGORIES } from '../data/questions.js'
import questions from '../data/questions.js'

export default function Landing() {
  const totalQ = questions.length
  const catCount = CATEGORIES.length
  const lgaCount = questions.filter(q => q.category === 'lgas').length

  return (
    <section className="landing">
      {/* Hero */}
      <div className="landing-hero">
        {/* Bauhaus geometric decorations */}
        <div className="geo-deco">
          <div className="geo-square" />
          <div className="geo-circle" />
          <div className="geo-tri" />
          <div className="geo-line-h" />
          <div className="geo-line-v" />
          <div className="geo-dot d1" />
          <div className="geo-dot d2" />
          <div className="geo-dot d3" />
        </div>

        <div className="hero-badge">🗺️ Interactive Map Quiz</div>
        <h1>
          <span className="hero-sub">How well do you know</span>
          <span className="hero-main">Lagos<span className="accent">?</span></span>
        </h1>
        <p className="hero-desc">
          Drop pins on the map. Test your spatial knowledge of LGAs, landmarks, markets, bridges, and hidden corners of Lagos State.
          Built for <strong>GIS students</strong> and <strong>professionals</strong>.
        </p>

        <div className="hero-actions">
          <Link to="/play" className="btn btn-primary btn-lg">
            Start Quiz →
          </Link>
          <Link to="/leaderboard" className="btn btn-outline btn-lg">
            Leaderboard
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-bar">
        <div className="stat-item">
          <div className="stat-value">{totalQ}+</div>
          <div className="stat-label">Questions</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{catCount}</div>
          <div className="stat-label">Categories</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">{lgaCount}</div>
          <div className="stat-label">LGAs Covered</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">3</div>
          <div className="stat-label">Difficulty Levels</div>
        </div>
      </div>

      {/* How it works */}
      <div className="how-it-works">
        <h2>How It Works</h2>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-num">01</div>
            <h3>Pick a Category</h3>
            <p>Choose from LGAs, landmarks, markets, transport, education, culture, and more.</p>
          </div>
          <div className="step-card">
            <div className="step-num">02</div>
            <h3>Drop Your Pin</h3>
            <p>Read the question, then click on the map where you think the location is.</p>
          </div>
          <div className="step-card">
            <div className="step-num">03</div>
            <h3>Learn & Score</h3>
            <p>See how close you were in kilometers. Earn up to 100 points per question.</p>
          </div>
        </div>
      </div>

      {/* Categories */}
      <h2 className="mb-2">Explore Categories</h2>
      <div className="category-grid">
        {CATEGORIES.map(cat => {
          const count = questions.filter(q => q.category === cat.id).length
          return (
            <Link to={`/play?cat=${cat.id}`} key={cat.id} className={`card category-card ${cat.accent}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="cat-icon">{cat.icon}</div>
              <h3>{cat.label}</h3>
              <p>{cat.description}</p>
              <span className="cat-count">{count} Q</span>
            </Link>
          )
        })}
      </div>

      {/* CTA */}
      <div className="landing-cta">
        <div className="cta-inner">
          <h2>Ready to test your knowledge?</h2>
          <p>Challenge yourself with {totalQ}+ questions about Lagos geography, culture, and infrastructure.</p>
          <Link to="/play" className="btn btn-primary btn-lg">Start Quiz →</Link>
        </div>
      </div>
    </section>
  )
}
