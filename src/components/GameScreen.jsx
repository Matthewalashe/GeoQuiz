import { useState, useCallback, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getFilteredQuestions, getQuestionsByRegion, pickRandomQuestions, REGIONS } from '../data/questions.js'
import { haversineDistance, calculateScore, getScoreClass, formatDistance } from '../engine/scoring.js'
import { playCorrect, playWrong, playPinDrop, playTick, playTimeUp, playStreak, vibrate } from '../engine/audio.js'
import { SponsoredBanner } from './SponsoredBanner.jsx'
import { trackAchievement } from './Achievements.jsx'
import MapView from './MapView.jsx'
import Onboarding from './Onboarding.jsx'

const LABELED_DOTS = [
  { lat: 6.4541, lng: 3.3947, name: 'Lagos Island' },
  { lat: 6.4281, lng: 3.4219, name: 'Victoria Island' },
  { lat: 6.4488, lng: 3.4328, name: 'Ikoyi' },
  { lat: 6.4969, lng: 3.3469, name: 'Surulere' },
  { lat: 6.4969, lng: 3.3715, name: 'Yaba' },
  { lat: 6.5326, lng: 3.3488, name: 'Mushin' },
  { lat: 6.5392, lng: 3.3773, name: 'Shomolu' },
  { lat: 6.4579, lng: 3.3319, name: 'Ajegunle' },
  { lat: 6.4488, lng: 3.3586, name: 'Apapa' },
  { lat: 6.4558, lng: 3.2931, name: 'Festac Town' },
  { lat: 6.6018, lng: 3.3515, name: 'Ikeja' },
  { lat: 6.6194, lng: 3.3281, name: 'Agege' },
  { lat: 6.6747, lng: 3.3115, name: 'Ifako-Ijaye' },
  { lat: 6.5562, lng: 3.3223, name: 'Oshodi' },
  { lat: 6.5848, lng: 3.4048, name: 'Ketu/Kosofe' },
  { lat: 6.6194, lng: 3.5105, name: 'Ikorodu' },
  { lat: 6.5854, lng: 3.9834, name: 'Epe' },
  { lat: 6.4650, lng: 3.6910, name: 'Ibeju-Lekki' },
  { lat: 6.6105, lng: 3.2589, name: 'Alimosho' },
  { lat: 6.4756, lng: 3.1842, name: 'Ojo' },
  { lat: 6.4318, lng: 2.8819, name: 'Badagry' },
]
const UNLABELED_DOTS = [
  { lat: 6.4350, lng: 3.5500 }, { lat: 6.4698, lng: 3.6015 },
  { lat: 6.4393, lng: 3.5372 }, { lat: 6.4330, lng: 3.4580 },
  { lat: 6.4528, lng: 3.9652 }, { lat: 6.4250, lng: 3.7550 },
  { lat: 6.4200, lng: 3.6350 }, { lat: 6.4314, lng: 4.0055 },
  { lat: 6.5500, lng: 3.8800 }, { lat: 6.5200, lng: 3.8500 },
  { lat: 6.5700, lng: 4.0200 }, { lat: 6.6400, lng: 3.4800 },
  { lat: 6.5633, lng: 3.6153 }, { lat: 6.6600, lng: 3.5400 },
  { lat: 6.4350, lng: 2.9000 }, { lat: 6.3950, lng: 2.7500 },
  { lat: 6.4100, lng: 2.8500 }, { lat: 6.4250, lng: 3.0500 },
  { lat: 6.5800, lng: 3.2700 }, { lat: 6.5600, lng: 3.2450 },
  { lat: 6.6300, lng: 3.2400 }, { lat: 6.4268, lng: 3.2537 },
  { lat: 6.4400, lng: 3.2100 }, { lat: 6.4900, lng: 3.1600 },
  { lat: 6.6900, lng: 3.2800 }, { lat: 6.6550, lng: 3.3300 },
  { lat: 6.6400, lng: 3.3200 }, { lat: 6.6050, lng: 3.3100 },
  { lat: 6.5774, lng: 3.3212 }, { lat: 6.6200, lng: 3.3600 },
  { lat: 6.5555, lng: 3.3560 }, { lat: 6.5888, lng: 3.3968 },
  { lat: 6.4900, lng: 3.4500 }, { lat: 6.5100, lng: 3.1000 },
]

export default function GameScreen() {
  const location = useLocation()
  const navigate = useNavigate()
  const config = location.state

  useEffect(() => {
    if (!config) navigate('/play', { replace: true })
  }, [config, navigate])

  const [questions, setQuestions] = useState([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [totalScore, setTotalScore] = useState(0)
  const [results, setResults] = useState([])
  const [phase, setPhase] = useState('loading')
  const [userPin, setUserPin] = useState(null)
  const [legendOpen, setLegendOpen] = useState(false)
  const [activeLayers, setActiveLayers] = useState(['topo'])
  const [timeLeft, setTimeLeft] = useState(config?.timer || 0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('geoquiz_onboarded'))
  const [showQuitModal, setShowQuitModal] = useState(false)
  const [loadProgress, setLoadProgress] = useState(0)
  const [pendingNav, setPendingNav] = useState(null)

  const timerEnabled = config?.timer > 0

  useEffect(() => {
    if (!config) return
    const pool = config.region
      ? getQuestionsByRegion(config.region, config.categories, config.difficulty)
      : getFilteredQuestions(config.categories, config.difficulty)
    const picked = pickRandomQuestions(pool, config.count, config.seed)
    setQuestions(picked)
    let progress = 0
    const loadInterval = setInterval(() => {
      progress += Math.random() * 5 + 3
      if (progress >= 100) {
        progress = 100; clearInterval(loadInterval)
        setTimeout(() => setPhase('placing'), 500)
      }
      setLoadProgress(Math.min(progress, 100))
    }, 180)
    return () => clearInterval(loadInterval)
  }, [config])

  useEffect(() => {
    if (phase === 'loading') return
    const handler = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [phase])

  useEffect(() => {
    if (!timerEnabled || phase !== 'placing') return
    setTimeLeft(config.timer)
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        if (prev <= 6) playTick()
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [currentIdx, phase === 'placing', timerEnabled])

  useEffect(() => {
    if (!timerEnabled || phase !== 'placing' || timeLeft > 0) return
    handleTimeout()
  }, [timeLeft])

  const currentQ = questions[currentIdx]

  const handleMapClick = useCallback((latlng) => {
    if (phase !== 'placing') return
    playPinDrop()
    setUserPin(latlng)
  }, [phase])

  function handleTimeout() {
    if (!currentQ) return
    playTimeUp(); vibrate([100, 50, 100])
    if (userPin) { confirmPin() }
    else {
      setStreak(0); playWrong(); vibrate([30, 50, 30])
      setResults(prev => [...prev, { question: currentQ, userPin: { lat: 0, lng: 0 }, distance: 999, score: 0, timedOut: true }])
      setPhase('feedback')
    }
  }

  function confirmPin() {
    if (!userPin || !currentQ) return
    const dist = haversineDistance(userPin.lat, userPin.lng, currentQ.answer.lat, currentQ.answer.lng)
    let tolerance = currentQ.toleranceRadius || 0
    if (!currentQ.toleranceRadius) {
      const ct = { lgas: 3, transport: 1.5, nature: 1.5, education: 0.8, tourism: 0.5, culture: 0.5, industry: 0.5, islands: 0.5, health: 0.3, markets: 0.3, landmarks: 0.2, history: 0.3 }
      tolerance = ct[currentQ.category] || 0.3
    }
    const score = calculateScore(dist, tolerance)
    setTotalScore(prev => prev + score)
    if (score >= 60) {
      playCorrect(); vibrate([50])
      setStreak(prev => { const n = prev + 1; if (n > bestStreak) setBestStreak(n); if (n >= 3) playStreak(); return n })
    } else { playWrong(); vibrate([30, 50, 30]); setStreak(0) }
    setResults(prev => [...prev, { question: currentQ, userPin: { ...userPin }, distance: dist, score }])
    setPhase('feedback')
  }

  function nextQuestion() {
    if (currentIdx + 1 >= questions.length) {
      const prev = JSON.parse(localStorage.getItem('geoquiz_sessions') || '[]')
      prev.push({ date: new Date().toISOString(), score: totalScore, max: questions.length * 100, streak: bestStreak })
      localStorage.setItem('geoquiz_sessions', JSON.stringify(prev.slice(-50)))
      const cs = JSON.parse(localStorage.getItem('geoquiz_cat_stats') || '{}')
      results.forEach(r => {
        const cat = r.question.category
        if (!cs[cat]) cs[cat] = { correct: 0, total: 0 }
        cs[cat].total++
        if (r.score >= 60) cs[cat].correct++
      })
      localStorage.setItem('geoquiz_cat_stats', JSON.stringify(cs))
      if (config?.region === 'abuja') trackAchievement('abujaGames', 1)
      if (config?.mode === 'blitz') trackAchievement('blitzHighPct', Math.round((totalScore / (questions.length * 100)) * 100))
      setPhase('finishing'); setLoadProgress(0)
      let progress = 0
      const fi = setInterval(() => {
        progress += Math.random() * 6 + 3
        if (progress >= 100) { progress = 100; clearInterval(fi); setTimeout(() => navigate('/results', { state: { results: [...results], totalScore, maxScore: questions.length * 100, questionCount: questions.length, config, bestStreak } }), 500) }
        setLoadProgress(Math.min(progress, 100))
      }, 160)
      return
    }
    setCurrentIdx(prev => prev + 1); setPhase('placing'); setUserPin(null)
  }

  if (!config || questions.length === 0) {
    return <div className="game-screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p>Loading...</p></div>
  }

  const lastResult = results[results.length - 1]

  function handleQuit(dest = '/') {
    setPendingNav(dest)
    if (results.length > 0) setShowQuitModal(true)
    else navigate(dest)
  }
  function confirmQuit() { setShowQuitModal(false); navigate(pendingNav || '/') }

  // ─── RENDER ───
  return (
    <div className="game-screen">
      {/* Loading overlay */}
      {(phase === 'loading' || phase === 'finishing') && (
        <div className="game-loading-overlay">
          <div className="game-loading-content">
            <div className="loading-icon">{phase === 'loading' ? '🗺️' : '🏆'}</div>
            <h2 className="loading-title">{phase === 'loading' ? 'Preparing Your Quiz' : 'Calculating Results'}</h2>
            <p className="loading-subtitle">
              {phase === 'finishing' ? `${results.length} questions · Score: ${totalScore}`
                : config?.mode === 'blitz' ? 'Blitz Mode — Race!'
                : config?.daily ? 'Daily Challenge'
                : `${config?.count || 10}Q · ${config?.region === 'abuja' ? 'Abuja' : 'Lagos'}`}
            </p>
            <div className="neon-bar-wrap"><div className="neon-bar" style={{ width: `${loadProgress}%` }} /></div>
          </div>
        </div>
      )}

      {/* Quit modal */}
      {showQuitModal && (
        <div className="quit-overlay" onClick={() => setShowQuitModal(false)}>
          <div className="quit-modal" onClick={e => e.stopPropagation()}>
            <h3>Quit Game?</h3>
            <p>{results.length}/{questions.length} answered · {totalScore} pts</p>
            <div className="quit-actions">
              <button className="btn btn-primary" onClick={() => setShowQuitModal(false)}>Keep Playing</button>
              <button className="btn btn-outline quit-confirm" onClick={confirmQuit}>Quit</button>
            </div>
          </div>
        </div>
      )}

      {showOnboarding && <Onboarding onComplete={() => setShowOnboarding(false)} />}

      {/* Menu sidebar */}
      <div className={`legend-sidebar ${legendOpen ? 'open' : ''}`}>
        <div className="legend-section sidebar-nav">
          <button className="sidebar-nav-btn" onClick={() => handleQuit('/')}>Home</button>
          <button className="sidebar-nav-btn" onClick={() => handleQuit('/play')}>New Quiz</button>
          <button className="sidebar-nav-btn sidebar-quit" onClick={() => handleQuit('/')}>Quit</button>
        </div>
        <div className="legend-section">
          <h4>Map Style</h4>
          {['topo', 'light', 'terrain', 'satellite'].map(l => (
            <label className="layer-option" key={l}>
              <input type="radio" name="base" checked={activeLayers.includes(l)} onChange={() => setActiveLayers([l])} />
              {l === 'topo' ? 'Topographic' : l === 'light' ? 'Light' : l === 'terrain' ? 'Terrain' : 'Satellite'}
            </label>
          ))}
        </div>
      </div>
      <button className={`legend-toggle ${legendOpen ? 'shifted' : ''}`} onClick={() => setLegendOpen(!legendOpen)}>
        {legendOpen ? '◀' : '☰'}
      </button>

      {/* Full-screen map */}
      <div className="game-map-area">
        <MapView
          onMapClick={handleMapClick} userPin={userPin}
          correctPin={phase === 'feedback' ? { lat: currentQ.answer.lat, lng: currentQ.answer.lng } : null}
          activeLayers={activeLayers}
          referenceDots={config?.region === 'abuja' ? [] : LABELED_DOTS}
          unlabeledDots={config?.region === 'abuja' ? [] : UNLABELED_DOTS}
          distanceKm={lastResult?.distance}
          mapCenter={config?.region ? (REGIONS.find(r => r.id === config.region)?.center) : undefined}
          mapZoom={config?.region ? (REGIONS.find(r => r.id === config.region)?.zoom) : undefined}
        />
      </div>

      {/* ── Floating HUD (top) ── */}
      <div className="game-hud">
        <div className="hud-left">
          <span className="hud-counter">Q{currentIdx + 1}<span className="hud-dim">/{questions.length}</span></span>
        </div>
        <div className="hud-center">
          <div className="hud-progress"><div className="hud-progress-fill" style={{ width: `${((currentIdx + (phase === 'feedback' ? 1 : 0)) / questions.length) * 100}%` }} /></div>
        </div>
        <div className="hud-right">
          <span className="hud-score">{totalScore}</span>
          {streak >= 3 && <span className="hud-streak">🔥{streak}</span>}
        </div>
      </div>

      {/* Timer ring */}
      {timerEnabled && phase === 'placing' && (
        <div className="game-timer-float">
          <div className="timer-ring" style={{
            background: `conic-gradient(${timeLeft <= 10 ? '#ef4444' : '#00ff88'} ${(timeLeft / config.timer) * 360}deg, rgba(0,0,0,0.3) 0deg)`
          }}>
            <span className="timer-num">{timeLeft}</span>
          </div>
        </div>
      )}

      {/* ── Floating question card (bottom) ── */}
      <div className={`game-q-float ${phase === 'feedback' ? 'expanded' : ''}`}>
        {phase === 'placing' && (
          <>
            <div className="gqf-cat">{currentQ.categoryLabel}</div>
            <div className="gqf-text">{currentQ.question}</div>
            {userPin ? (
              <button className="gqf-confirm" onClick={confirmPin}>
                Confirm Pin ✓
              </button>
            ) : (
              <div className="gqf-hint">Tap the map to place your pin</div>
            )}
          </>
        )}
        {phase === 'feedback' && lastResult && (
          <div className="gqf-fb">
            <div className="gqf-fb-top">
              <span className={`gqf-fb-score ${getScoreClass(lastResult.score)}`}>+{lastResult.score}</span>
              <span className="gqf-fb-dist">{formatDistance(lastResult.distance)}</span>
            </div>
            <div className="gqf-fb-name">{currentQ.answer.name}</div>
            <div className="gqf-fb-desc">{currentQ.answer.description}</div>
            {currentQ.funFact && <div className="gqf-fb-fact">{currentQ.funFact}</div>}
            <SponsoredBanner questionId={currentQ.id} />
            <button className="gqf-next" onClick={nextQuestion}>
              {currentIdx + 1 >= questions.length ? 'See Results →' : 'Next →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
