import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { FlagRegular, HeartRegular, HomeRegular, PlayRegular, FlashRegular, TrophyRegular } from '@fluentui/react-icons'
import { playCorrect, playWrong, playCelebration, vibrateTap, vibrateSuccess } from '../engine/audio.js'

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
  const [roundDone, setRoundDone] = useState(false)
  const feedbackTimer = useRef(null)
  const roundTimer = useRef(null)

  // Start game
  function startGame() {
    setPhase('playing')
    setScore(0)
    setLives(3)
    setStreak(0)
    setBestStreak(0)
    setRoundNum(0)
    setTappedFlags(new Set())
    setRoundDone(false)
    nextRound(0)
  }

  function nextRound(currentScore) {
    const r = generateRound(currentScore)
    setRound(r)
    setRoundNum(n => n + 1)
    setTappedFlags(new Set())
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
      try { playWrong(); vibrateTap() } catch {}

      clearTimeout(feedbackTimer.current)
      feedbackTimer.current = setTimeout(() => {
        setFeedback(null)
        if (newLives <= 0) {
          setPhase('gameover')
          try { if (score > 2000) playCelebration() } catch {}
        } else {
          nextRound(score)
        }
      }, 800)
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
    try { playWrong() } catch {}

    clearTimeout(feedbackTimer.current)
    feedbackTimer.current = setTimeout(() => {
      setFeedback(null)
      if (newLives <= 0) {
        setPhase('gameover')
      } else {
        nextRound(score)
      }
    }, 800)
  }, [phase, roundDone, lives, score]) // eslint-disable-line

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
      {streak >= 3 && (
        <div className="fs-streak-badge">🔥 {streak} streak!</div>
      )}

      {/* Game area */}
      <div className="fs-arena">
        {round?.flags.map(flag => (
          <button
            key={flag.id}
            className={`fs-flag ${tappedFlags.has(flag.id) ? (flag.correct ? 'fs-flag-correct' : 'fs-flag-wrong') : ''}`}
            style={{
              left: `${flag.left}%`,
              animationDuration: `${round.speed}s`,
            }}
            onClick={() => handleTap(flag)}
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
          </button>
        ))}
      </div>

      {/* Round indicator */}
      <div className="fs-round-indicator glass-subtle">
        Round {roundNum}
      </div>
    </section>
  )
}
