import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getGrade, getScoreClass, formatDistance } from '../engine/scoring.js'
import { submitScore, fetchLeaderboard } from '../lib/supabase.js'
import { ResultsMap } from './MapView.jsx'

// Achievement rank system
function getRank(pct, totalPerfects) {
  if (totalPerfects >= 3) return { title: 'You Sabi! 🇳🇬🔥', subtitle: 'Three perfect scores! You know Lagos like the back of your hand!', cls: 'rank-yousabi' }
  if (pct === 100) return { title: 'Grandmaster 👑', subtitle: 'Flawless! Every single pin was perfect!', cls: 'rank-grandmaster' }
  if (pct >= 90) return { title: 'Top Leader 🏆', subtitle: 'Outstanding! You\'re a Lagos geography expert!', cls: 'rank-top' }
  if (pct >= 80) return { title: 'GIS Pro 🎯', subtitle: 'Impressive accuracy! You really know your way around!', cls: 'rank-pro' }
  if (pct >= 70) return { title: 'Navigator 🧭', subtitle: 'Solid performance! Great sense of direction!', cls: 'rank-navigator' }
  if (pct >= 50) return { title: 'Explorer 🗺️', subtitle: 'Good effort! Keep exploring to level up!', cls: 'rank-explorer' }
  if (pct >= 30) return { title: 'Rookie 🌱', subtitle: 'Great start! Practice makes perfect!', cls: 'rank-rookie' }
  return { title: 'Tourist 📸', subtitle: 'Welcome to Lagos! Play more to discover the city!', cls: 'rank-tourist' }
}

function getEncouragement(pct) {
  if (pct >= 90) return '🔥 Try Expert difficulty with a 30s timer — the ultimate test of mastery!'
  if (pct >= 70) return '💪 You\'re close to the gold! Try harder categories to prove yourself.'
  if (pct >= 50) return '📈 Going well! Keep grinding — gold is within reach. Play again!'
  return '🎮 Every game makes you better! Try Beginner difficulty to build confidence, then go for gold!'
}

export default function ResultsScreen() {
  const location = useLocation()
  const navigate = useNavigate()
  const data = location.state

  const [playerName, setPlayerName] = useState(() => localStorage.getItem('geoquiz_player') || '')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showAchievement, setShowAchievement] = useState(null) // { type: 'best' | 'top3' | 'gold', position }
  const [leaderboard, setLeaderboard] = useState([])

  useEffect(() => {
    if (!data) navigate('/', { replace: true })
    // Fetch leaderboard to check if this is a new best/top3
    fetchLeaderboard(10).then(lb => setLeaderboard(lb)).catch(() => {})
  }, [data, navigate])

  async function handleSaveScore() {
    if (!playerName.trim() || !data) return
    setSaving(true)
    localStorage.setItem('geoquiz_player', playerName.trim())

    // Track total perfects
    const prev = parseInt(localStorage.getItem('geoquiz_total_perfects') || '0', 10)
    localStorage.setItem('geoquiz_total_perfects', prev + perfectCount)

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

      // Check if this is a new best or top 3
      if (leaderboard.length > 0) {
        const bestScore = leaderboard[0]?.score || 0
        if (data.totalScore > bestScore) {
          setShowAchievement({ type: 'best' })
        } else if (leaderboard.length < 3 || data.totalScore > (leaderboard[2]?.score || 0)) {
          const pos = leaderboard.filter(e => e.score > data.totalScore).length + 1
          setShowAchievement({ type: 'top3', position: pos })
        }
      } else {
        // First ever score
        setShowAchievement({ type: 'best' })
      }

      // Check for gold (100%)
      if (data.totalScore === data.maxScore) {
        setShowAchievement({ type: 'gold' })
      }
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
  const totalPerfects = parseInt(localStorage.getItem('geoquiz_total_perfects') || '0', 10) + perfectCount
  const rank = getRank(pct, totalPerfects)
  const encouragement = getEncouragement(pct)

  return (
    <section className="results">
      {/* Achievement modal */}
      {showAchievement && (
        <div className="achievement-overlay" onClick={() => setShowAchievement(null)}>
          <div className={`achievement-modal ${showAchievement.type === 'gold' ? 'gold' : showAchievement.type === 'best' ? 'gold' : 'top3'}`} onClick={e => e.stopPropagation()}>
            <div className="achievement-emoji confetti-burst">
              {showAchievement.type === 'gold' ? '🥇✨' : showAchievement.type === 'best' ? '🏆🔥' : '🎖️⭐'}
            </div>
            <div className="achievement-title">
              {showAchievement.type === 'gold' ? 'PERFECT GOLD!' :
               showAchievement.type === 'best' ? 'NEW HIGH SCORE!' :
               `TOP ${showAchievement.position || 3}!`}
            </div>
            <div className="achievement-subtitle">
              {showAchievement.type === 'gold'
                ? 'Incredible! You got every single question right! You are a true Lagos Master! 🇳🇬'
                : showAchievement.type === 'best'
                ? 'You just beat the highest score on the leaderboard! The crown is yours! 👑'
                : `You've broken into the top ${showAchievement.position || 3}! Keep pushing for the #1 spot!`}
            </div>
            <button className="btn btn-primary" onClick={() => setShowAchievement(null)}>
              {showAchievement.type === 'gold' ? 'I am the GOAT 🐐' : 'Let\'s Go! 🚀'}
            </button>
          </div>
        </div>
      )}

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

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
          <div className="stat-item">
            <div className="stat-value" style={{ fontSize: '1.3rem' }}>{formatDistance(avgDist)}</div>
            <div className="stat-label">Avg Distance</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{ fontSize: '1.3rem' }}>{perfectCount}</div>
            <div className="stat-label">Perfect Pins</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{ fontSize: '1.3rem' }}>{results.length}</div>
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
        <div className="save-score-panel card card-accent-top" style={{ maxWidth: 420, margin: '1rem auto', textAlign: 'center', padding: '1rem' }}>
          <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Save Your Score</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              placeholder="Your name"
              maxLength={30}
              style={{
                flex: 1, padding: '0.6rem',
                border: '3px solid var(--border)',
                fontFamily: 'var(--font-body)', fontSize: '0.9rem',
                background: 'var(--bg)',
              }}
            />
            <button className="btn btn-primary btn-sm" onClick={handleSaveScore} disabled={!playerName.trim() || saving}>
              {saving ? '...' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', margin: '0.75rem 0', color: 'var(--primary)', fontWeight: 600 }}>
          ✅ Score saved as "{playerName}"!
        </div>
      )}

      <div className="results-map-wrap">
        <ResultsMap results={results} />
      </div>

      <div className="results-breakdown">
        <h3>Breakdown</h3>
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
              <div className="rc-meta">
                <span>📏 {formatDistance(r.distance)}</span>
              </div>
              {r.question.funFact && (
                <div className="rc-fact">ℹ️ {r.question.funFact}</div>
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

      {/* Gold push */}
      {pct < 100 && (
        <div style={{ textAlign: 'center', margin: '1.5rem 0 0.5rem', padding: '1rem', background: 'linear-gradient(135deg, #FFD700 0%, #F4A100 100%)', border: '3px solid var(--border)' }}>
          <strong style={{ fontFamily: 'var(--font-head)', fontSize: '1.1rem' }}>🥇 Go for Gold!</strong>
          <p style={{ fontSize: '0.85rem', marginTop: '0.3rem' }}>Score 100% to earn the Grandmaster rank. Can you pin every location perfectly?</p>
          <Link to="/play" className="btn btn-sm" style={{ marginTop: '0.5rem', background: '#fff' }}>Challenge Yourself →</Link>
        </div>
      )}
    </section>
  )
}
