import { useState, useCallback, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getFilteredQuestions, pickRandomQuestions } from '../data/questions.js'
import { haversineDistance, calculateScore, getScoreClass, formatDistance } from '../engine/scoring.js'
import MapView from './MapView.jsx'

// Reference points covering all 20 LGAs — labeled on map for guided guessing
const REFERENCE_DOTS = [
  // Lagos Island & surroundings (small LGAs, 1-2 pts)
  { lat: 6.4541, lng: 3.3947, name: 'Lagos Island' },
  { lat: 6.4281, lng: 3.4219, name: 'Victoria Island' },
  { lat: 6.4488, lng: 3.4328, name: 'Ikoyi' },
  // Mainland core (small LGAs)
  { lat: 6.4969, lng: 3.3469, name: 'Surulere' },
  { lat: 6.4969, lng: 3.3715, name: 'Yaba' },
  { lat: 6.5326, lng: 3.3488, name: 'Mushin' },
  { lat: 6.5392, lng: 3.3773, name: 'Shomolu' },
  { lat: 6.4579, lng: 3.3319, name: 'Ajegunle' },
  { lat: 6.4488, lng: 3.3586, name: 'Apapa' },
  { lat: 6.4558, lng: 3.2931, name: 'Festac Town' },
  // Northern mainland
  { lat: 6.6018, lng: 3.3515, name: 'Ikeja' },
  { lat: 6.5774, lng: 3.3212, name: 'Airport' },
  { lat: 6.6194, lng: 3.3281, name: 'Agege' },
  { lat: 6.6747, lng: 3.3115, name: 'Ifako-Ijaye' },
  { lat: 6.5562, lng: 3.3223, name: 'Oshodi' },
  { lat: 6.5555, lng: 3.3560, name: 'Isolo' },
  // Kosofe
  { lat: 6.5848, lng: 3.4048, name: 'Ketu' },
  { lat: 6.5888, lng: 3.3968, name: 'Mile 12' },
  // Eastern LGAs (large, 3-4 pts)
  { lat: 6.6194, lng: 3.5105, name: 'Ikorodu Town' },
  { lat: 6.6400, lng: 3.4800, name: 'Agric (Ikorodu)' },
  { lat: 6.5633, lng: 3.6153, name: 'Egbin' },
  { lat: 6.5854, lng: 3.9834, name: 'Epe Town' },
  { lat: 6.5500, lng: 3.8800, name: 'Ejirin (Epe)' },
  { lat: 6.5200, lng: 3.8500, name: 'Lekki Lagoon' },
  // Ibeju-Lekki (large LGA, 4 pts)
  { lat: 6.4650, lng: 3.6910, name: 'Ibeju-Lekki' },
  { lat: 6.4350, lng: 3.5500, name: 'Ajah' },
  { lat: 6.4528, lng: 3.9652, name: 'Lekki Free Zone' },
  { lat: 6.4250, lng: 3.7550, name: 'La Campagne' },
  // Lekki corridor
  { lat: 6.4698, lng: 3.6015, name: 'Lekki Phase 1' },
  { lat: 6.4393, lng: 3.5372, name: 'LCC' },
  // Alimosho (largest pop, 3 pts)
  { lat: 6.6105, lng: 3.2589, name: 'Egbeda' },
  { lat: 6.5800, lng: 3.2700, name: 'Idimu' },
  { lat: 6.5600, lng: 3.2450, name: 'Ikotun' },
  // Ojo (2 pts)
  { lat: 6.4756, lng: 3.1842, name: 'Ojo' },
  { lat: 6.4268, lng: 3.2537, name: 'Alaba Market' },
  // Badagry (large, 3 pts)
  { lat: 6.4318, lng: 2.8819, name: 'Badagry Town' },
  { lat: 6.4350, lng: 2.9000, name: 'Badagry Creek' },
  { lat: 6.3950, lng: 2.7500, name: 'Seme Border' },
  // Natural features
  { lat: 6.4900, lng: 3.4500, name: 'Lagos Lagoon' },
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

  const timerEnabled = config?.timer > 0

  useEffect(() => {
    if (!config) return
    const pool = getFilteredQuestions(config.categories, config.difficulty)
    const picked = pickRandomQuestions(pool, config.count)
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
    setUserPin(latlng)
  }, [phase])

  function handleTimeout() {
    if (!currentQ) return
    if (userPin) {
      confirmPin()
    } else {
      // No pin placed — score 0
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
    const score = calculateScore(dist)
    setTotalScore(prev => prev + score)
    setResults(prev => [...prev, { question: currentQ, userPin: { ...userPin }, distance: dist, score }])
    setPhase('feedback')
  }

  function nextQuestion() {
    if (currentIdx + 1 >= questions.length) {
      navigate('/results', {
        state: { results: [...results], totalScore, maxScore: questions.length * 100, questionCount: questions.length, config },
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

  return (
    <div className="game-screen">
      {/* Legend sidebar (hidden by default) */}
      <div className={`legend-sidebar ${legendOpen ? 'open' : ''}`}>
        <div className="legend-section">
          <h4>Map Layers</h4>
          <label className="layer-option">
            <input type="radio" name="base" checked={activeLayers.includes('topo')} onChange={() => setActiveLayers(['topo'])} /> Clean (No Labels)
          </label>
          <label className="layer-option">
            <input type="radio" name="base" checked={activeLayers.includes('terrain')} onChange={() => setActiveLayers(['terrain'])} /> Topographic
          </label>
          <label className="layer-option">
            <input type="radio" name="base" checked={activeLayers.includes('satellite')} onChange={() => setActiveLayers(['satellite'])} /> Satellite
          </label>
        </div>
        <div className="legend-section">
          <h4>Reference Points</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            Small dots on the map mark major areas (unlabeled). Use them as spatial references.
          </p>
          {REFERENCE_DOTS.map((d, i) => (
            <div className="legend-item" key={i}>
              <span className="legend-dot" style={{ background: 'var(--text-secondary)' }} />
              {d.name}
            </div>
          ))}
        </div>
        <div className="legend-section">
          <h4>Scoring Guide</h4>
          <div className="legend-item"><span className="legend-dot" style={{ background: 'var(--primary)' }} /> &lt; 1 km = 100 pts</div>
          <div className="legend-item"><span className="legend-dot" style={{ background: '#2D6A4F' }} /> 1-3 km = 80 pts</div>
          <div className="legend-item"><span className="legend-dot" style={{ background: 'var(--yellow)' }} /> 3-5 km = 60 pts</div>
          <div className="legend-item"><span className="legend-dot" style={{ background: 'var(--blue)' }} /> 5-10 km = 40 pts</div>
          <div className="legend-item"><span className="legend-dot" style={{ background: 'var(--red)' }} /> 10-20 km = 20 pts</div>
          <div className="legend-item"><span className="legend-dot" style={{ background: '#999' }} /> &gt; 20 km = 5 pts</div>
        </div>
      </div>
      <button className={`legend-toggle ${legendOpen ? 'shifted' : ''}`} onClick={() => setLegendOpen(!legendOpen)} title="Legend & Layers">
        {legendOpen ? '◀' : '▶'}
      </button>

      {/* Map area */}
      <div className="game-map-area">
        <MapView
          onMapClick={handleMapClick}
          userPin={userPin}
          correctPin={phase === 'feedback' ? { lat: currentQ.answer.lat, lng: currentQ.answer.lng } : null}
          activeLayers={activeLayers}
          referenceDots={REFERENCE_DOTS}
          distanceKm={lastResult?.distance}
        />
      </div>

      {/* Right panel */}
      <div className="game-right-panel">
        {/* Question */}
        <div className="question-panel">
          <div className="q-counter">Question {currentIdx + 1} of {questions.length}</div>
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
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>👆 Click the map to drop your pin</p>
              )}
            </div>
          )}
        </div>

        {/* Score */}
        <div className="score-tracker">
          <span className="score-label">Score</span>
          <span className="score-value">{totalScore}</span>
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
              {currentQ.hint && <span>{currentQ.hint} </span>}
              {currentQ.funFact && <span>{currentQ.funFact}</span>}
            </div>
            <div className="fb-coords">
              📐 Correct: {currentQ.answer.lat.toFixed(4)}°N, {currentQ.answer.lng.toFixed(4)}°E
              <br/>📌 Your pin: {lastResult.userPin.lat.toFixed(4)}°N, {lastResult.userPin.lng.toFixed(4)}°E
            </div>
            <button className="btn btn-primary btn-sm" onClick={nextQuestion} style={{ width: '100%' }}>
              {currentIdx + 1 >= questions.length ? 'See Results →' : 'Next Question →'}
            </button>
          </div>
        )}

        {/* Empty space filler when no feedback */}
        {phase === 'placing' && <div className="panel-spacer" />}
      </div>
    </div>
  )
}
