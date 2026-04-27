import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { fetchLeaderboard } from '../lib/supabase.js'

export default function Leaderboard() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeaderboard(30)
      .then(data => setEntries(data))
      .catch(err => console.error('Leaderboard fetch error:', err))
      .finally(() => setLoading(false))
  }, [])

  function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })
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
        <Link to="/play" className="btn btn-primary">Play Again</Link>
      </div>
    </section>
  )
}
