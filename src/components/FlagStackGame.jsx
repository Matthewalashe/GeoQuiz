import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FlagRegular, HeartRegular, HomeRegular, PlayRegular, FlashRegular, TrophyRegular } from '@fluentui/react-icons'
import { playCorrect, playWrong, playCelebration, vibrateTap, vibrateSuccess } from '../engine/audio.js'
import { addXP } from '../engine/xp.js'
import { calculateGameReward, addCoins } from '../engine/coinEconomy.js'
import { autoSubmitScore } from '../engine/leaderboard.js'

// ── FLAG DATA (African countries) ──
const FLAGS = [
  { country: 'Nigeria', code: 'ng' },
  { country: 'Ghana', code: 'gh' },
  { country: 'South Africa', code: 'za' },
  { country: 'Kenya', code: 'ke' },
  { country: 'Egypt', code: 'eg' },
  { country: 'Morocco', code: 'ma' },
  { country: 'Ethiopia', code: 'et' },
  { country: 'Tanzania', code: 'tz' },
  { country: 'Cameroon', code: 'cm' },
  { country: 'Senegal', code: 'sn' },
  { country: 'Ivory Coast', code: 'ci' },
  { country: 'Algeria', code: 'dz' },
  { country: 'Uganda', code: 'ug' },
  { country: 'Rwanda', code: 'rw' },
  { country: 'Tunisia', code: 'tn' },
  { country: 'Zimbabwe', code: 'zw' },
  { country: 'Angola', code: 'ao' },
  { country: 'Mozambique', code: 'mz' },
  { country: 'Mali', code: 'ml' },
  { country: 'Burkina Faso', code: 'bf' },
  { country: 'Niger', code: 'ne' },
  { country: 'Chad', code: 'td' },
  { country: 'Guinea', code: 'gn' },
  { country: 'Togo', code: 'tg' },
  { country: 'Sierra Leone', code: 'sl' },
  { country: 'Benin', code: 'bj' },
  { country: 'Liberia', code: 'lr' },
  { country: 'Gambia', code: 'gm' },
  { country: 'Botswana', code: 'bw' },
  { country: 'Namibia', code: 'na' },
]

function generateRound(score) {
  const answer = FLAGS[Math.floor(Math.random() * FLAGS.length)]
  const wrongs = FLAGS.filter(f => f.code !== answer.code)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
  const all = [...wrongs, answer].sort(() => Math.random() - 0.5)
  const speed = Math.max(1.8, 4 - Math.floor(score / 500) * 0.3)
  return {
    country: answer.country,
    answerCode: answer.code,
    speed,
    flags: all.map((f, i) => ({
      id: Date.now() + i,
      code: f.code,
      country: f.country,
      correct: f.code === answer.code,
      left: 5 + (i * 23), // spread across 4 columns
      tapped: false,
    }))
  }
}

// ═══════════════════════════════════════════
// FLAGSTACK GAME
// ═══════════════════════════════════════════
export default function FlagStackGame() {
  const navigate = useNavigate()

  const [phase, setPhase] = useState('ready') // ready | playing | gameover
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [round, setRound] = useState(null)
  const [roundNum, setRoundNum] = useState(0)
  const [feedback, setFeedback] = useState(null) // null | 'correct' | 'wrong'
  const [tappedFlags, setTappedFlags] = useState(new Set())
  const [revealAll, setRevealAll] = useState(false) // shows correct flag on wrong answer
  const [roundDone, setRoundDone] = useState(false)
  const [coinsEarned, setCoinsEarned] = useState(0)
  const feedbackTimer = useRef(null)
  const roundTimer = useRef(null)

  // Lock body scroll to prevent iOS rubber-band and viewport overflow
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    html.style.overflow = 'hidden'
    html.style.position = 'fixed'
    html.style.width = '100%'
    html.style.height = '100%'
    body.style.overflow = 'hidden'
    body.style.position = 'fixed'
    body.style.width = '100%'
    body.style.height = '100%'
    const preventZoom = (e) => { if (e.touches.length > 1) e.preventDefault() }
    document.addEventListener('touchmove', preventZoom, { passive: false })
    return () => {
      html.style.overflow = ''
      html.style.position = ''
      html.style.width = ''
      html.style.height = ''
      body.style.overflow = ''
      body.style.position = ''
      body.style.width = ''
      body.style.height = ''
      document.removeEventListener('touchmove', preventZoom)
    }
  }, [])

  // Start game
  function startGame() {
    setPhase('playing')
    setScore(0)
    setLives(3)
    setStreak(0)
    setBestStreak(0)
    setRoundNum(0)
    setTappedFlags(new Set())
    setRevealAll(false)
    setRoundDone(false)
    nextRound(0)
  }

  function nextRound(currentScore) {
    const r = generateRound(currentScore)
    setRound(r)
    setRoundNum(n => n + 1)
    setTappedFlags(new Set())
    setRevealAll(false)
    setRoundDone(false)
  }

  // Handle flag tap
  const handleTap = useCallback((flag) => {
    if (phase !== 'playing' || roundDone || tappedFlags.has(flag.id)) return

    setTappedFlags(prev => new Set(prev).add(flag.id))
    setRoundDone(true)

    if (flag.correct) {
      const pts = 100
      const newScore = score + pts
      setScore(newScore)
      setStreak(s => {
        const ns = s + 1
        setBestStreak(b => Math.max(b, ns))
        return ns
      })
      setFeedback('correct')
      try { playCorrect(); vibrateTap() } catch {}

      clearTimeout(feedbackTimer.current)
      feedbackTimer.current = setTimeout(() => {
        setFeedback(null)
        nextRound(newScore)
      }, 800)
    } else {
      const newLives = lives - 1
      setLives(newLives)
      setStreak(0)
      setFeedback('wrong')
      setRevealAll(true) // Show the correct flag
      try { playWrong(); vibrateTap() } catch {}

      clearTimeout(feedbackTimer.current)
      feedbackTimer.current = setTimeout(() => {
        setFeedback(null)
        setRevealAll(false)
        if (newLives <= 0) {
          finalizeGame(score)
          try { if (score > 2000) playCelebration() } catch {}
        } else {
          nextRound(score)
        }
      }, 1500) // Longer delay so user can see correct answer
    }
  }, [phase, roundDone, tappedFlags, score, lives]) // eslint-disable-line

  // Flag missed (reached bottom)
  const handleMiss = useCallback(() => {
    if (phase !== 'playing' || roundDone) return
    setRoundDone(true)
    const newLives = lives - 1
    setLives(newLives)
    setStreak(0)
    setFeedback('wrong')
    setRevealAll(true) // Show the correct flag
    try { playWrong() } catch {}

    clearTimeout(feedbackTimer.current)
    feedbackTimer.current = setTimeout(() => {
      setFeedback(null)
      setRevealAll(false)
      if (newLives <= 0) {
        finalizeGame(score)
      } else {
        nextRound(score)
      }
    }, 1500) // Longer delay so user can see correct answer
  }, [phase, roundDone, lives, score]) // eslint-disable-line

  // Finalize game — award XP, coins, submit score
  function finalizeGame(finalScore) {
    setPhase('gameover')
    // Award XP
    try {
      addXP('COMPLETE_GAME')
      if (finalScore >= 2000) addXP('FIRST_PERFECT_GAME')
    } catch {}
    // Award coins based on performance (use rounds as proxy for score %)
    try {
      const pct = Math.min(100, Math.round((finalScore / Math.max(roundNum * 100, 1)) * 100))
      const coins = calculateGameReward(pct)
      if (coins > 0) {
        addCoins(coins, 'FlagStack game reward')
        setCoinsEarned(coins)
      }
    } catch {}
    // Submit to leaderboard
    try { autoSubmitScore({ gameType: 'flagstack', score: finalScore, maxScore: roundNum * 100, questionCount: roundNum }) } catch {}
    // Save to localStorage
    try {
      const prev = JSON.parse(localStorage.getItem('geoquiz_sessions') || '[]')
      prev.push({ date: new Date().toISOString(), score: finalScore, game: 'flagstack', rounds: roundNum })
      localStorage.setItem('geoquiz_sessions', JSON.stringify(prev.slice(-50)))
    } catch {}
  }

  // Cleanup
  useEffect(() => {
    return () => {
      clearTimeout(feedbackTimer.current)
      clearTimeout(roundTimer.current)
    }
  }, [])

  // ── READY SCREEN ──
  if (phase === 'ready') {
    return (
      <section className="fs-ready">
        <div className="fs-ready-card glass glass-glow">
          <div className="fs-ready-icon"><FlagRegular /></div>
          <h1 className="fs-ready-title">FlagStack</h1>
          <p className="fs-ready-desc">
            Flags fall from the top. Tap the correct one before it reaches the bottom!
            Speed increases as you score. 3 misses = game over.
          </p>
          <div className="fs-ready-rules">
            <div className="fs-rule"><span className="fs-rule-icon">✅</span> Correct tap = +100 pts</div>
            <div className="fs-rule"><span className="fs-rule-icon">❌</span> Wrong tap = lose a life</div>
            <div className="fs-rule"><span className="fs-rule-icon">⏰</span> Miss = lose a life</div>
            <div className="fs-rule"><span className="fs-rule-icon">⚡</span> Speed increases over time</div>
          </div>
          <button className="fs-btn fs-btn-start" onClick={startGame}>
            <FlashRegular /> Start Game
          </button>
          <Link to="/play" className="fs-btn fs-btn-outline">← Back to Games</Link>
        </div>
      </section>
    )
  }

  // ── GAME OVER ──
  if (phase === 'gameover') {
    return (
      <section className="fs-gameover">
        <div className="fs-gameover-card glass glass-glow">
          <div className="fs-gameover-icon"><TrophyRegular /></div>
          <h2 className="fs-gameover-title">Game Over!</h2>
          <div className="fs-gameover-score">{score}<span> pts</span></div>
          <div className="fs-gameover-stats">
            <div className="fs-stat">
              <span className="fs-stat-value">{roundNum}</span>
              <span className="fs-stat-label">Rounds</span>
            </div>
            <div className="fs-stat">
              <span className="fs-stat-value">🔥 {bestStreak}</span>
              <span className="fs-stat-label">Best Streak</span>
            </div>
            <div className="fs-stat">
              <span className="fs-stat-value">{Math.round(round?.speed * 10) / 10}s</span>
              <span className="fs-stat-label">Final Speed</span>
            </div>
            {coinsEarned > 0 && (
              <div className="fs-stat">
                <span className="fs-stat-value" style={{ color: '#eab308' }}>+{coinsEarned}</span>
                <span className="fs-stat-label">Coins</span>
              </div>
            )}
          </div>
          <div className="fs-gameover-actions">
            <button className="fs-btn fs-btn-start" onClick={startGame}>
              <PlayRegular /> Play Again
            </button>
            <Link to="/play" className="fs-btn fs-btn-outline"><HomeRegular /> Back to Games</Link>
          </div>
        </div>
      </section>
    )
  }

  // ── PLAYING ──
  return (
    <section className={`fs-game ${feedback ? 'fs-flash-' + feedback : ''}`}>
      {/* Header */}
      <div className="fs-header glass">
        <div className="fs-score"><FlashRegular /> {score}</div>
        <div className="fs-country">{round?.country}</div>
        <div className="fs-lives">
          {[...Array(3)].map((_, i) => (
            <span key={i} className={`fs-heart ${i < lives ? 'fs-heart-alive' : 'fs-heart-dead'}`}>
              {i < lives ? '❤️' : '🖤'}
            </span>
          ))}
        </div>
      </div>

      {/* Streak */}
      {streak >= 3 && !revealAll && (
        <div className="fs-streak-badge">🔥 {streak} streak!</div>
      )}

      {/* Game area */}
      <div className="fs-arena">
        {round?.flags.map(flag => {
          // Determine flag visual state
          let flagClass = ''
          if (revealAll) {
            // After wrong answer: highlight correct flag green, wrong tapped flag red
            if (flag.correct) flagClass = 'fs-flag-correct fs-flag-revealed'
            else if (tappedFlags.has(flag.id)) flagClass = 'fs-flag-wrong'
            else flagClass = 'fs-flag-dimmed'
          } else if (tappedFlags.has(flag.id)) {
            flagClass = flag.correct ? 'fs-flag-correct' : 'fs-flag-wrong'
          }

          return (
            <button
              key={flag.id}
              className={`fs-flag ${flagClass}`}
              style={{
                left: `${flag.left}%`,
                animationDuration: `${round.speed}s`,
                animationPlayState: revealAll ? 'paused' : 'running',
              }}
              onPointerDown={(e) => { e.preventDefault(); handleTap(flag) }}
              onAnimationEnd={() => {
                if (!tappedFlags.has(flag.id) && flag.correct) handleMiss()
              }}
            >
              <img
                src={`https://flagcdn.com/w80/${flag.code}.png`}
                alt={flag.country}
                className="fs-flag-img"
                draggable={false}
              />
              {revealAll && flag.correct && (
                <span className="fs-flag-label">✅ {flag.country}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Correct answer callout */}
      {revealAll && round && (
        <div className="fs-answer-callout glass">
          The correct flag was <strong>{round.country}</strong>
        </div>
      )}

      {/* Round indicator */}
      <div className="fs-round-indicator glass-subtle">
        Round {roundNum}
      </div>
    </section>
  )
}
