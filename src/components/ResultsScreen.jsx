import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getGrade, formatDistance } from '../engine/scoring.js'
import { submitScore, fetchLeaderboard } from '../lib/supabase.js'
import { ResultsMap } from './MapView.jsx'
import { encodeChallenge } from './Challenge.jsx'
import { awardGameXP, getLevel, getLevelTitle, getLevelProgress, getXPToNextLevel } from '../engine/xp.js'
import { playPerfect, playLevelUp, playXPGain, playCorrect, vibrateSuccess, vibrateLevelUp } from '../engine/audio.js'
import {
  LocationRegular, TargetRegular, FireRegular, QuestionCircleRegular,
  TrophyRegular, StarRegular, CheckmarkCircleRegular,
  ArrowRightRegular, HomeRegular, PlayRegular, PeopleRegular,
  ShareRegular, CopyRegular, InfoRegular, FlashRegular,
} from '@fluentui/react-icons'

const CONFETTI_COLORS = ['#C8963E', '#ffd700', '#00c853', '#8b5cf6', '#0ea5e9', '#f59e0b', '#ec4899', '#ef4444']

function Confetti() {
  const pieces = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    delay: `${Math.random() * 0.8}s`,
    size: 6 + Math.random() * 6,
  }))
  return (
    <div className="confetti-container">
      {pieces.map(p => (
        <div key={p.id} className="confetti-piece" style={{
          left: p.left, background: p.color,
          width: p.size, height: p.size,
          animationDelay: p.delay,
        }} />
      ))}
    </div>
  )
}

function getRank(pct, totalPerfects) {
  if (totalPerfects >= 3) return { title: 'You Sabi!', icon: <TrophyRegular />, cls: 'rank-gold' }
  if (pct === 100) return { title: 'Grandmaster', icon: <TrophyRegular />, cls: 'rank-gold' }
  if (pct >= 90) return { title: 'Top Leader', icon: <StarRegular />, cls: 'rank-gold' }
  if (pct >= 80) return { title: 'GIS Pro', icon: <TargetRegular />, cls: 'rank-silver' }
  if (pct >= 70) return { title: 'Navigator', icon: <LocationRegular />, cls: 'rank-silver' }
  if (pct >= 50) return { title: 'Explorer', icon: <LocationRegular />, cls: 'rank-bronze' }
  if (pct >= 30) return { title: 'Rookie', icon: <PlayRegular />, cls: 'rank-bronze' }
  return { title: 'Tourist', icon: <PlayRegular />, cls: 'rank-default' }
}

function getEncouragement(pct) {
  if (pct >= 90) return 'Outstanding! Try Expert difficulty with a 30s timer — the ultimate challenge.'
  if (pct >= 70) return "You're close to gold! Push harder on the tougher categories."
  if (pct >= 50) return 'Great progress! Keep grinding — gold is within reach.'
  return 'Every game makes you better! Try Beginner difficulty to build confidence.'
}

export default function ResultsScreen() {
  const location = useLocation()
  const navigate = useNavigate()
  const data = location.state

  const [playerName, setPlayerName] = useState(() => localStorage.getItem('geoquiz_player') || '')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showAchievement, setShowAchievement] = useState(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [leaderboard, setLeaderboard] = useState([])
  const [xpResult, setXpResult] = useState(null)

  useEffect(() => {
    if (!data) navigate('/', { replace: true })
    fetchLeaderboard(10).then(lb => setLeaderboard(lb)).catch(() => {})
    if (data?.results) {
      const xp = awardGameXP(data.results, data.config)
      setXpResult(xp)
      // Sound effects
      setTimeout(() => { playXPGain(); vibrateSuccess() }, 600)
      if (xp.leveledUp) {
        setTimeout(() => { playLevelUp(); vibrateLevelUp() }, 1200)
      }
      const pct = Math.round((data.totalScore / (data.results.length * 100)) * 100)
      if (pct === 100) {
        setTimeout(() => { playPerfect(); setShowConfetti(true) }, 400)
      }
    }
  }, [data, navigate]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSaveScore() {
    if (!playerName.trim() || !data) return
    setSaving(true)
    localStorage.setItem('geoquiz_player', playerName.trim())
    const prev = parseInt(localStorage.getItem('geoquiz_total_perfects') || '0', 10)
    localStorage.setItem('geoquiz_total_perfects', prev + perfectCount)
    try {
      await submitScore({
        playerName: playerName.trim(), score: data.totalScore,
        maxScore: data.maxScore, questionCount: data.questionCount,
        categories: data.config?.categories || [], difficulty: data.config?.difficulty || 'all',
        avatar: localStorage.getItem('geoquiz_avatar') || '🧭', gameType: 'quiz',
      })
      playCorrect(); vibrateSuccess()
      setSaved(true)
      if (leaderboard.length > 0) {
        const bestScore = leaderboard[0]?.score || 0
        if (data.totalScore > bestScore) setShowAchievement({ type: 'best' })
        else if (leaderboard.length < 3 || data.totalScore > (leaderboard[2]?.score || 0)) {
          setShowAchievement({ type: 'top3', position: leaderboard.filter(e => e.score > data.totalScore).length + 1 })
        }
      } else { setShowAchievement({ type: 'best' }) }
      if (data.totalScore === data.maxScore) setShowAchievement({ type: 'gold' })
    } catch (err) {
      console.error('Save score error:', err)
      setSaved(true)
    } finally { setSaving(false) }
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

  const xpLevel = xpResult ? getLevel(xpResult.totalXP) : 1
  const xpTitle = getLevelTitle(xpLevel)
  const xpProgress = xpResult ? getLevelProgress(xpResult.totalXP) : 0
  const xpToNext = xpResult ? getXPToNextLevel(xpResult.totalXP) : 500

  const scoreColor = pct >= 80 ? '#00c853' : pct >= 60 ? '#ffd700' : pct >= 40 ? '#0ea5e9' : '#ef4444'

  return (
    <section className="results">
      {showConfetti && <Confetti />}

      {/* Achievement overlay */}
      {showAchievement && (
        <div className="results-achievement-overlay" onClick={() => setShowAchievement(null)}>
          <div className="results-achievement-modal glass glass-glow" onClick={e => e.stopPropagation()}>
            <div className="results-achievement-icon">
              {showAchievement.type === 'gold' ? <TrophyRegular fontSize={56} /> :
               showAchievement.type === 'best' ? <StarRegular fontSize={56} /> :
               <TrophyRegular fontSize={56} />}
            </div>
            <div className="results-achievement-title">
              {showAchievement.type === 'gold' ? 'PERFECT GOLD!' :
               showAchievement.type === 'best' ? 'NEW HIGH SCORE!' :
               `TOP ${showAchievement.position || 3}!`}
            </div>
            <div className="results-achievement-subtitle">
              {showAchievement.type === 'gold'
                ? 'Every single pin was perfect! You are a true master!'
                : showAchievement.type === 'best'
                ? 'You just beat the highest score on the leaderboard!'
                : `You've broken into the top ${showAchievement.position || 3}!`}
            </div>
            <button className="btn btn-primary" onClick={() => setShowAchievement(null)}
              style={{ padding: '0.6rem 1.5rem', borderRadius: '0.75rem', border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>
              {showAchievement.type === 'gold' ? "Let's Go!" : 'Continue'}
            </button>
          </div>
        </div>
      )}

      {/* Hero Score Card */}
      <div className="results-hero glass glass-glow">
        <div className={`results-rank-badge ${rank.cls}`}>
          {rank.icon} {rank.title}
        </div>

        {/* Challenge comparison */}
        {data.config?.challenge && (
          <div style={{ fontSize: '0.85rem', marginBottom: '0.75rem', padding: '0.5rem', borderRadius: '0.5rem',
            background: totalScore > data.config.challenge.opponentScore ? 'rgba(0,200,83,0.1)' : 'rgba(239,68,68,0.1)',
            color: totalScore > data.config.challenge.opponentScore ? '#00c853' : '#ef4444' }}>
            {totalScore > data.config.challenge.opponentScore
              ? `You beat ${data.config.challenge.opponentName}!`
              : totalScore < data.config.challenge.opponentScore
              ? `${data.config.challenge.opponentName} wins with ${data.config.challenge.opponentScore} pts`
              : `Tie with ${data.config.challenge.opponentName}!`}
          </div>
        )}

        <div className="results-score-big">{totalScore}<span className="results-score-max"> / {maxScore}</span></div>
        <div className="results-pct-ring" style={{ color: scoreColor }}>{pct}%</div>
        <div className="results-grade-pill" style={{ background: `${scoreColor}22`, color: scoreColor, border: `1px solid ${scoreColor}44` }}>
          {grade.label}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="results-stats-grid">
        <div className="results-stat-card glass-subtle">
          <div className="results-stat-icon"><LocationRegular /></div>
          <div className="results-stat-value">{formatDistance(avgDist)}</div>
          <div className="results-stat-label">Avg Distance</div>
        </div>
        <div className="results-stat-card glass-subtle">
          <div className="results-stat-icon"><TargetRegular /></div>
          <div className="results-stat-value">{perfectCount}</div>
          <div className="results-stat-label">Perfect Pins</div>
        </div>
        <div className="results-stat-card glass-subtle">
          <div className="results-stat-icon"><FireRegular /></div>
          <div className="results-stat-value">{data.bestStreak || 0}</div>
          <div className="results-stat-label">Best Streak</div>
        </div>
        <div className="results-stat-card glass-subtle">
          <div className="results-stat-icon"><QuestionCircleRegular /></div>
          <div className="results-stat-value">{results.length}</div>
          <div className="results-stat-label">Questions</div>
        </div>
      </div>

      {/* XP Panel */}
      {xpResult && (
        <div className="results-xp-panel glass glass-accent">
          {xpResult.leveledUp && (
            <div className="results-xp-levelup">
              <FlashRegular style={{ verticalAlign: 'middle' }} /> LEVEL UP! Level {xpResult.oldLevel} → <strong>Level {xpResult.newLevel}</strong>
              <span style={{ display: 'block', fontSize: '0.8rem', marginTop: '0.2rem', opacity: 0.8 }}>{xpTitle.title}</span>
            </div>
          )}
          <div className="results-xp-header">
            <span className="results-xp-label"><FlashRegular /> XP Earned</span>
            <span className="results-xp-total">+{xpResult.totalAwarded} XP</span>
          </div>
          <div className="results-xp-breakdown">
            {xpResult.correctXP > 0 && <span className="results-xp-chip"><CheckmarkCircleRegular /> Correct: +{xpResult.correctXP}</span>}
            {xpResult.perfectXP > 0 && <span className="results-xp-chip"><TargetRegular /> Perfect: +{xpResult.perfectXP}</span>}
            <span className="results-xp-chip"><PlayRegular /> Complete: +{xpResult.completionXP}</span>
            {xpResult.bonusXP > 0 && <span className="results-xp-chip"><StarRegular /> Bonus: +{xpResult.bonusXP}</span>}
          </div>
          <div className="results-xp-level-row">
            <span>Lv.{xpLevel} {xpTitle.title}</span>
            <span>{xpToNext} XP to Lv.{xpLevel + 1}</span>
          </div>
          <div className="results-xp-bar">
            <div className="results-xp-bar-fill" style={{ width: `${xpProgress * 100}%` }} />
          </div>
        </div>
      )}

      {/* Encouragement */}
      <div className="results-encourage glass-subtle">{encouragement}</div>

      {/* Save Score */}
      {!saved ? (
        <div className="glass" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <h3 style={{ fontFamily: 'var(--font-head)', fontSize: '1rem', marginBottom: '0.75rem' }}>Save Your Score</h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input type="text" value={playerName} onChange={e => setPlayerName(e.target.value)}
              placeholder="Your name" maxLength={30}
              style={{ flex: 1, padding: '0.65rem 0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '0.5rem', color: 'var(--text)', fontSize: '0.9rem', fontFamily: 'var(--font-body)' }} />
            <button onClick={handleSaveScore} disabled={!playerName.trim() || saving}
              style={{ padding: '0.65rem 1.2rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '0.5rem',
                fontWeight: 600, cursor: 'pointer', opacity: !playerName.trim() || saving ? 0.5 : 1 }}>
              {saving ? '...' : 'Save'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '0.5rem', color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem' }}>
          <CheckmarkCircleRegular style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} /> Score saved as "{playerName}"
        </div>
      )}

      {/* Map */}
      <div className="results-map-wrap glass-subtle" style={{ overflow: 'hidden' }}>
        <ResultsMap results={results} />
      </div>

      {/* Question Breakdown */}
      <h3 className="results-breakdown-title">Question Breakdown</h3>
      {results.map((r, i) => {
        const sc = r.score >= 80 ? '#00c853' : r.score >= 60 ? '#ffd700' : r.score >= 40 ? '#0ea5e9' : '#ef4444'
        return (
          <div className="results-q-card glass-subtle" key={i}>
            <div className="results-q-header">
              <span className="results-q-num">#{i + 1} · {r.question.categoryLabel}</span>
              <span className="results-q-score" style={{ color: sc }}>+{r.score}</span>
            </div>
            <div className="results-q-name"><LocationRegular fontSize={14} /> {r.question.answer.name}</div>
            <div className="results-q-question">{r.question.question}</div>
            <div className="results-q-meta">
              <span><LocationRegular fontSize={12} /> {formatDistance(r.distance)}</span>
            </div>
            {r.question.funFact && (
              <div className="results-q-fact"><InfoRegular fontSize={13} style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} />{r.question.funFact}</div>
            )}
          </div>
        )
      })}

      {/* Actions */}
      <div className="results-actions">
        <Link to="/play" className="btn btn-primary"><PlayRegular /> Play Again</Link>
        <Link to="/leaderboard" className="btn btn-outline"><TrophyRegular /> Leaderboard</Link>
        <Link to="/" className="btn btn-outline"><HomeRegular /> Home</Link>
      </div>



      {/* Social Share */}
      {(() => {
        const code = encodeChallenge(data.config, totalScore, playerName || 'Anonymous')
        const challengeUrl = `${window.location.origin}/challenge?code=${code}`
        const shareText = `I scored ${totalScore}/${maxScore} (${pct}%) on Wanda!${data.bestStreak >= 3 ? ` ${data.bestStreak} streak!` : ''} Can you beat me?`
        const fullText = encodeURIComponent(shareText + '\n' + challengeUrl)
        const urlEnc = encodeURIComponent(challengeUrl)
        return (
          <div className="results-share glass-subtle" style={{ padding: '1.25rem' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              <ShareRegular /> Challenge a Friend
            </h4>
            <div className="share-icons" style={{ marginTop: '0.75rem' }}>
              <a href={`https://wa.me/?text=${fullText}`} target="_blank" rel="noopener noreferrer" className="share-btn whatsapp" title="WhatsApp">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>
              <a href={`https://twitter.com/intent/tweet?text=${fullText}`} target="_blank" rel="noopener noreferrer" className="share-btn x-twitter" title="X">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <button className="share-btn copy-link" title="Copy Link" onClick={() => {
                navigator.clipboard.writeText(challengeUrl).then(() => alert('Link copied!')).catch(() => prompt('Copy:', challengeUrl))
              }}>
                <CopyRegular fontSize={20} />
              </button>
            </div>
          </div>
        )
      })()}

      {/* Gold Push */}
      {pct < 100 && (
        <div className="results-gold-push glass glass-accent" style={{ borderRadius: '1rem' }}>
          <strong><TrophyRegular /> Go for Gold!</strong>
          <p>Score 100% to earn the Grandmaster rank. Can you pin every location perfectly?</p>
          <Link to="/play" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
            padding: '0.5rem 1.2rem', background: 'var(--primary)', color: '#fff', borderRadius: '0.5rem',
            textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
            Challenge Yourself <ArrowRightRegular />
          </Link>
        </div>
      )}
    </section>
  )
}
