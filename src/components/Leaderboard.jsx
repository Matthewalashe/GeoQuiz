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
  const [wlRef, setWlRef] = useState('')
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
      await submitWaitlist({ name: wlName.trim(), email: wlEmail.trim(), role: wlRole, message: wlMsg, referral: wlRef })
      setWlDone(true)
    } catch (err) {
      console.error('Waitlist error:', err)
      setWlDone(true)
    } finally {
      setWlSaving(false)
    }
  }

  return (
    <section className="lb-page">
      <div className="lb-header">
        <h2>Leaderboard</h2>
        <p className="lb-subtitle">How do you rank among GeoQuiz players?</p>
      </div>

      {/* Player's rank highlight */}
      {playerBest && (
        <div className="lb-my-rank">
          <span className="lb-my-pos">#{playerRank}</span>
          <span className="lb-my-name">{playerBest.player_name}</span>
          <span className="lb-my-score">{playerBest.score} pts</span>
        </div>
      )}

      {/* Tabs */}
      <div className="lb-tabs">
        {TABS.map(t => (
          <button key={t.id} className={`lb-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'week' && (
        <div className="lb-reset-hint">Resets every Monday — climb to #1!</div>
      )}

      {loading ? (
        <div className="lb-empty">Loading scores...</div>
      ) : filtered.length === 0 ? (
        <div className="lb-empty">
          <p>{tab === 'all' ? 'No scores yet. Be the first!' : 'No scores this period.'}</p>
          <Link to="/play" className="btn btn-primary" style={{ marginTop: '1rem' }}>Play Now</Link>
        </div>
      ) : (
        <div className="lb-list">
          {/* Podium — Top 3 */}
          {filtered.length >= 3 && (
            <div className="lb-podium">
              {[1, 0, 2].map(idx => {
                const e = filtered[idx]
                if (!e) return null
                const isMe = playerName && e.player_name?.toLowerCase() === playerName.toLowerCase()
                const myAvatar = localStorage.getItem('geoquiz_avatar') || '🎭'
                const avatar = e.avatar || (isMe ? myAvatar : '🎭')
                const pct = e.max_score > 0 ? Math.round((e.score / e.max_score) * 100) : 0
                const podiumLabel = idx === 0 ? '1st' : idx === 1 ? '2nd' : '3rd'
                const podiumEmoji = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'
                return (
                  <div key={e.id || idx} className={`lb-podium-item lb-pos-${idx + 1} ${isMe ? 'lb-is-me' : ''}`}>
                    <div className="lb-podium-avatar">{avatar}</div>
                    <div className="lb-podium-medal">{podiumEmoji}</div>
                    <div className="lb-podium-name">{e.player_name}</div>
                    <div className="lb-podium-score">{e.score}</div>
                    <div className="lb-podium-pct">{pct}%</div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Rest of the list */}
          <div className="lb-table">
            <div className="lb-table-head">
              <span className="lb-col-rank">#</span>
              <span className="lb-col-player">Player</span>
              <span className="lb-col-score">Score</span>
              <span className="lb-col-pct">%</span>
            </div>
            {filtered.slice(filtered.length >= 3 ? 3 : 0).map((entry, i) => {
              const rank = (filtered.length >= 3 ? 3 : 0) + i + 1
              const isMe = playerName && entry.player_name?.toLowerCase() === playerName.toLowerCase()
              const pct = entry.max_score > 0 ? Math.round((entry.score / entry.max_score) * 100) : 0
              const myAvatar = localStorage.getItem('geoquiz_avatar') || '🎭'
              const avatar = entry.avatar || (isMe ? myAvatar : '🎭')
              return (
                <div key={entry.id || rank} className={`lb-table-row ${isMe ? 'lb-row-me' : ''}`}>
                  <span className="lb-col-rank">{rank}</span>
                  <span className="lb-col-player">
                    <span className="lb-row-avatar">{avatar}</span>
                    <span>
                      <span className="lb-row-name">{entry.player_name}{isMe ? ' (You)' : ''}</span>
                      <span className="lb-row-meta">{entry.question_count}Q · {formatDate(entry.created_at)}</span>
                    </span>
                  </span>
                  <span className="lb-col-score">{entry.score}</span>
                  <span className="lb-col-pct">{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="lb-cta-row">
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
              <option value="traveller">Vacationist / Traveller</option>
              <option value="business">Business / Sponsor</option>
              <option value="developer">Developer / Contributor</option>
            </select>
            <input type="text" value={wlRef} onChange={e => setWlRef(e.target.value)} placeholder="How did you find us? (Referred by?)" />
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
