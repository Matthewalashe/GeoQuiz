import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchLeaderboard, supabase } from '../lib/supabase.js'
import { getCurrentLeague } from '../engine/xp.js'
import { ProfileImg } from './Header.jsx'

// ── Format large numbers (e.g. 1.2K, 15.4K) ──
function formatXP(n) {
  if (n >= 100000) return (n / 1000).toFixed(0) + 'K'
  if (n >= 10000) return (n / 1000).toFixed(1) + 'K'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n.toLocaleString()
}

// ── GAME FILTERS ──
const GAME_FILTERS = [
  { id: 'all', label: 'Overall', emoji: '🏆' },
  { id: 'quiz', label: 'Map Quiz', emoji: '📍' },
  { id: 'trivia', label: 'Trivia', emoji: '🧠' },
  { id: 'postcards', label: 'PostCards', emoji: '📷' },
  { id: 'pinpoint', label: 'PinPoint', emoji: '🎯' },
  { id: 'flagstack', label: 'FlagStack', emoji: '🏁' },
  { id: 'wordgame', label: 'Guess Word', emoji: '🔤' },
]

const TIME_FILTERS = [
  { id: 'all', label: 'All Time' },
  { id: 'season', label: 'This Season' },
  { id: 'week', label: 'This Week' },
]

// ═══════════════════════════════════════════
// LEADERBOARD COMPONENT
// ═══════════════════════════════════════════
export default function Leaderboard({ isEmbedded = false }) {
  const navigate = useNavigate()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [gameFilter, setGameFilter] = useState('all')
  const [timeFilter, setTimeFilter] = useState('all')
  const [currentUserId, setCurrentUserId] = useState(null)

  // Get current user
  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user?.id) setCurrentUserId(data.session.user.id)
    })
  }, [])

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

  // Filter entries by time and game
  const filtered = useMemo(() => {
    const now = Date.now()
    return entries.filter(e => {
      // Time filter
      if (timeFilter === 'week') {
        const created = new Date(e.created_at).getTime()
        if (now - created > 7 * 24 * 60 * 60 * 1000) return false
      } else if (timeFilter === 'season') {
        const created = new Date(e.created_at).getTime()
        if (now - created > 90 * 24 * 60 * 60 * 1000) return false
      }
      // Game filter — currently leaderboard data is XP-based from profiles
      // Game-specific filtering will work once per-game scores are tracked
      return true
    }).slice(0, 30)
  }, [entries, timeFilter, gameFilter])

  // Find current user's position
  const myEntry = useMemo(() => {
    if (!currentUserId) return null
    const idx = filtered.findIndex(e => e.id === currentUserId)
    if (idx === -1) return null
    return { ...filtered[idx], rank: idx + 1 }
  }, [filtered, currentUserId])

  // Top 3 for podium
  const podium = filtered.slice(0, 3)
  const rest = filtered.slice(3)

  return (
    <section className="lb-page">
      {/* Header */}
      <div className="lb-header">
        <h2>🏆 Leaderboard</h2>
        <p className="lb-subtitle">Top explorers ranked by XP</p>
      </div>

      {/* Your rank card */}
      {myEntry && (
        <div className="lb2-my-card glass">
          <div className="lb2-my-rank">
            <span className="lb2-my-pos">#{myEntry.rank}</span>
            <span className="lb2-my-label">Your Rank</span>
          </div>
          <div className="lb2-my-info">
            <ProfileImg profile={{ avatar_url: myEntry.avatar, username: myEntry.player_name }} size={36} />
            <div>
              <div className="lb2-my-name">{myEntry.player_name}</div>
              <div className="lb2-my-stats">
                {formatXP(myEntry.score)} XP · Lv.{myEntry.level} · 🔥{myEntry.streak || 0}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game filter */}
      <div className="lb2-game-filters">
        {GAME_FILTERS.map(g => (
          <button
            key={g.id}
            className={`lb2-game-chip ${gameFilter === g.id ? 'active' : ''}`}
            onClick={() => setGameFilter(g.id)}
          >
            <span>{g.emoji}</span>
            <span>{g.label}</span>
          </button>
        ))}
      </div>

      {/* Time filter */}
      <div className="lb-tabs">
        {TIME_FILTERS.map(t => (
          <button key={t.id} className={`lb-tab ${timeFilter === t.id ? 'active' : ''}`} onClick={() => setTimeFilter(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {timeFilter === 'week' && (
        <div className="lb-reset-hint">Resets every Monday — climb to #1!</div>
      )}
      {timeFilter === 'season' && (
        <div className="lb-reset-hint">Season resets every 90 days. Compete for the top!</div>
      )}

      {/* Content */}
      {loading ? (
        <div className="lb-empty">
          <div className="lb2-loading">
            <div className="lb2-loading-dot" />
            <div className="lb2-loading-dot" />
            <div className="lb2-loading-dot" />
          </div>
          <p>Loading leaderboard...</p>
        </div>
      ) : fetchError ? (
        <div className="lb-empty" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ fontSize: '2rem' }}>⚠️</div>
          <p style={{ color: '#ef4444', fontSize: '0.9rem' }}>{fetchError}</p>
          <button onClick={loadLeaderboard} style={{ padding: '0.5rem 1.2rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>Try Again</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="lb-empty">
          <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🏆</div>
          <p>{timeFilter === 'all' ? 'No scores yet. Be the first!' : `No scores for ${timeFilter === 'week' ? 'this week' : 'this season'}.`}</p>
          <Link to="/play" className="btn btn-primary" style={{ marginTop: '1rem' }}>Play Now</Link>
        </div>
      ) : (
        <div className="lb-list">
          {/* Podium — Top 3 */}
          {podium.length >= 3 && (
            <div className="lb-podium">
              {[1, 0, 2].map(idx => {
                const e = podium[idx]
                if (!e) return null
                const isMe = e.id === currentUserId
                const podiumEmoji = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'
                const league = getCurrentLeague(e.score)
                return (
                  <div key={e.id || idx} className={`lb-podium-item lb-pos-${idx + 1} ${isMe ? 'lb-is-me' : ''}`}>
                    <div className="lb-podium-avatar">
                      <ProfileImg profile={{ avatar_url: e.avatar, username: e.player_name }} size={idx === 0 ? 52 : 42} />
                    </div>
                    <div className="lb-podium-medal">{podiumEmoji}</div>
                    <div className="lb-podium-name">{e.player_name}{isMe ? ' (You)' : ''}</div>
                    <div className="lb-podium-score">{formatXP(e.score)}</div>
                    <div className="lb-podium-pct">{league.emoji} Lv.{e.level}</div>
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
            {rest.map((entry, i) => {
              const rank = 4 + i
              const isMe = entry.id === currentUserId
              const league = getCurrentLeague(entry.score)
              return (
                <div key={entry.id || rank} className={`lb-table-row ${isMe ? 'lb-row-me' : ''}`}>
                  <span className="lb-col-rank">{rank}</span>
                  <span className="lb-col-player">
                    <span className="lb-row-avatar">
                      <ProfileImg profile={{ avatar_url: entry.avatar, username: entry.player_name }} size={28} />
                    </span>
                    <span>
                      <span className="lb-row-name">{entry.player_name}{isMe ? ' (You)' : ''}</span>
                      <span className="lb-row-meta">{league.emoji} · 🔥 {entry.streak || 0}d</span>
                    </span>
                  </span>
                  <span className="lb-col-score">{formatXP(entry.score)}</span>
                  <span className="lb-col-pct">{entry.level}</span>
                </div>
              )
            })}
          </div>

          {/* If user not in top 30, show their rank */}
          {!myEntry && currentUserId && (
            <div className="lb2-not-ranked glass-subtle">
              <span>🎯</span> Play more games to climb the leaderboard!
            </div>
          )}
        </div>
      )}

      {!isEmbedded && (
        <div className="lb-cta-row">
          <Link to="/play" className="btn btn-primary">Play Now</Link>
          <Link to="/rewards" className="btn btn-outline">Rewards & Store</Link>
        </div>
      )}
    </section>
  )
}
