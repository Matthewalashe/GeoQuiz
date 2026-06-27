import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getXPData, getLevel, getLevelTitle, getLevelProgress, getCurrentLeague, getNextLeague } from '../engine/xp.js'
import { supabase } from '../lib/supabase.js'
import { playCelebration, playXPGain, playLevelUp, playStepComplete, playPerfect, vibrate, vibrateLevelUp } from '../engine/audio.js'

/**
 * ResultCard — Duolingo-style multi-step gamified result flow.
 * 6 animated full-screens: Score → Stats → Tier → SignUp (if anon) → Share → Next
 * Each screen has: sound, vibration, confetti, motion design, and a big CTA.
 */

const ALTS = [
  { type: 'quiz', path: '/play', label: 'Map Quiz', emoji: '📍' },
  { type: 'crossword', path: '/crossword', label: 'Crossword', emoji: '✏️' },
  { type: 'adventure', path: '/adventure', label: 'Adventure', emoji: '🗺️' },
  { type: 'coloring', path: '/coloring', label: 'Coloring', emoji: '🎨' },
  { type: 'puzzle', path: '/puzzle', label: 'Puzzle', emoji: '🧩' },
  { type: 'word', path: '/wordgame', label: 'Word Game', emoji: '🔤' },
  { type: 'trivia', path: '/trivia', label: 'Trivia', emoji: '🧠' },
  { type: 'postcards', path: '/postcards', label: 'PostCards', emoji: '📷' },
]

// Confetti particle system
function Confetti({ count = 40, active }) {
  if (!active) return null
  const particles = Array.from({ length: count }, (_, i) => {
    const left = Math.random() * 100
    const delay = Math.random() * 0.6
    const dur = 1.5 + Math.random() * 1.5
    const size = 4 + Math.random() * 6
    const colors = ['#C8963E', '#E8C97A', '#22c55e', '#0ea5e9', '#f97316', '#ef4444', '#8b5cf6']
    const color = colors[Math.floor(Math.random() * colors.length)]
    const rotation = Math.random() * 360
    return (
      <div
        key={i}
        className="rc-confetti-particle"
        style={{
          left: `${left}%`,
          animationDelay: `${delay}s`,
          animationDuration: `${dur}s`,
          width: `${size}px`,
          height: `${size * 0.6}px`,
          background: color,
          transform: `rotate(${rotation}deg)`,
        }}
      />
    )
  })
  return <div className="rc-confetti-container">{particles}</div>
}

export default function ResultCard({
  score = 0,
  maxScore = 100,
  correctCount,
  totalQuestions,
  pointsEarned,
  gameTitle = 'Game',
  gameEmoji = '🎮',
  gameType = 'quiz',
  onPlayAgain,
  children,
}) {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [shared, setShared] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [animKey, setAnimKey] = useState(0)
  const [showConfetti, setShowConfetti] = useState(true)
  const [countUp, setCountUp] = useState(0)
  const countRef = useRef(null)

  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
  const grade = getGrade(pct)

  // XP & League data
  const xp = getXPData()
  const level = getLevel(xp.totalXP)
  const title = getLevelTitle(level)
  const progress = getLevelProgress(xp.totalXP)
  const league = getCurrentLeague(xp.totalXP)
  const nextLeague = getNextLeague(xp.totalXP)
  const xpToNext = nextLeague ? nextLeague.minXP - xp.totalXP : 0
  const streak = xp.streakDays || 0

  // Check auth
  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession()
      .then(({ data: { session } }) => setIsLoggedIn(!!session))
      .catch(() => setIsLoggedIn(false))
  }, [])

  // Play celebration sound + vibration on mount (score reveal)
  useEffect(() => {
    if (pct >= 80) { playPerfect(); vibrate([50, 30, 50, 30, 100]) }
    else { playCelebration(); vibrate([50, 30, 50]) }
  }, [])

  // Count-up animation for score percentage
  useEffect(() => {
    if (step !== 0) return
    setCountUp(0)
    const target = pct
    const duration = 1200
    const startTime = Date.now()
    countRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCountUp(Math.round(eased * target))
      if (progress >= 1) clearInterval(countRef.current)
    }, 16)
    return () => clearInterval(countRef.current)
  }, [step, pct])

  const shareText = `I scored ${score}/${maxScore} on ${gameTitle} on Wanda 🗺️ — can you beat me? visitnaija.online`

  function handleShare(platform) {
    setShared(true)
    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank')
    } else if (platform === 'x') {
      window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank')
    } else {
      navigator.clipboard?.writeText(shareText).catch(() => {})
    }
    setTimeout(() => setShared(false), 2000)
  }

  const nextStep = useCallback(() => {
    setStep(s => {
      let next = s + 1
      // Skip sign-up step if logged in
      if (next === 3 && isLoggedIn) next = 4
      // Play sound per step
      if (next === 1) { playXPGain(); vibrate([30, 20, 30]) }
      if (next === 2) { playLevelUp(); vibrateLevelUp() }
      if (next === 3) playStepComplete()
      if (next === 4) playStepComplete()
      return next
    })
    setAnimKey(k => k + 1)
    setShowConfetti(false)
    setTimeout(() => setShowConfetti(true), 100)
  }, [isLoggedIn])

  // Pick alternative games
  const alt = ALTS.find(g => g.type !== gameType) || ALTS[0]
  const alt2 = ALTS.find(g => g.type !== gameType && g.type !== alt.type) || ALTS[1]

  // ── STEP 0: Score Reveal ──
  if (step === 0) {
    return (
      <div className="rc-flow" key={animKey}>
        <Confetti active={showConfetti && pct >= 50} count={pct >= 80 ? 60 : 30} />
        <div className="rc-step rc-step-score">
          <div className="rc-emoji-ring-lg">
            <span>{gameEmoji}</span>
          </div>
          <h2 className="rc-grade-text">{grade.label}</h2>
          <div className="rc-score-circle-lg">
            <svg viewBox="0 0 140 140" className="rc-ring-svg-lg">
              <circle cx="70" cy="70" r="60" className="rc-ring-bg" />
              <circle
                cx="70" cy="70" r="60"
                className="rc-ring-fill-animated"
                style={{
                  strokeDasharray: `${2 * Math.PI * 60}`,
                  strokeDashoffset: `${2 * Math.PI * 60 * (1 - pct / 100)}`,
                  stroke: grade.color,
                }}
              />
            </svg>
            <div className="rc-score-inner-lg">
              <span className="rc-pct-lg">{countUp}%</span>
              <span className="rc-score-detail-lg">{score}/{maxScore}</span>
            </div>
          </div>
          <p className="rc-game-label">{gameTitle}</p>
          <button className="rc-continue-btn" onClick={nextStep}>
            Continue →
          </button>
        </div>
      </div>
    )
  }

  // ── STEP 1: Stats ──
  if (step === 1) {
    return (
      <div className="rc-flow" key={animKey}>
        <div className="rc-step rc-step-stats">
          <h2 className="rc-step-heading">📊 Your Stats</h2>
          <div className="rc-stats-grid">
            {correctCount != null && totalQuestions != null && (
              <div className="rc-stat-card">
                <span className="rc-stat-icon">✅</span>
                <span className="rc-stat-big">{correctCount}/{totalQuestions}</span>
                <span className="rc-stat-sub">Correct Answers</span>
              </div>
            )}
            {pointsEarned != null && (
              <div className="rc-stat-card rc-stat-gold">
                <span className="rc-stat-icon">⚡</span>
                <span className="rc-stat-big">+{pointsEarned}</span>
                <span className="rc-stat-sub">XP Earned</span>
              </div>
            )}
            <div className="rc-stat-card">
              <span className="rc-stat-icon">{league.emoji}</span>
              <span className="rc-stat-big">{league.name}</span>
              <span className="rc-stat-sub">Current League</span>
            </div>
            {streak > 0 && (
              <div className="rc-stat-card rc-stat-fire">
                <span className="rc-stat-icon">🔥</span>
                <span className="rc-stat-big">{streak} day{streak > 1 ? 's' : ''}</span>
                <span className="rc-stat-sub">Streak</span>
              </div>
            )}
          </div>
          {/* Optional children (per-question breakdown) */}
          {children && <div className="rc-breakdown-section">{children}</div>}
          <button className="rc-continue-btn" onClick={nextStep}>Continue →</button>
        </div>
      </div>
    )
  }

  // ── STEP 2: Tier Progress ──
  if (step === 2) {
    return (
      <div className="rc-flow" key={animKey}>
        <Confetti active={showConfetti} count={20} />
        <div className="rc-step rc-step-tier">
          <h2 className="rc-step-heading">🏆 Level Progress</h2>
          <div className="rc-tier-card">
            <div className="rc-tier-emoji">{title.emoji}</div>
            <h3 className="rc-tier-title">Level {level} — {title.title}</h3>
            <div className="rc-tier-bar-wrap">
              <div className="rc-tier-bar-track">
                <div className="rc-tier-bar-fill-animated" style={{ width: `${progress * 100}%` }} />
              </div>
              <span className="rc-tier-pct">{Math.round(progress * 100)}%</span>
            </div>
            {nextLeague && (
              <div className="rc-tier-next-info">
                <span>{xpToNext} XP to reach</span>
                <span className="rc-tier-next-badge">{nextLeague.emoji} {nextLeague.name}</span>
              </div>
            )}
          </div>
          <div className="rc-tier-milestone">
            <span className="rc-milestone-label">Total XP</span>
            <span className="rc-milestone-value">{xp.totalXP.toLocaleString()}</span>
          </div>
          <button className="rc-continue-btn" onClick={nextStep}>Continue →</button>
        </div>
      </div>
    )
  }

  // ── STEP 3: Sign Up CTA (only for anonymous users) ──
  if (step === 3 && !isLoggedIn) {
    return (
      <div className="rc-flow" key={animKey}>
        <div className="rc-step rc-step-signup">
          <div className="rc-signup-icon">🔐</div>
          <h2 className="rc-step-heading">Save Your Progress</h2>
          <p className="rc-signup-text">
            Create a free account to save your scores, compete on the leaderboard, and track your streak!
          </p>
          <div className="rc-signup-perks">
            <div className="rc-perk"><span>📊</span><span>Scores saved forever</span></div>
            <div className="rc-perk"><span>🏆</span><span>Global leaderboard</span></div>
            <div className="rc-perk"><span>🔥</span><span>Streak tracking</span></div>
            <div className="rc-perk"><span>👤</span><span>Custom profile</span></div>
          </div>
          <Link to="/auth" className="rc-signup-btn">Create Free Account →</Link>
          <button className="rc-skip-btn" onClick={nextStep}>Skip for now</button>
        </div>
      </div>
    )
  }

  // ── STEP 4: Share ──
  if (step === 4 || (step === 3 && isLoggedIn)) {
    return (
      <div className="rc-flow" key={animKey}>
        <div className="rc-step rc-step-share">
          <h2 className="rc-step-heading">📤 Challenge Friends</h2>
          <div className="rc-share-card">
            <p className="rc-share-preview">
              "{`I scored ${pct}% on ${gameTitle}`}" 🗺️
            </p>
            <div className="rc-share-buttons-lg">
              <button className="rc-share-btn-lg rc-share-wa" onClick={() => handleShare('whatsapp')}>
                💬 WhatsApp
              </button>
              <button className="rc-share-btn-lg rc-share-x" onClick={() => handleShare('x')}>
                𝕏 Post
              </button>
              <button className="rc-share-btn-lg rc-share-copy" onClick={() => handleShare('copy')}>
                {shared ? '✓ Copied!' : '📋 Copy Link'}
              </button>
            </div>
          </div>
          <button className="rc-continue-btn" onClick={() => { setStep(5); setAnimKey(k => k + 1); playStepComplete(); vibrate([20]) }}>Continue →</button>
        </div>
      </div>
    )
  }

  // ── STEP 5: Next Action ──
  return (
    <div className="rc-flow" key={animKey}>
      <div className="rc-step rc-step-next">
        <h2 className="rc-step-heading">🎮 What's Next?</h2>
        <div className="rc-next-options">
          {onPlayAgain && (
            <button className="rc-next-card rc-next-replay" onClick={onPlayAgain}>
              <span className="rc-next-emoji">🔄</span>
              <div>
                <strong>Play Again</strong>
                <span>Try to beat your score</span>
              </div>
            </button>
          )}
          <Link to={alt.path} className="rc-next-card rc-next-alt">
            <span className="rc-next-emoji">{alt.emoji}</span>
            <div>
              <strong>Try {alt.label}</strong>
              <span>Something different</span>
            </div>
          </Link>
          <Link to={alt2.path} className="rc-next-card rc-next-alt2">
            <span className="rc-next-emoji">{alt2.emoji}</span>
            <div>
              <strong>Try {alt2.label}</strong>
              <span>Discover more</span>
            </div>
          </Link>
          <Link to="/leaderboard" className="rc-next-card rc-next-lb">
            <span className="rc-next-emoji">🏅</span>
            <div>
              <strong>Leaderboard</strong>
              <span>See where you rank</span>
            </div>
          </Link>
        </div>
        <Link to="/" className="rc-home-link">← Back to Home</Link>
      </div>
    </div>
  )
}

function getGrade(pct) {
  if (pct >= 90) return { label: 'Outstanding! 🏆', color: 'var(--primary)' }
  if (pct >= 70) return { label: 'Great Job! ⭐', color: 'var(--green)' }
  if (pct >= 50) return { label: 'Well Done! 🎯', color: 'var(--teal)' }
  if (pct >= 30) return { label: 'Keep Going! 💪', color: 'var(--secondary)' }
  return { label: 'Keep Exploring! 🗺️', color: 'var(--text-secondary)' }
}
