import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchLeaderboard, submitWaitlist, getWaitlistCount } from '../lib/supabase.js'

export default function Leaderboard() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const [waitlistCount, setWaitlistCount] = useState(0)
  const playerName = localStorage.getItem('geoquiz_player') || ''

  const [wlName, setWlName] = useState('')
  const [wlEmail, setWlEmail] = useState('')
  const [wlRole, setWlRole] = useState('')
  const [wlMsg, setWlMsg] = useState('')
  const [wlSaving, setWlSaving] = useState(false)
  const [wlDone, setWlDone] = useState(false)

  useEffect(() => {
    fetchLeaderboard(50)
      .then(data => setEntries(data))
      .catch(err => console.error('Leaderboard fetch error:', err))
      .finally(() => setLoading(false))
    getWaitlistCount().then(c => setWaitlistCount(c))
  }, [])

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })
  }

  const now = Date.now()
  const filtered = entries.filter(e => {
    if (tab === 'all') return true
    const created = new Date(e.created_at).getTime()
    if (tab === 'week') return now - created < 7 * 24 * 60 * 60 * 1000
    if (tab === 'month') return now - created < 30 * 24 * 60 * 60 * 1000
    return true
  }).slice(0, 30)

  // Find player's best position
  const playerEntries = filtered.filter(e =>
    e.player_name?.toLowerCase() === playerName.toLowerCase()
  )
  const playerBest = playerEntries.length > 0 ? playerEntries[0] : null
  const playerRank = playerBest ? filtered.indexOf(playerBest) + 1 : null

  const TABS = [
    { id: 'all', label: 'All Time' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
  ]

  async function handleWaitlist(e) {
    e.preventDefault()
    if (!wlName.trim() || !wlEmail.trim()) return
    setWlSaving(true)
    try {
      await submitWaitlist({ name: wlName.trim(), email: wlEmail.trim(), role: wlRole, message: wlMsg })
      setWlDone(true)
    } catch (err) {
      console.error('Waitlist error:', err)
      setWlDone(true)
    } finally {
      setWlSaving(false)
    }
  }

  return (
    <section className="leaderboard">
      <h2>Leaderboard</h2>
      <p className="subtitle">How do you rank among GeoQuiz players?</p>

      {/* Player's rank highlight */}
      {playerBest && (
        <div className="lb-player-rank">
          <div className="lb-rank-pos">#{playerRank}</div>
          <div className="lb-rank-info">
            <div className="lb-rank-name">{playerBest.player_name}</div>
            <div className="lb-rank-score">{playerBest.score}/{playerBest.max_score} pts</div>
          </div>
          <div className="lb-rank-msg">
            {playerRank === 1 ? 'You\'re #1!' : `${playerRank - 1} player${playerRank - 1 > 1 ? 's' : ''} ahead of you`}
          </div>
        </div>
      )}

      {/* Season tabs */}
      <div className="lb-tabs">
        {TABS.map(t => (
          <button key={t.id} className={`lb-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'week' && (
        <div style={{ textAlign: 'center', margin: '0.5rem 0', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
          Resets every Monday — climb to #1!
        </div>
      )}

      {loading ? (
        <div className="lb-empty">Loading scores...</div>
      ) : filtered.length === 0 ? (
        <div className="lb-empty">
          <p>{tab === 'all' ? 'No scores yet. Be the first!' : 'No scores this period. Be the first!'}</p>
          <Link to="/play" className="btn btn-primary mt-2">Play Now</Link>
        </div>
      ) : (
        <div className="lb-card-list">
          {filtered.map((entry, i) => {
            const isMe = playerName && entry.player_name?.toLowerCase() === playerName.toLowerCase()
            const pct = entry.max_score > 0 ? Math.round((entry.score / entry.max_score) * 100) : 0
            return (
              <div key={entry.id || i} className={`lb-card ${isMe ? 'lb-card-me' : ''} ${i < 3 ? 'lb-card-top' : ''}`}>
                <div className="lb-card-rank">
                  {i === 0 ? '1st' : i === 1 ? '2nd' : i === 2 ? '3rd' : `${i + 1}th`}
                </div>
                <div className="lb-card-info">
                  <div className="lb-card-name">{entry.player_name}{isMe ? ' (You)' : ''}</div>
                  <div className="lb-card-meta">{entry.question_count}Q · {formatDate(entry.created_at)}</div>
                </div>
                <div className="lb-card-score">
                  <span className="lb-card-pts">{entry.score}</span>
                  <span className="lb-card-pct">{pct}%</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
        <Link to="/play" className="btn btn-primary">Play Again</Link>
        <Link to="/dashboard" className="btn btn-outline">My Progress</Link>
      </div>

      {/* Waitlist */}
      <div className="waitlist-section">
        <h3>Join the Waitlist ({waitlistCount} signed up)</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Get notified when new cities, features, and rewards drop.
        </p>
        {wlDone ? (
          <div style={{ color: 'var(--primary)', fontWeight: 600, marginTop: '1rem' }}>
            You're on the list!
          </div>
        ) : (
          <form className="waitlist-form" onSubmit={handleWaitlist}>
            <input type="text" value={wlName} onChange={e => setWlName(e.target.value)} placeholder="Your name" required />
            <input type="email" value={wlEmail} onChange={e => setWlEmail(e.target.value)} placeholder="Email address" required />
            <select value={wlRole} onChange={e => setWlRole(e.target.value)}>
              <option value="">I am a...</option>
              <option value="player">Player / Geography Lover</option>
              <option value="teacher">Teacher / Educator</option>
              <option value="business">Business / Sponsor</option>
              <option value="developer">Developer / Contributor</option>
            </select>
            <textarea value={wlMsg} onChange={e => setWlMsg(e.target.value)} placeholder="Any feedback or suggestions?" rows={2} />
            <button type="submit" className="btn btn-primary" disabled={wlSaving}>
              {wlSaving ? 'Joining...' : 'Join Waitlist'}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
