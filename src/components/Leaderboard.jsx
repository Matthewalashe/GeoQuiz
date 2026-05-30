import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchLeaderboard } from '../lib/supabase.js'

function AvatarImg({ src, size = 32 }) {
  if (!src) return <span style={{ fontSize: size * 0.7 }}>🧭</span>
  if (src.startsWith('http')) {
    return <img src={src} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }} onError={e => { e.target.style.display = 'none' }} />
  }
  return <span style={{ fontSize: size * 0.7 }}>{src}</span>
}

export default function Leaderboard({ isEmbedded = false }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [tab, setTab] = useState('all')
  const playerName = localStorage.getItem('geoquiz_player') || ''

  function loadLeaderboard() {
    setLoading(true)
    setFetchError(null)
    fetchLeaderboard(50)
      .then(data => setEntries(data))
      .catch(err => {
        console.error('Leaderboard fetch error:', err)
        setFetchError(err.message || 'Failed to load leaderboard.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadLeaderboard() }, [])

  function formatDate(dateStr) {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })
  }

  const [now] = useState(() => Date.now())
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

  return (
    <section className="lb-page">
      <div className="lb-header">
        <h2>Leaderboard</h2>
        <p className="lb-subtitle">Top explorers ranked by XP</p>
      </div>

      {/* Player's rank highlight */}
      {playerBest && (
        <div className="lb-my-rank">
          <span className="lb-my-pos">#{playerRank}</span>
          <AvatarImg src={playerBest.avatar} size={28} />
          <span className="lb-my-name">{playerBest.player_name}</span>
          <span className="lb-my-score">{playerBest.score} XP</span>
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
      ) : fetchError ? (
        <div className="lb-empty" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ fontSize: '2rem' }}>⚠️</div>
          <p style={{ color: '#ef4444', fontSize: '0.9rem' }}>{fetchError}</p>
          <button onClick={loadLeaderboard} style={{ padding: '0.5rem 1.2rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>Try Again</button>
        </div>
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
                const podiumEmoji = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'
                return (
                  <div key={e.id || idx} className={`lb-podium-item lb-pos-${idx + 1} ${isMe ? 'lb-is-me' : ''}`}>
                    <div className="lb-podium-avatar"><AvatarImg src={e.avatar} size={idx === 0 ? 48 : 40} /></div>
                    <div className="lb-podium-medal">{podiumEmoji}</div>
                    <div className="lb-podium-name">{e.player_name}</div>
                    <div className="lb-podium-score">{e.score} XP</div>
                    <div className="lb-podium-pct">Lv {e.level || 1}</div>
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
              <span className="lb-col-score">XP</span>
              <span className="lb-col-pct">Level</span>
            </div>
            {filtered.slice(filtered.length >= 3 ? 3 : 0).map((entry, i) => {
              const rank = (filtered.length >= 3 ? 3 : 0) + i + 1
              const isMe = playerName && entry.player_name?.toLowerCase() === playerName.toLowerCase()
              return (
                <div key={entry.id || rank} className={`lb-table-row ${isMe ? 'lb-row-me' : ''}`}>
                  <span className="lb-col-rank">{rank}</span>
                  <span className="lb-col-player">
                    <span className="lb-row-avatar"><AvatarImg src={entry.avatar} size={28} /></span>
                    <span>
                      <span className="lb-row-name">{entry.player_name}{isMe ? ' (You)' : ''}</span>
                      <span className="lb-row-meta">🔥 {entry.streak || 0}d · {formatDate(entry.created_at)}</span>
                    </span>
                  </span>
                  <span className="lb-col-score">{entry.score}</span>
                  <span className="lb-col-pct">{entry.level || 1}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!isEmbedded && (
        <div className="lb-cta-row">
          <Link to="/play" className="btn btn-primary">Play Again</Link>
          <Link to="/dashboard" className="btn btn-outline">My Progress</Link>
        </div>
      )}
    </section>
  )
}
