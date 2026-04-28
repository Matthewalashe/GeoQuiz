import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchLeaderboard, submitWaitlist, getWaitlistCount } from '../lib/supabase.js'

export default function Leaderboard() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [waitlistCount, setWaitlistCount] = useState(0)

  // Waitlist form state
  const [wlName, setWlName] = useState('')
  const [wlEmail, setWlEmail] = useState('')
  const [wlRole, setWlRole] = useState('')
  const [wlMsg, setWlMsg] = useState('')
  const [wlSaving, setWlSaving] = useState(false)
  const [wlDone, setWlDone] = useState(false)

  useEffect(() => {
    fetchLeaderboard(30)
      .then(data => setEntries(data))
      .catch(err => console.error('Leaderboard fetch error:', err))
      .finally(() => setLoading(false))
    getWaitlistCount().then(c => setWaitlistCount(c))
  }, [])

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })
  }

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
      <p className="subtitle">Top scores from all GeoQuiz players</p>

      {loading ? (
        <div className="lb-empty">Loading scores...</div>
      ) : entries.length === 0 ? (
        <div className="lb-empty">
          <p>No scores yet. Be the first!</p>
          <Link to="/play" className="btn btn-primary mt-2">Play Now</Link>
        </div>
      ) : (
        <table className="lb-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Player</th>
              <th>Score</th>
              <th>Questions</th>
              <th>Difficulty</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => (
              <tr key={entry.id || i}>
                <td className="rank">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                </td>
                <td style={{ fontWeight: 600 }}>{entry.player_name}</td>
                <td className="lb-score">{entry.score}<span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>/{entry.max_score}</span></td>
                <td>{entry.question_count}</td>
                <td style={{ textTransform: 'capitalize' }}>{entry.difficulty || 'all'}</td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{formatDate(entry.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
        <Link to="/play" className="btn btn-primary">Play Again 🎮</Link>
      </div>

      {/* ---- WAITLIST ---- */}
      <div className="waitlist-section">
        <h3>📬 Join the Waitlist</h3>
        <p className="subtitle">Be the first to know when we launch new features, states, and competitions.</p>
        {waitlistCount > 0 && (
          <p style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '1rem' }}>
            🎉 {waitlistCount} people have already joined!
          </p>
        )}

        {wlDone ? (
          <div className="card card-accent-top" style={{ textAlign: 'center', padding: '1.5rem' }}>
            <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>✅ You're on the list!</p>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>We'll notify you when exciting updates drop.</p>
          </div>
        ) : (
          <form className="waitlist-form" onSubmit={handleWaitlist}>
            <input type="text" placeholder="Your name *" value={wlName} onChange={e => setWlName(e.target.value)} required />
            <input type="email" placeholder="Email address *" value={wlEmail} onChange={e => setWlEmail(e.target.value)} required />
            <select value={wlRole} onChange={e => setWlRole(e.target.value)}>
              <option value="">Your role (optional)</option>
              <option value="student">Student</option>
              <option value="geographer">Geographer</option>
              <option value="planner">Town Planner</option>
              <option value="surveyor">Surveyor</option>
              <option value="architect">Architect</option>
              <option value="engineer">Engineer</option>
              <option value="educator">Educator</option>
              <option value="other">Other</option>
            </select>
            <textarea placeholder="What features would you like? (optional)" value={wlMsg} onChange={e => setWlMsg(e.target.value)} rows={3} />
            <button type="submit" className="btn btn-primary" disabled={wlSaving}>
              {wlSaving ? 'Joining...' : 'Join Waitlist →'}
            </button>
          </form>
        )}
      </div>
    </section>
  )
}
