import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckmarkCircleRegular, DismissCircleRegular } from '@fluentui/react-icons'
import { playCorrect, playWrong, playTick, vibrate } from '../engine/audio.js'
import { addXP } from '../engine/xp.js'
import { autoSubmitScore } from '../engine/leaderboard.js'
import { RewardsOverlay, useRewardSystem } from '../engine/rewards.jsx'
import ResultCard from './ResultCard.jsx'
import { getTriviaPacks } from '../lib/cms.js'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ── Reward collect button ─────────────────────────────────────────────────
function CollectButton({ points, stars, onCollect, collected }) {
  return (
    <button
      className={`collect-btn ${collected ? 'collected' : ''}`}
      onClick={!collected ? onCollect : undefined}
      disabled={collected}
    >
      {collected ? (
        <span className="collect-btn-done">✓ Collected!</span>
      ) : (
        <>
          <span className="collect-btn-stars">{'⭐'.repeat(stars)}</span>
          <span className="collect-btn-text">Tap to collect +{points} XP</span>
        </>
      )}
    </button>
  )
}

// ── COMPONENT ─────────────────────────────────────────────────────────────
export default function TriviaGame() {
  const navigate = useNavigate()
  const { popXP, celebrateCorrect, celebrateWrong, openChest, showStarBurst, rewardProps } = useRewardSystem()

  // CMS data
  const [PACKS, setPACKS] = useState({})
  const [PACK_LIST, setPACK_LIST] = useState([])
  const [cmsLoading, setCmsLoading] = useState(true)
  const [cmsError, setCmsError] = useState(null)

  function loadPacks() {
    setCmsLoading(true); setCmsError(null)
    getTriviaPacks().then(({ data, error }) => {
      if (error) { setCmsError(error); setCmsLoading(false); return }
      setPACKS(data)
      setPACK_LIST(Object.values(data))
      setCmsLoading(false)
    })
  }
  useEffect(() => { loadPacks() }, [])

  const [selectedPack, setSelectedPack] = useState(null)
  const [started, setStarted] = useState(false)
  const [questions, setQuestions] = useState([])
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [timer, setTimer] = useState(15)
  const [phase, setPhase] = useState('playing')
  const [results, setResults] = useState([])
  const [selectedOpt, setSelectedOpt] = useState(null)
  const [pendingXP, setPendingXP] = useState(0)
  const [pendingStars, setPendingStars] = useState(1)
  const [xpCollected, setXpCollected] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showQuitModal, setShowQuitModal] = useState(false)
  const [pendingNav, setPendingNav] = useState(null)
  const answerBtnRefs = useRef([])
  const intervalRef = useRef(null)

  function startGame() {
    const pool = selectedPack === 'all'
      ? shuffle([...PACK_LIST.flatMap(p => p.questions)]).slice(0, 10)
      : shuffle([...(PACKS[selectedPack]?.questions || [])]).slice(0, 10)
    setQuestions(pool)
    setIdx(0); setScore(0); setStreak(0); setPhase('playing'); setResults([])
    setStarted(true)
  }

  function handleTimeUp() {
    playWrong(); vibrate([30, 50, 30])
    celebrateWrong()
    setStreak(0)
    setPendingXP(0); setPendingStars(0); setXpCollected(true)
    setResults(prev => [...prev, { correct: false, pts: 0 }])
    setPhase('feedback')
  }

  // Ref to keep handleTimeUp current for the timer interval
  const handleTimeUpRef = useRef(handleTimeUp)
  useEffect(() => { handleTimeUpRef.current = handleTimeUp })

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!started || phase !== 'playing') { clearInterval(intervalRef.current); return }
    setTimer(15)
    intervalRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) { clearInterval(intervalRef.current); handleTimeUpRef.current(); return 0 }
        if (t <= 5) playTick()
        return t - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [idx, phase, started])
  /* eslint-enable react-hooks/set-state-in-effect */

  const q = questions[idx]

  function handleAnswer(optIdx) {
    if (phase !== 'playing') return
    setSelectedOpt(optIdx)
    clearInterval(intervalRef.current)
    const correct = optIdx === q.ans
    if (correct) {
      const pts = Math.max(10, 10 * timer)
      const newStreak = streak + 1
      const stars = newStreak >= 3 ? 3 : newStreak >= 2 ? 2 : 1
      playCorrect(); vibrate([50])
      setScore(s => s + pts)
      setStreak(newStreak)
      setPendingXP(pts)
      setPendingStars(stars)
      setXpCollected(false)
      setResults(prev => [...prev, { correct: true, pts }])
      celebrateCorrect(newStreak)
      if (newStreak > 0 && newStreak % 5 === 0) {
        setTimeout(() => openChest(newStreak * 10), 400)
      } else {
        showStarBurst(stars)
      }
    } else {
      playWrong(); vibrate([30, 50, 30])
      celebrateWrong()
      setStreak(0)
      setPendingXP(0); setPendingStars(0); setXpCollected(true)
      setResults(prev => [...prev, { correct: false, pts: 0 }])
    }
    setPhase('feedback')
  }

  function collectXP() {
    if (xpCollected || pendingXP === 0) return
    const btn = answerBtnRefs.current[selectedOpt]
    popXP(pendingXP, btn)
    addXP('GAME_CORRECT', pendingXP / 10)
    setXpCollected(true)
  }

  function next() {
    if (!xpCollected && pendingXP > 0) { collectXP(); return }
    if (idx + 1 >= questions.length) {
      const total = score
      addXP('GAME_WIN', total > 800 ? 200 : total > 400 ? 100 : 50)
      setPhase('done')
      autoSubmitScore({ gameType: 'trivia', score: total, maxScore: questions.length * 150, questionCount: questions.length })
    } else {
      setIdx(prev => prev + 1)
      setSelectedOpt(null)
      setPendingXP(0)
      setXpCollected(false)
      setPhase('playing')
    }
  }

  function handleQuit(dest) {
    setPendingNav(dest)
    if (phase !== 'done') setShowQuitModal(true)
    else navigate(dest)
  }

  // PACK SELECTOR
  // Loading / Error state
  if (cmsLoading) return <div className="game-lobby"><div className="lb-empty">Loading trivia packs...</div></div>
  if (cmsError) return (
    <div className="game-lobby">
      <button className="gh-back" onClick={() => navigate('/play')}>← Back</button>
      <div className="lb-empty" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ fontSize: '2rem' }}>⚠️</div>
        <p style={{ color: '#ef4444', fontSize: '0.9rem' }}>{cmsError}</p>
        <button onClick={loadPacks} style={{ padding: '0.5rem 1.2rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>Try Again</button>
      </div>
    </div>
  )

  if (!started) {
    return (
      <div className="game-lobby">
        <button className="gh-back" onClick={() => navigate('/play')}>← Back</button>
        <h2 className="lobby-title">🧠 Trivia Challenge</h2>
        <p className="lobby-sub">Choose a category to test your knowledge</p>
        <div className="lobby-packs">
          <button className={`lobby-pack-card ${selectedPack === 'all' ? 'active' : ''}`}
            style={{ '--pack-color': '#8b5cf6' }} onClick={() => setSelectedPack('all')}>
            <span className="lpc-icon">🎯</span>
            <span className="lpc-label">All Categories</span>
            <span className="lpc-desc">Mix of all packs — 10 random questions</span>
            <span className="lpc-count">{PACK_LIST.reduce((s, p) => s + p.questions.length, 0)} total questions</span>
          </button>
          {PACK_LIST.map(pack => (
            <button key={pack.id} className={`lobby-pack-card ${selectedPack === pack.id ? 'active' : ''}`}
              style={{ '--pack-color': pack.color }} onClick={() => setSelectedPack(pack.id)}>
              <span className="lpc-icon">{pack.label.split(' ')[0]}</span>
              <span className="lpc-label">{pack.label.split(' ').slice(1).join(' ')}</span>
              <span className="lpc-desc">{pack.desc}</span>
              <span className="lpc-count">{pack.questions.length} questions</span>
            </button>
          ))}
        </div>
        <button className="lobby-start-btn" disabled={!selectedPack} onClick={startGame}
          style={{ background: selectedPack ? (PACKS[selectedPack]?.color || '#8b5cf6') : undefined }}>
          Start Trivia →
        </button>
      </div>
    )
  }

  if (questions.length === 0) return null

  return (
    <section className="game-screen trivia-game">
      <RewardsOverlay {...rewardProps} />
      {showQuitModal && (
        <div className="quit-overlay" onClick={() => setShowQuitModal(false)}>
          <div className="quit-modal" onClick={e => e.stopPropagation()}>
            <h3>Quit Game?</h3>
            <p>Your progress will be lost.</p>
            <div className="quit-actions">
              <button className="btn btn-primary" onClick={() => setShowQuitModal(false)}>Keep Playing</button>
              <button className="btn btn-outline quit-confirm" onClick={() => navigate(pendingNav || '/')}>Quit</button>
            </div>
          </div>
        </div>
      )}
      <div className={`legend-sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="legend-section sidebar-nav">
          <button className="sidebar-nav-btn" onClick={() => handleQuit('/')}>Home</button>
          <button className="sidebar-nav-btn" onClick={() => { setStarted(false); setSelectedPack(null) }}>Change Pack</button>
          <button className="sidebar-nav-btn" onClick={startGame}>Restart</button>
          <button className="sidebar-nav-btn sidebar-quit" onClick={() => handleQuit('/')}>Quit</button>
        </div>
      </div>
      <button className={`legend-toggle ${menuOpen ? 'shifted' : ''}`} onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? '◀' : '☰'}
      </button>

      {/* HUD */}
      <div className="game-hud" style={{ borderImage: 'none', borderColor: 'var(--border)' }}>
        <div className="hud-left">
          <span className="hud-counter">🧠 {idx + 1}/{questions.length}</span>
        </div>
        <div className="hud-center">
          <div className="hud-progress">
            <div className="hud-progress-fill" style={{ width: `${((idx + (phase === 'feedback' ? 1 : 0)) / questions.length) * 100}%` }} />
          </div>
        </div>
        <div className="hud-right">
          {streak >= 2 && <span className="hud-streak">🔥{streak}</span>}
          <span className="hud-score">{score}</span>
        </div>
      </div>

      {/* BODY */}
      <div className="trivia-body">
        {phase === 'done' ? (
          <ResultCard
            score={score}
            maxScore={questions.length * 150}
            correctCount={results.filter(r => r.correct).length}
            totalQuestions={questions.length}
            pointsEarned={score}
            gameTitle="Trivia"
            gameEmoji="🧠"
            gameType="trivia"
            onPlayAgain={() => { setStarted(false); setSelectedPack(null) }}
          />
        ) : (
          <>
            <div className="trivia-timer-bar">
              <div className="trivia-timer-fill" style={{
                width: `${(timer / 15) * 100}%`,
                background: timer <= 5 ? '#ef4444' : '#0ea5e9'
              }} />
            </div>

            <div className={`trivia-q-card ${phase === 'feedback' ? 'answered' : ''}`}>
              <div className="trivia-q-num">Question {idx + 1}</div>
              <h2>{q.q}</h2>
            </div>

            <div className="trivia-options">
              {q.options.map((opt, i) => {
                let statusClass = ''
                if (phase === 'feedback') {
                  if (i === q.ans) statusClass = 'correct'
                  else if (i === selectedOpt) statusClass = 'wrong'
                  else statusClass = 'dimmed'
                }
                return (
                  <button key={i} ref={el => answerBtnRefs.current[i] = el}
                    className={`trivia-opt ${statusClass}`}
                    onClick={() => handleAnswer(i)}
                    disabled={phase !== 'playing'}>
                    <span className="trivia-opt-letter">{String.fromCharCode(65 + i)}</span>
                    <span className="trivia-opt-text">{opt}</span>
                    {statusClass === 'correct' && <CheckmarkCircleRegular className="trivia-icon-res" />}
                    {statusClass === 'wrong' && <DismissCircleRegular className="trivia-icon-res" />}
                  </button>
                )
              })}
            </div>

            {phase === 'feedback' && (
              <div className="trivia-feedback-bar">
                {selectedOpt === q.ans && !xpCollected && pendingXP > 0 ? (
                  <CollectButton
                    points={pendingXP}
                    stars={pendingStars}
                    onCollect={collectXP}
                    collected={xpCollected}
                  />
                ) : (
                  <p className="trivia-fact">💡 {q.fact}</p>
                )}
                <button className="btn btn-primary trivia-next-btn" onClick={next}
                  disabled={!xpCollected && pendingXP > 0}>
                  {!xpCollected && pendingXP > 0 ? '👆 Collect first!' : idx + 1 >= questions.length ? 'Finish Quiz ✓' : 'Next Question →'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
