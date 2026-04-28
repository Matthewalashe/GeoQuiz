import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getGrade, getScoreClass, formatDistance } from '../engine/scoring.js'
import { submitScore } from '../lib/supabase.js'
import { ResultsMap } from './MapView.jsx'

// Achievement rank system
function getRank(pct, perfectCount) {
  if (perfectCount >= 3) return { title: 'You Sabi! 🇳🇬🔥', subtitle: 'Three perfect scores! You know Lagos like the back of your hand!', cls: 'rank-yousabi' }
  if (pct === 100) return { title: 'Grandmaster 👑', subtitle: 'Flawless! Every single pin was perfect!', cls: 'rank-grandmaster' }
  if (pct >= 90) return { title: 'Top Leader 🏆', subtitle: 'Outstanding performance! You\'re a Lagos geography expert!', cls: 'rank-top' }
  if (pct >= 80) return { title: 'GIS Pro 🎯', subtitle: 'Impressive accuracy! You really know your way around!', cls: 'rank-pro' }
  if (pct >= 70) return { title: 'Navigator 🧭', subtitle: 'Solid performance! You\'ve got a great sense of direction!', cls: 'rank-navigator' }
  if (pct >= 50) return { title: 'Explorer 🗺️', subtitle: 'Good effort! Keep exploring Lagos to level up!', cls: 'rank-explorer' }
  if (pct >= 30) return { title: 'Rookie 🌱', subtitle: 'A great start! Practice makes perfect — try again!', cls: 'rank-rookie' }
  return { title: 'Tourist 📸', subtitle: 'Welcome to Lagos! Play more to discover the city!', cls: 'rank-tourist' }
}

function getEncouragement(pct) {
  if (pct >= 90) return '🔥 Challenge yourself with Expert difficulty or try a timer!'
  if (pct >= 70) return '💪 You\'re close to mastery! Try new categories to expand your knowledge.'
  if (pct >= 50) return '📈 Good progress! Play again to improve your score — you\'re getting there!'
  return '🎮 Every game makes you better! Try Beginner difficulty to build confidence.'
}

export default function ResultsScreen() {
  const location = useLocation()
  const navigate = useNavigate()
  const data = location.state

  const [playerName, setPlayerName] = useState(() => localStorage.getItem('geoquiz_player') || '')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!data) navigate('/', { replace: true })
  }, [data, navigate])

  async function handleSaveScore() {
    if (!playerName.trim() || !data) return
    setSaving(true)
    localStorage.setItem('geoquiz_player', playerName.trim())
    try {
      await submitScore({
        playerName: playerName.trim(),
        score: data.totalScore,
        maxScore: data.maxScore,
        questionCount: data.questionCount,
        categories: data.config?.categories || [],
        difficulty: data.config?.difficulty || 'all',
      })
      setSaved(true)
    } catch (err) {
      console.error('Save score error:', err)
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  if (!data) return null

  const { results, totalScore, maxScore } = data
  const grade = getGrade(totalScore, maxScore)
  const avgDist = results.reduce((sum, r) => sum + r.distance, 0) / results.length
  const perfectCount = results.filter(r => r.score === 100).length
  const pct = Math.round((totalScore / maxScore) * 100)
  const rank = getRank(pct, perfectCount)
  const encouragement = getEncouragement(pct)

  // Track cumulative perfect scores in localStorage
  useEffect(() => {
    const prev = parseInt(localStorage.getItem('geoquiz_total_perfects') || '0', 10)
    localStorage.setItem('geoquiz_total_perfects', prev + perfectCount)
  }, [])

  return (
    <section className="results">
      <div className="results-header">
        {/* Achievement rank badge */}
        <div className={`rank-badge ${rank.cls}`}>
          <div className="rank-title">{rank.title}</div>
          <div className="rank-subtitle">{rank.subtitle}</div>
        </div>

        <div className="results-total">
          {totalScore} <span className="out-of">/ {maxScore}</span>
        </div>
        <div className="results-pct">{pct}%</div>
        <div className={`results-grade ${grade.cls}`}>{grade.label}</div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1rem', flexWrap: 'wrap' }}>
          <div className="stat-item">
            <div className="stat-value" style={{ fontSize: '1.5rem' }}>{formatDistance(avgDist)}</div>
            <div className="stat-label">Avg Distance</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{ fontSize: '1.5rem' }}>{perfectCount}</div>
            <div className="stat-label">Perfect Scores</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{ fontSize: '1.5rem' }}>{results.length}</div>
            <div className="stat-label">Questions</div>
          </div>
        </div>

        {/* Encouragement */}
        <div className="encouragement-bar">
          {encouragement}
        </div>
      </div>

      {/* Save score */}
      {!saved ? (
        <div className="save-score-panel card card-accent-top" style={{ maxWidth: 450, margin: '1.5rem auto', textAlign: 'center', padding: '1.5rem' }}>
          <h3 style={{ marginBottom: '0.75rem' }}>Save Your Score</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Enter your name to appear on the leaderboard
          </p>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              type="text"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              placeholder="Your name"
              maxLength={30}
              style={{
                flex: 1, padding: '0.7rem 0.75rem',
                border: '3px solid var(--border)',
                fontFamily: 'var(--font-body)', fontSize: '1rem',
                background: 'var(--bg)',
              }}
            />
            <button
              className="btn btn-primary"
              onClick={handleSaveScore}
              disabled={!playerName.trim() || saving}
            >
              {saving ? '...' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', margin: '1rem 0', color: 'var(--primary)', fontWeight: 600 }}>
          ✅ Score saved as "{playerName}"!
        </div>
      )}

      <div className="results-map-wrap">
        <ResultsMap results={results} />
      </div>

      <div className="results-breakdown">
        <h3>Detailed Breakdown</h3>
        {results.map((r, i) => {
          const scoreColor = r.score >= 80 ? 'var(--primary)' : r.score >= 60 ? 'var(--yellow)' : r.score >= 40 ? 'var(--blue)' : 'var(--red)'
          return (
            <div className="result-card" key={i}>
              <div className="result-card-header">
                <span className="rc-num">#{i + 1} — {r.question.categoryLabel}</span>
                <span className="rc-score" style={{ color: scoreColor }}>+{r.score}</span>
              </div>
              <div className="rc-name">📍 {r.question.answer.name}</div>
              <div className="rc-question">{r.question.question}</div>
              <div className="rc-desc">{r.question.answer.description}</div>
              <div className="rc-meta">
                <span>📏 {formatDistance(r.distance)} away</span>
                <span>📐 {r.question.answer.lat.toFixed(4)}°N, {r.question.answer.lng.toFixed(4)}°E</span>
                <span>🎯 Your pin: {r.userPin.lat.toFixed(4)}°N, {r.userPin.lng.toFixed(4)}°E</span>
              </div>
              {(r.question.hint || r.question.funFact) && (
                <div className="rc-fact">
                  ℹ️ {r.question.hint}{r.question.hint && r.question.funFact ? ' — ' : ''}{r.question.funFact}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="results-actions">
        <Link to="/play" className="btn btn-primary">Play Again 🎮</Link>
        <Link to="/leaderboard" className="btn btn-outline">Leaderboard 🏆</Link>
        <Link to="/" className="btn btn-outline">Home</Link>
      </div>
    </section>
  )
}
