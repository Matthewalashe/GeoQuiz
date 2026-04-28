import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CATEGORIES } from '../data/questions.js'

export default function Dashboard() {
  const [sessions, setSessions] = useState([])
  const [catStats, setCatStats] = useState({})

  useEffect(() => {
    const raw = JSON.parse(localStorage.getItem('geoquiz_sessions') || '[]')
    setSessions(raw)
    const cs = JSON.parse(localStorage.getItem('geoquiz_cat_stats') || '{}')
    setCatStats(cs)
  }, [])

  const totalGames = sessions.length
  const totalScore = sessions.reduce((s, g) => s + g.score, 0)
  const totalMax = sessions.reduce((s, g) => s + g.max, 0)
  const avgPct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0
  const bestStreak = sessions.reduce((m, g) => Math.max(m, g.streak || 0), 0)
  const perfectGames = sessions.filter(g => g.score === g.max).length

  // Category mastery from catStats
  const mastery = CATEGORIES.map(cat => {
    const s = catStats[cat.id] || { correct: 0, total: 0 }
    const pct = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0
    return { ...cat, pct, correct: s.correct, total: s.total }
  }).sort((a, b) => b.pct - a.pct)

  const exploredCats = mastery.filter(c => c.total > 0).length
  const explorePct = Math.round((exploredCats / CATEGORIES.length) * 100)

  // Hue based on percentage
  const hue = (pct) => `hsl(${(pct / 100) * 120}, 70%, 45%)`

  if (totalGames === 0) {
    return (
      <section className="dashboard">
        <h2>📊 Your Progress</h2>
        <div className="card card-accent-top" style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>No games played yet!</p>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Play your first quiz to start tracking progress.</p>
          <Link to="/play" className="btn btn-primary btn-lg">Start Playing 🎮</Link>
        </div>
      </section>
    )
  }

  return (
    <section className="dashboard">
      <h2>📊 Your Progress</h2>
      <p className="subtitle">Track your Lagos geography mastery</p>

      {/* Overview Stats */}
      <div className="stats-bar" style={{ marginBottom: '2rem' }}>
        <div className="stat-item">
          <div className="stat-value">{totalGames}</div>
          <div className="stat-label">Games Played</div>
        </div>
        <div className="stat-item">
          <div className="stat-value" style={{ color: hue(avgPct) }}>{avgPct}%</div>
          <div className="stat-label">Avg Score</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">🔥 {bestStreak}</div>
          <div className="stat-label">Best Streak</div>
        </div>
        <div className="stat-item">
          <div className="stat-value">🥇 {perfectGames}</div>
          <div className="stat-label">Perfect Games</div>
        </div>
      </div>

      {/* Exploration Progress */}
      <div className="card card-accent-top" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
        <h3 style={{ marginBottom: '0.75rem' }}>🗺️ Lagos Exploration</h3>
        <div className="game-progress-wrap" style={{ height: '12px', borderRadius: '6px', marginBottom: '0.5rem' }}>
          <div className="game-progress-fill" style={{ width: `${explorePct}%`, borderRadius: '6px' }} />
        </div>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          You've explored <strong>{exploredCats}</strong> of <strong>{CATEGORIES.length}</strong> categories ({explorePct}% of Lagos)
        </p>
      </div>

      {/* Category Mastery */}
      <h3 style={{ marginBottom: '1rem' }}>Category Mastery</h3>
      <div className="mastery-grid">
        {mastery.map(cat => (
          <div key={cat.id} className="mastery-card card">
            <div className="mastery-header">
              <span className="mastery-icon">{cat.icon}</span>
              <span className="mastery-name">{cat.label}</span>
              <span className="mastery-pct" style={{ color: hue(cat.pct) }}>{cat.pct}%</span>
            </div>
            <div className="mastery-bar-wrap">
              <div className="mastery-bar-fill" style={{ width: `${cat.pct}%`, background: hue(cat.pct) }} />
            </div>
            <div className="mastery-detail">
              {cat.total > 0
                ? `${cat.correct}/${cat.total} correct`
                : 'Not attempted yet'}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Games */}
      {sessions.length > 0 && (
        <>
          <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Recent Games</h3>
          <div className="recent-games">
            {sessions.slice(-10).reverse().map((g, i) => {
              const gpct = g.max > 0 ? Math.round((g.score / g.max) * 100) : 0
              return (
                <div key={i} className="recent-game-row">
                  <span className="rg-date">{new Date(g.date).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}</span>
                  <div className="rg-bar-wrap">
                    <div className="rg-bar-fill" style={{ width: `${gpct}%`, background: hue(gpct) }} />
                  </div>
                  <span className="rg-score">{g.score}/{g.max}</span>
                  {g.streak >= 3 && <span className="rg-streak">🔥{g.streak}</span>}
                </div>
              )
            })}
          </div>
        </>
      )}

      <div style={{ textAlign: 'center', marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
        <Link to="/play" className="btn btn-primary">Keep Playing 🎮</Link>
        <Link to="/achievements" className="btn btn-outline">🏆 Achievements</Link>
      </div>
    </section>
  )
}
