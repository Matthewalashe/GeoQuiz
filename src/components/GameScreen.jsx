import { useState, useCallback, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getFilteredQuestions, getQuestionsByRegion, pickRandomQuestions, REGIONS } from '../data/questions.js'
import { haversineDistance, calculateScore, getScoreClass, formatDistance } from '../engine/scoring.js'
import { playCorrect, playWrong, playPinDrop, playTick, playTimeUp, playStreak, vibrate } from '../engine/audio.js'
import { SponsoredBanner } from './SponsoredBanner.jsx'
import { trackAchievement } from './Achievements.jsx'
import MapView from './MapView.jsx'
import Onboarding from './Onboarding.jsx'

// LABELED reference points — LGA names only (these are NOT quiz answers)
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
// UNLABELED spatial reference dots — guides without giving away answers
const UNLABELED_DOTS = [
  // Eti-Osa (large, VI to Ajah)
  { lat: 6.4350, lng: 3.5500 }, // Ajah
  { lat: 6.4698, lng: 3.6015 }, // Lekki Phase 1
  { lat: 6.4393, lng: 3.5372 }, // LCC area
  { lat: 6.4330, lng: 3.4580 }, // Toll gate area
  // Ibeju-Lekki (very large, 4 pts)
  { lat: 6.4528, lng: 3.9652 }, // Free Zone
  { lat: 6.4250, lng: 3.7550 }, // La Campagne area
  { lat: 6.4200, lng: 3.6350 }, // Eleko area
  { lat: 6.4314, lng: 4.0055 }, // Dangote area
  // Epe (large, 3 pts)
  { lat: 6.5500, lng: 3.8800 }, // Ejirin
  { lat: 6.5200, lng: 3.8500 }, // Lekki Lagoon
  { lat: 6.5700, lng: 4.0200 }, // Eastern Epe
  // Ikorodu (large, 3 pts)
  { lat: 6.6400, lng: 3.4800 }, // Agric
  { lat: 6.5633, lng: 3.6153 }, // Egbin area
  { lat: 6.6600, lng: 3.5400 }, // Northern Ikorodu
  // Badagry (very large, 4 pts)
  { lat: 6.4350, lng: 2.9000 }, // Creek area
  { lat: 6.3950, lng: 2.7500 }, // Seme border
  { lat: 6.4100, lng: 2.8500 }, // Mangroves
  { lat: 6.4250, lng: 3.0500 }, // Eastern Badagry
  // Alimosho (largest pop, 3 pts)
  { lat: 6.5800, lng: 3.2700 }, // Idimu
  { lat: 6.5600, lng: 3.2450 }, // Ikotun
  { lat: 6.6300, lng: 3.2400 }, // Ipaja
  // Ojo (3 pts)
  { lat: 6.4268, lng: 3.2537 }, // Alaba area
  { lat: 6.4400, lng: 3.2100 }, // Trade Fair
  { lat: 6.4900, lng: 3.1600 }, // Iba area
  // Ifako-Ijaye (2 pts)
  { lat: 6.6900, lng: 3.2800 }, // Alagbado
  { lat: 6.6550, lng: 3.3300 }, // Akute road
  // Agege (2 pts)
  { lat: 6.6400, lng: 3.3200 }, // Pen Cinema area
  { lat: 6.6050, lng: 3.3100 }, // Dopemu
  // Ikeja (2 pts)
  { lat: 6.5774, lng: 3.3212 }, // Airport
  { lat: 6.6200, lng: 3.3600 }, // Allen area
  // Mainland misc
  { lat: 6.5555, lng: 3.3560 }, // Isolo
  { lat: 6.5888, lng: 3.3968 }, // Mile 12
  // Natural features
  { lat: 6.4900, lng: 3.4500 }, // Lagos Lagoon
  { lat: 6.5100, lng: 3.1000 }, // Ologe Lagoon
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
  const [phase, setPhase] = useState('placing')
  const [userPin, setUserPin] = useState(null)
  const [legendOpen, setLegendOpen] = useState(false)
  const [activeLayers, setActiveLayers] = useState(['topo'])
  const [timeLeft, setTimeLeft] = useState(config?.timer || 0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('geoquiz_onboarded'))

  const timerEnabled = config?.timer > 0

  useEffect(() => {
    if (!config) return
    const pool = config.region
      ? getQuestionsByRegion(config.region, config.categories, config.difficulty)
      : getFilteredQuestions(config.categories, config.difficulty)
    const picked = pickRandomQuestions(pool, config.count, config.seed)
    setQuestions(picked)
  }, [config])

  // Timer countdown
  useEffect(() => {
    if (!timerEnabled || phase !== 'placing') return
    setTimeLeft(config.timer)
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        if (prev <= 6) playTick() // tick last 5 seconds
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [currentIdx, phase === 'placing', timerEnabled])

  // Auto-submit when timer hits 0
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
    if (userPin) {
      confirmPin()
    } else {
      // No pin placed — score 0
      setStreak(0)
      playWrong(); vibrate([30, 50, 30])
      setResults(prev => [...prev, {
        question: currentQ,
        userPin: { lat: 0, lng: 0 },
        distance: 999,
        score: 0,
        timedOut: true,
      }])
      setPhase('feedback')
    }
  }

  function confirmPin() {
    if (!userPin || !currentQ) return
    const dist = haversineDistance(userPin.lat, userPin.lng, currentQ.answer.lat, currentQ.answer.lng)
    // Tolerance: how far (km) the pin can be and still count as "on target"
    // Per-question override > category default
    let tolerance = currentQ.toleranceRadius || 0
    if (!currentQ.toleranceRadius) {
      const catTolerances = {
        lgas: 3,          // LGAs are large areas
        transport: 1.5,   // bridges, roads span distance
        nature: 1.5,      // lagoons, rivers, mangroves
        education: 0.8,   // university campuses are large
        tourism: 0.5,     // parks, resorts have area
        culture: 0.5,     // heritage sites, galleries
        industry: 0.5,    // industrial zones
        islands: 0.5,     // beaches, waterfront areas
        health: 0.3,      // hospitals, specific buildings
        markets: 0.3,     // markets have boundaries
        landmarks: 0.2,   // specific monuments
        history: 0.3,     // historical sites
      }
      tolerance = catTolerances[currentQ.category] || 0.3
    }
    const score = calculateScore(dist, tolerance)
    setTotalScore(prev => prev + score)
    // Streak: 60+ points keeps streak alive
    if (score >= 60) {
      playCorrect(); vibrate([50])
      setStreak(prev => { const n = prev + 1; if (n > bestStreak) setBestStreak(n); if (n >= 3) playStreak(); return n })
    } else {
      playWrong(); vibrate([30, 50, 30])
      setStreak(0)
    }
    setResults(prev => [...prev, { question: currentQ, userPin: { ...userPin }, distance: dist, score }])
    setPhase('feedback')
  }

  function nextQuestion() {
    if (currentIdx + 1 >= questions.length) {
      // Save session stats
      const prev = JSON.parse(localStorage.getItem('geoquiz_sessions') || '[]')
      prev.push({ date: new Date().toISOString(), score: totalScore, max: questions.length * 100, streak: bestStreak })
      localStorage.setItem('geoquiz_sessions', JSON.stringify(prev.slice(-50)))
      // Save per-category stats for Dashboard
      const cs = JSON.parse(localStorage.getItem('geoquiz_cat_stats') || '{}')
      results.forEach(r => {
        const cat = r.question.category
        if (!cs[cat]) cs[cat] = { correct: 0, total: 0 }
        cs[cat].total++
        if (r.score >= 60) cs[cat].correct++
      })
      localStorage.setItem('geoquiz_cat_stats', JSON.stringify(cs))
      // Track achievements
      if (config?.region === 'abuja') trackAchievement('abujaGames', 1)
      if (config?.mode === 'blitz') {
        const pct = Math.round((totalScore / (questions.length * 100)) * 100)
        trackAchievement('blitzHighPct', pct)
      }
      navigate('/results', {
        state: { results: [...results], totalScore, maxScore: questions.length * 100, questionCount: questions.length, config, bestStreak },
      })
      return
    }
    setCurrentIdx(prev => prev + 1)
    setPhase('placing')
    setUserPin(null)
  }

  if (!config || questions.length === 0) {
    return <div className="game-screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p>Loading questions...</p></div>
  }

  const lastResult = results[results.length - 1]

  // Tolerance for polygon/line features
  function getTolerance(q) {
    if (q.category === 'lgas') return 2;        // LGAs are large areas
    if (q.category === 'transport') return 1;   // Roads/bridges are lines
    if (q.category === 'nature') return 1.5;    // Rivers, lagoons, coastlines
    if (q.category === 'health' && q.id.includes('he-07')) return 1; // expressway
    return 0;
  }

  function handleQuit() {
    if (results.length > 0) {
      const ok = window.confirm(`You've answered ${results.length}/${questions.length} questions (Score: ${totalScore}). Are you sure you want to quit?\n\nYour progress will be lost.`)
      if (!ok) return
    }
    navigate('/')
  }

  return (
    <div className="game-screen">
      {showOnboarding && <Onboarding onComplete={() => setShowOnboarding(false)} />}
      {/* Legend sidebar (hidden by default) */}
      <div className={`legend-sidebar ${legendOpen ? 'open' : ''}`}>
        {/* Navigation */}
        <div className="legend-section sidebar-nav">
          <button className="sidebar-nav-btn" onClick={() => navigate('/')}>🏠 Home</button>
          <button className="sidebar-nav-btn" onClick={() => navigate('/play')}>⚙️ New Quiz</button>
          <button className="sidebar-nav-btn sidebar-quit" onClick={handleQuit}>✕ Quit Game</button>
        </div>

        <div className="legend-section">
          <h4>Base Map</h4>
          <label className="layer-option">
            <input type="radio" name="base" checked={activeLayers.includes('topo')} onChange={() => setActiveLayers(['topo'])} /> Clean Topographic
          </label>
          <label className="layer-option">
            <input type="radio" name="base" checked={activeLayers.includes('light')} onChange={() => setActiveLayers(['light'])} /> Minimal Light
          </label>
          <label className="layer-option">
            <input type="radio" name="base" checked={activeLayers.includes('terrain')} onChange={() => setActiveLayers(['terrain'])} /> Terrain (with labels)
          </label>
          <label className="layer-option">
            <input type="radio" name="base" checked={activeLayers.includes('satellite')} onChange={() => setActiveLayers(['satellite'])} /> Satellite
          </label>
        </div>
        <div className="legend-section">
          <h4>LGA Reference Points</h4>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Labeled dots mark LGAs. Unlabeled dots are spatial guides.
          </p>
          {LABELED_DOTS.map((d, i) => (
            <div className="legend-item" key={i}>
              <span className="legend-dot" style={{ background: 'var(--text-secondary)' }} />
              {d.name}
            </div>
          ))}
        </div>
        <div className="legend-section">
          <h4>Scoring</h4>
          <div className="legend-item"><span className="legend-dot" style={{ background: 'var(--primary)' }} /> &lt; 1 km = 100</div>
          <div className="legend-item"><span className="legend-dot" style={{ background: '#2D6A4F' }} /> 1-3 km = 80</div>
          <div className="legend-item"><span className="legend-dot" style={{ background: 'var(--yellow)' }} /> 3-5 km = 60</div>
          <div className="legend-item"><span className="legend-dot" style={{ background: 'var(--blue)' }} /> 5-10 km = 40</div>
          <div className="legend-item"><span className="legend-dot" style={{ background: 'var(--red)' }} /> 10-20 km = 20</div>
          <div className="legend-item"><span className="legend-dot" style={{ background: '#999' }} /> &gt; 20 km = 5</div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            💡 LGAs, roads & water features have extra tolerance.
          </p>
        </div>
      </div>
      <button className={`legend-toggle ${legendOpen ? 'shifted' : ''}`} onClick={() => setLegendOpen(!legendOpen)} title="Menu">
        {legendOpen ? '◀' : '☰'}
      </button>

      {/* Map area */}
      <div className="game-map-area">
        <MapView
          onMapClick={handleMapClick}
          userPin={userPin}
          correctPin={phase === 'feedback' ? { lat: currentQ.answer.lat, lng: currentQ.answer.lng } : null}
          activeLayers={activeLayers}
          referenceDots={config?.region === 'abuja' ? [] : LABELED_DOTS}
          unlabeledDots={config?.region === 'abuja' ? [] : UNLABELED_DOTS}
          distanceKm={lastResult?.distance}
          mapCenter={config?.region ? (REGIONS.find(r => r.id === config.region)?.center) : undefined}
          mapZoom={config?.region ? (REGIONS.find(r => r.id === config.region)?.zoom) : undefined}
        />
      </div>

      {/* Right panel */}
      <div className="game-right-panel">
        {/* Rainbow progress bar */}
        <div className="game-progress-wrap">
          <div className="game-progress-fill" style={{ width: `${((currentIdx + (phase === 'feedback' ? 1 : 0)) / questions.length) * 100}%` }} />
        </div>
        {/* Question */}
        <div className="question-panel">
          <div className="q-counter">Q{currentIdx + 1}/{questions.length}</div>
          {timerEnabled && phase === 'placing' && (
            <div className="timer-bar-wrap">
              <div className="timer-bar" style={{
                width: `${(timeLeft / config.timer) * 100}%`,
                background: timeLeft <= 10 ? 'var(--red)' : 'var(--primary)',
              }} />
              <span className="timer-text" style={{ color: timeLeft <= 10 ? 'var(--red)' : 'var(--text-secondary)' }}>
                ⏱️ {timeLeft}s
              </span>
            </div>
          )}
          <div className="q-category">{currentQ.categoryLabel}</div>
          <h3>{currentQ.question}</h3>
          {phase === 'placing' && (
            <div className="q-actions">
              {userPin ? (
                <button className="btn btn-primary btn-sm" onClick={confirmPin}>Confirm Pin ✓</button>
              ) : (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>👆 Tap the map to drop your pin</p>
              )}
            </div>
          )}
        </div>

        {/* Score + Streak */}
        <div className="score-tracker">
          <span className="score-label">Score</span>
          <span className="score-value">{totalScore}</span>
          {streak >= 3 && (
            <span className="streak-badge">🔥 {streak} streak!</span>
          )}
        </div>

        {/* Feedback (after pin confirmed) */}
        {phase === 'feedback' && lastResult && (
          <div className="feedback-panel">
            <div className="fb-score-row">
              <span className={`fb-score ${getScoreClass(lastResult.score)}`}>+{lastResult.score}</span>
              <span className="fb-distance">{formatDistance(lastResult.distance)} away</span>
            </div>
            <div className="fb-name">📍 {currentQ.answer.name}</div>
            <div className="fb-desc">{currentQ.answer.description}</div>
            <div className="fb-fact">
              {currentQ.funFact && <span>{currentQ.funFact}</span>}
            </div>
            <SponsoredBanner questionId={currentQ.id} />
            <button className="btn btn-primary btn-sm" onClick={nextQuestion} style={{ width: '100%' }}>
              {currentIdx + 1 >= questions.length ? 'See Results →' : 'Next →'}
            </button>
          </div>
        )}

        {phase === 'placing' && <div className="panel-spacer" />}
      </div>
    </div>
  )
}
