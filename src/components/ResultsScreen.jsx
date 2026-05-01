import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getGrade, getScoreClass, formatDistance } from '../engine/scoring.js'
import { submitScore, fetchLeaderboard } from '../lib/supabase.js'
import { ResultsMap } from './MapView.jsx'
import { encodeChallenge } from './Challenge.jsx'
import { JourneyCard, SponsorCard } from './SponsoredBanner.jsx'
import { SPONSORS } from '../data/sponsors.js'
import { awardGameXP, getLevel, getLevelTitle, getLevelProgress, getXPToNextLevel } from '../engine/xp.js'

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
  const [showAchievement, setShowAchievement] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [xpResult, setXpResult] = useState(null)

  useEffect(() => {
    if (!data) navigate('/', { replace: true })
    fetchLeaderboard(10).then(lb => setLeaderboard(lb)).catch(() => {})
    // Award XP for this game
    if (data?.results) {
      const xp = awardGameXP(data.results, data.config)
      setXpResult(xp)
    }
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
        avatar: localStorage.getItem('geoquiz_avatar') || '🎭',
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

  // XP display data
  const xpLevel = xpResult ? getLevel(xpResult.totalXP) : 1
  const xpTitle = getLevelTitle(xpLevel)
  const xpProgress = xpResult ? getLevelProgress(xpResult.totalXP) : 0
  const xpToNext = xpResult ? getXPToNextLevel(xpResult.totalXP) : 500

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

        {/* Challenge comparison */}
        {data.config?.challenge && (
          <div className={`challenge-result-banner ${totalScore > data.config.challenge.opponentScore ? 'win' : totalScore < data.config.challenge.opponentScore ? 'lose' : 'tie'}`}>
            {totalScore > data.config.challenge.opponentScore
              ? `🎉 You beat ${data.config.challenge.opponentName}! (${data.config.challenge.opponentScore} pts)`
              : totalScore < data.config.challenge.opponentScore
              ? `😤 ${data.config.challenge.opponentName} wins with ${data.config.challenge.opponentScore} pts. Try again!`
              : `🤝 It's a tie with ${data.config.challenge.opponentName}! Both scored ${totalScore}`}
          </div>
        )}

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
            <div className="stat-value" style={{ fontSize: '1.3rem' }}>{data.bestStreak || 0}</div>
            <div className="stat-label">🔥 Best Streak</div>
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

      {/* XP Earned */}
      {xpResult && (
        <div className="xp-earned-panel">
          {xpResult.leveledUp && (
            <div className="xp-levelup">
              🎉 LEVEL UP! Level {xpResult.oldLevel} → <strong>Level {xpResult.newLevel}</strong>
              <span className="xp-new-title">{xpTitle.emoji} {xpTitle.title}</span>
            </div>
          )}
          <div className="xp-earned-header">
            <span className="xp-earned-label">⚡ XP Earned</span>
            <span className="xp-earned-total">+{xpResult.totalAwarded} XP</span>
          </div>
          <div className="xp-earned-breakdown">
            {xpResult.correctXP > 0 && <span>✅ Correct: +{xpResult.correctXP}</span>}
            {xpResult.perfectXP > 0 && <span>🎯 Perfect: +{xpResult.perfectXP}</span>}
            <span>🏁 Complete: +{xpResult.completionXP}</span>
            {xpResult.bonusXP > 0 && <span>⭐ Bonus: +{xpResult.bonusXP}</span>}
          </div>
          <div className="xp-level-row">
            <span className="xp-level-label">{xpTitle.emoji} Lv.{xpLevel} {xpTitle.title}</span>
            <span className="xp-level-next">{xpToNext} XP to Lv.{xpLevel + 1}</span>
          </div>
          <div className="xp-bar-results">
            <div className="xp-bar-fill-results" style={{ width: `${xpProgress * 100}%` }} />
          </div>
        </div>
      )}

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

      {/* Journey Card — Sponsored Discoveries */}
      <JourneyCard results={data.results} />

      {/* Discover Nearby — All sponsors */}
      <div className="results-discover">
        <h3 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>📍 Discover Near Your Quiz Areas</h3>
        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Places to visit based on areas you explored today</p>
        <div className="results-sponsor-grid">
          {SPONSORS.filter(s => s.active).map(s => (
            <SponsorCard key={s.id} sponsor={s} />
          ))}
        </div>
        <p style={{ textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Sponsored · Powered by visitnaija.online</p>
      </div>

      {/* Social Share */}
      {(() => {
        const code = encodeChallenge(data.config, totalScore, playerName || 'Anonymous')
        const challengeUrl = `${window.location.origin}/challenge?code=${code}`
        const shareText = `🗺️ I scored ${totalScore}/${maxScore} (${pct}%) on GeoQuiz Lagos!${data.bestStreak >= 3 ? ` 🔥${data.bestStreak} streak!` : ''} Can you beat me?`
        const fullText = encodeURIComponent(shareText + '\n' + challengeUrl)
        const urlEnc = encodeURIComponent(challengeUrl)
        return (
          <div className="share-section">
            <h4>⚔️ Challenge a Friend</h4>
            <div className="share-icons">
              <a href={`https://wa.me/?text=${fullText}`} target="_blank" rel="noopener noreferrer" className="share-btn whatsapp" title="WhatsApp">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>
              <a href={`https://twitter.com/intent/tweet?text=${fullText}`} target="_blank" rel="noopener noreferrer" className="share-btn x-twitter" title="X (Twitter)">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a href={`https://www.facebook.com/sharer/sharer.php?u=${urlEnc}&quote=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" className="share-btn facebook" title="Facebook">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href={`https://www.snapchat.com/scan?attachmentUrl=${urlEnc}`} target="_blank" rel="noopener noreferrer" className="share-btn snapchat" title="Snapchat">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.147-.008.302-.042.464-.09a.966.966 0 01.294-.044c.193 0 .37.056.53.166a.67.67 0 01.285.55.733.733 0 01-.439.66 4.038 4.038 0 01-.645.242c-.18.06-.403.134-.618.21a1.666 1.666 0 00-.572.335c-.093.108-.126.238-.094.385.06.278.181.544.343.8.578.912 1.381 1.52 2.39 1.86a2.6 2.6 0 00.498.12c.217.03.362.172.362.383a.656.656 0 01-.108.332c-.39.587-1.164.954-2.298 1.09a9.16 9.16 0 00-.146.684c-.03.145-.06.292-.132.34-.105.072-.297.108-.582.108-.157 0-.34-.015-.54-.04a5.953 5.953 0 00-.837-.06c-.24 0-.455.012-.645.036a3.47 3.47 0 00-.744.21 4.04 4.04 0 00-.878.543c-.768.595-1.534 1.277-3.092 1.277-.068 0-.133-.003-.198-.007a4.15 4.15 0 01-.197.007c-1.559 0-2.324-.682-3.092-1.277a4.04 4.04 0 00-.878-.543 3.466 3.466 0 00-.744-.21 7.095 7.095 0 00-.645-.036c-.305 0-.597.025-.836.06-.2.025-.384.04-.54.04-.31 0-.49-.04-.583-.108-.07-.048-.101-.195-.132-.34a9.06 9.06 0 00-.145-.684c-1.134-.136-1.91-.503-2.298-1.09a.656.656 0 01-.108-.332c0-.21.145-.353.362-.383a2.6 2.6 0 00.498-.12c1.009-.34 1.812-.948 2.39-1.86.162-.256.283-.522.343-.8.032-.147-.001-.277-.094-.385a1.666 1.666 0 00-.572-.335 9.023 9.023 0 01-.618-.21 4.04 4.04 0 01-.645-.242.733.733 0 01-.439-.66.67.67 0 01.285-.55c.16-.11.337-.166.53-.166.11 0 .207.015.293.044.162.048.317.082.464.09.198 0 .326-.045.401-.09a22.372 22.372 0 01-.033-.57c-.104-1.628-.23-3.654.3-4.847C7.86 1.069 11.216.793 12.206.793z"/></svg>
              </a>
              <a href={`https://pinterest.com/pin/create/button/?url=${urlEnc}&description=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer" className="share-btn pinterest" title="Pinterest">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641 0 12.017 0z"/></svg>
              </a>
              <button className="share-btn copy-link" title="Copy Link" onClick={() => {
                navigator.clipboard.writeText(challengeUrl).then(() => alert('Link copied!')).catch(() => prompt('Copy:', challengeUrl))
              }}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
              </button>
            </div>
          </div>
        )
      })()}

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
