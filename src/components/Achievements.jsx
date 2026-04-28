import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

// Achievement definitions
const BADGES = [
  { id: 'first_steps', icon: '🎯', name: 'First Steps', desc: 'Complete your first quiz', check: s => s.totalGames >= 1 },
  { id: 'getting_warmed', icon: '🔥', name: 'Getting Warmed Up', desc: 'Play 5 games', check: s => s.totalGames >= 5 },
  { id: 'centurion', icon: '💯', name: 'Centurion', desc: 'Play 100 games', check: s => s.totalGames >= 100 },
  { id: 'perfect_game', icon: '⭐', name: 'Perfect Game', desc: 'Score 100% in any game', check: s => s.perfectGames >= 1 },
  { id: 'triple_perfect', icon: '🧠', name: 'You Sabi!', desc: 'Get 3 perfect scores', check: s => s.perfectGames >= 3 },
  { id: 'streak_3', icon: '🔥', name: 'On Fire', desc: 'Reach a 3-question streak', check: s => s.bestStreak >= 3 },
  { id: 'streak_10', icon: '🌋', name: 'Streak Master', desc: 'Reach a 10-question streak', check: s => s.bestStreak >= 10 },
  { id: 'explorer_5', icon: '🧭', name: 'Explorer', desc: 'Play 5 different categories', check: s => s.catCount >= 5 },
  { id: 'explorer_all', icon: '🗺️', name: 'Full Map', desc: 'Play all categories', check: s => s.catCount >= 12 },
  { id: 'scorer_500', icon: '🏅', name: 'High Scorer', desc: 'Accumulate 500 total points', check: s => s.totalPoints >= 500 },
  { id: 'scorer_5000', icon: '🏆', name: 'Legend', desc: 'Accumulate 5,000 total points', check: s => s.totalPoints >= 5000 },
  { id: 'night_owl', icon: '🦉', name: 'Night Owl', desc: 'Play after midnight', check: s => s.nightGames >= 1 },
  { id: 'early_bird', icon: '🐦', name: 'Early Bird', desc: 'Play before 7am', check: s => s.earlyGames >= 1 },
  { id: 'social', icon: '🦋', name: 'Social Butterfly', desc: 'Share a challenge', check: s => s.shares >= 1 },
  { id: 'speed_demon', icon: '⚡', name: 'Speed Demon', desc: 'Score 80%+ in Blitz mode', check: s => s.blitzHighPct >= 80 },
  { id: 'abuja_start', icon: '🏛️', name: 'FCT Explorer', desc: 'Play an Abuja quiz', check: s => s.abujaGames >= 1 },
]

function getStats() {
  const sessions = JSON.parse(localStorage.getItem('geoquiz_sessions') || '[]')
  const catStats = JSON.parse(localStorage.getItem('geoquiz_cat_stats') || '{}')
  const achData = JSON.parse(localStorage.getItem('geoquiz_achievements') || '{}')

  const totalGames = sessions.length
  const totalPoints = sessions.reduce((s, g) => s + g.score, 0)
  const perfectGames = sessions.filter(g => g.score === g.max).length
  const bestStreak = sessions.reduce((m, g) => Math.max(m, g.streak || 0), 0)
  const catCount = Object.keys(catStats).filter(k => catStats[k].total > 0).length

  // Time-based stats
  const nightGames = sessions.filter(g => {
    const h = new Date(g.date).getHours()
    return h >= 0 && h < 5
  }).length
  const earlyGames = sessions.filter(g => {
    const h = new Date(g.date).getHours()
    return h >= 5 && h < 7
  }).length

  return {
    totalGames, totalPoints, perfectGames, bestStreak, catCount,
    nightGames, earlyGames,
    shares: achData.shares || 0,
    blitzHighPct: achData.blitzHighPct || 0,
    abujaGames: achData.abujaGames || 0,
  }
}

export function trackAchievement(key, value) {
  const data = JSON.parse(localStorage.getItem('geoquiz_achievements') || '{}')
  if (typeof value === 'number') {
    data[key] = Math.max(data[key] || 0, value)
  } else {
    data[key] = (data[key] || 0) + 1
  }
  localStorage.setItem('geoquiz_achievements', JSON.stringify(data))
}

export default function Achievements() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    setStats(getStats())
  }, [])

  if (!stats) return null

  const unlocked = BADGES.filter(b => b.check(stats))
  const locked = BADGES.filter(b => !b.check(stats))
  const pct = Math.round((unlocked.length / BADGES.length) * 100)

  return (
    <section className="achievements">
      <h2>🏆 Achievements</h2>
      <p className="subtitle">Collect badges by mastering Nigerian geography</p>

      {/* Progress ring */}
      <div className="ach-overview">
        <div className="ach-ring-wrap">
          <svg viewBox="0 0 100 100" className="ach-ring">
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--border)" strokeWidth="8" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--primary)" strokeWidth="8"
              strokeDasharray={`${(pct / 100) * 264} 264`}
              strokeLinecap="round" transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dasharray 0.6s ease' }}
            />
          </svg>
          <div className="ach-ring-text">
            <span className="ach-ring-num">{unlocked.length}/{BADGES.length}</span>
            <span className="ach-ring-label">Unlocked</span>
          </div>
        </div>
        <div className="ach-summary">
          <div className="stat-item"><div className="stat-value">{stats.totalGames}</div><div className="stat-label">Games</div></div>
          <div className="stat-item"><div className="stat-value">{stats.totalPoints}</div><div className="stat-label">Points</div></div>
          <div className="stat-item"><div className="stat-value">🔥 {stats.bestStreak}</div><div className="stat-label">Best Streak</div></div>
        </div>
      </div>

      {/* Unlocked badges */}
      {unlocked.length > 0 && (
        <>
          <h3 style={{ marginTop: '1.5rem', marginBottom: '0.75rem' }}>✅ Unlocked</h3>
          <div className="badge-grid">
            {unlocked.map(b => (
              <div key={b.id} className="badge-card unlocked">
                <div className="badge-icon">{b.icon}</div>
                <div className="badge-name">{b.name}</div>
                <div className="badge-desc">{b.desc}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Locked badges */}
      {locked.length > 0 && (
        <>
          <h3 style={{ marginTop: '1.5rem', marginBottom: '0.75rem' }}>🔒 Locked</h3>
          <div className="badge-grid">
            {locked.map(b => (
              <div key={b.id} className="badge-card locked">
                <div className="badge-icon">🔒</div>
                <div className="badge-name">{b.name}</div>
                <div className="badge-desc">{b.desc}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <Link to="/play" className="btn btn-primary">Keep Playing 🎮</Link>
      </div>
    </section>
  )
}
