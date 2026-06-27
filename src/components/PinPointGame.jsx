import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import { TargetRegular, TimerRegular, ArrowRightRegular, HomeRegular, PlayRegular, TrophyRegular, FlashRegular } from '@fluentui/react-icons'
import { playCorrect, playWrong, playCelebration, vibrateTap, vibrateSuccess } from '../engine/audio.js'
import { addXP, XP_REWARDS } from '../engine/xp.js'
import { calculateGameReward, addCoins } from '../engine/coinEconomy.js'
import { autoSubmitScore } from '../engine/leaderboard.js'

// ── PLACES ──
const PLACES = [
  { name: 'Aso Rock', lat: 9.0579, lng: 7.4951 },
  { name: 'Third Mainland Bridge', lat: 6.4698, lng: 3.3982 },
  { name: 'Zuma Rock', lat: 9.1147, lng: 7.2384 },
  { name: 'Lekki Conservation Centre', lat: 6.4408, lng: 3.5346 },
  { name: 'Nike Art Gallery', lat: 6.4510, lng: 3.4791 },
  { name: 'National Theatre Lagos', lat: 6.4558, lng: 3.3901 },
  { name: 'Tafawa Balewa Square', lat: 6.4485, lng: 3.3979 },
  { name: 'Obudu Mountain Resort', lat: 6.3779, lng: 9.3595 },
  { name: 'Yankari Game Reserve', lat: 9.7500, lng: 10.5000 },
  { name: 'Osun-Osogbo Sacred Grove', lat: 7.7561, lng: 4.5567 },
  { name: 'Badagry Heritage Museum', lat: 6.4192, lng: 2.8806 },
  { name: 'Ogbunike Caves', lat: 6.1831, lng: 6.8564 },
  { name: 'Idanre Hills', lat: 7.1108, lng: 5.1154 },
  { name: 'Tinubu Square', lat: 6.4531, lng: 3.3904 },
  { name: 'University of Ibadan', lat: 7.4416, lng: 3.8989 },
  { name: 'Kainji Dam', lat: 9.8581, lng: 4.6328 },
  { name: 'Jos Wildlife Park', lat: 9.8500, lng: 8.8800 },
  { name: 'Millennium Park Abuja', lat: 9.0427, lng: 7.4689 },
  { name: 'Bar Beach Lagos', lat: 6.4210, lng: 3.4108 },
  { name: 'Calabar Museum', lat: 4.9517, lng: 8.3217 },
  { name: 'Benin City Walls', lat: 6.3350, lng: 5.6270 },
  { name: 'Ikogosi Warm Springs', lat: 7.5897, lng: 4.9795 },
  { name: 'Gurara Falls', lat: 9.3328, lng: 7.1117 },
  { name: 'Erin Ijesha Waterfall', lat: 7.5011, lng: 4.8386 },
  { name: 'Kajuru Castle', lat: 10.3167, lng: 7.7000 },
  { name: 'Olumo Rock', lat: 7.1022, lng: 3.3456 },
  { name: 'Freedom Park Lagos', lat: 6.4500, lng: 3.3950 },
  { name: 'Makoko Floating Village', lat: 6.4969, lng: 3.3882 },
  { name: 'Abuja National Mosque', lat: 9.0578, lng: 7.4891 },
  { name: 'Lekki-Ikoyi Link Bridge', lat: 6.4471, lng: 3.4485 },
]

// ── HELPERS ──
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function scoreFromDistance(km) {
  if (km < 5) return 1000
  if (km < 20) return 800
  if (km < 50) return 600
  if (km < 100) return 400
  if (km < 200) return 200
  return 50
}

function gradeFromTotal(score, max) {
  const pct = (score / max) * 100
  if (pct >= 90) return { label: 'S — Master Navigator', color: '#ffd700' }
  if (pct >= 75) return { label: 'A — Expert', color: '#00c853' }
  if (pct >= 60) return { label: 'B — Skilled', color: '#0ea5e9' }
  if (pct >= 40) return { label: 'C — Learning', color: '#f59e0b' }
  return { label: 'D — Keep Exploring', color: '#ef4444' }
}

function formatDist(km) {
  if (km < 1) return `${Math.round(km * 1000)}m`
  return `${km.toFixed(1)}km`
}

// ── ICONS ──
const playerIcon = L.divIcon({ className: 'pp-marker pp-marker-player', html: '📍', iconSize: [28, 28], iconAnchor: [14, 28] })
const targetIcon = L.divIcon({ className: 'pp-marker pp-marker-target', html: '✅', iconSize: [28, 28], iconAnchor: [14, 28] })

// ── MAP CLICK HANDLER ──
function MapClickHandler({ onMapClick, disabled }) {
  useMapEvents({ click: (e) => { if (!disabled) onMapClick(e.latlng) } })
  return null
}

function FitBounds({ bounds }) {
  const map = useMap()
  useEffect(() => {
    if (bounds) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 })
  }, [bounds, map])
  return null
}

// ═══════════════════════════════════════════
// PINPOINT GAME
// ═══════════════════════════════════════════
export default function PinPointGame() {
  const navigate = useNavigate()
  const location = useLocation()
  const levelConfig = location.state?.levelConfig

  const TOTAL = levelConfig?.questionCount || 10
  const TIME_LIMIT = levelConfig?.timeLimit || 30

  const questions = useMemo(() => {
    const shuffled = [...PLACES].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, TOTAL)
  }, [TOTAL])

  const [qIndex, setQIndex] = useState(0)
  const [playerPin, setPlayerPin] = useState(null)
  const [revealed, setRevealed] = useState(false)
  const [results, setResults] = useState([])
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT)
  const [phase, setPhase] = useState('playing') // playing | end
  const [feedback, setFeedback] = useState(null) // null | 'perfect' | 'close' | 'far'
  const [xpEarned, setXpEarned] = useState(0)
  const [coinsEarned, setCoinsEarned] = useState(0)
  const timerRef = useRef(null)

  // Lock body scroll to prevent mobile viewport overflow
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const current = questions[qIndex]
  const totalScore = results.reduce((s, r) => s + r.score, 0)
  const maxScore = TOTAL * 1000

  // Timer
  useEffect(() => {
    if (phase !== 'playing' || revealed) return
    setTimeLeft(TIME_LIMIT)
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          // Time's up — auto-reveal with max distance
          handleReveal(null)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [qIndex, phase, revealed]) // eslint-disable-line

  function handleMapClick(latlng) {
    if (revealed || phase !== 'playing') return
    setPlayerPin(latlng)
    vibrateTap()
  }

  function handleReveal(pin) {
    clearInterval(timerRef.current)
    const usedPin = pin || playerPin
    setRevealed(true)

    if (!usedPin) {
      // No pin placed — 0 score
      const result = { place: current, distance: 9999, score: 0, playerLat: 0, playerLng: 0 }
      setResults(prev => [...prev, result])
      setFeedback('far')
      try { playWrong() } catch {}
      return
    }

    const dist = haversine(usedPin.lat, usedPin.lng, current.lat, current.lng)
    const score = scoreFromDistance(dist)
    const result = { place: current, distance: dist, score, playerLat: usedPin.lat, playerLng: usedPin.lng }
    setResults(prev => [...prev, result])

    if (score >= 800) {
      setFeedback('perfect')
      try { playCorrect(); vibrateSuccess() } catch {}
    } else if (score >= 400) {
      setFeedback('close')
      try { playCorrect() } catch {}
    } else {
      setFeedback('far')
      try { playWrong() } catch {}
    }
  }

  function handleNext() {
    if (qIndex + 1 >= TOTAL) {
      setPhase('end')
      // Award XP + coins + leaderboard
      const finalResults = [...results] // results already includes last answer
      const finalTotal = finalResults.reduce((s, r) => s + r.score, 0)
      const pctForReward = Math.round((finalTotal / maxScore) * 100)
      try {
        const xp = addXP('GAME_WIN')
        setXpEarned(XP_REWARDS.GAME_WIN)
        const coins = calculateGameReward(pctForReward)
        if (coins > 0) { addCoins(coins, 'PinPoint game reward'); setCoinsEarned(coins) }
        autoSubmitScore({ gameType: 'pinpoint', score: finalTotal, maxScore })
      } catch {}
      try { if (finalTotal / maxScore >= 0.7) playCelebration() } catch {}
      return
    }
    setQIndex(q => q + 1)
    setPlayerPin(null)
    setRevealed(false)
    setFeedback(null)
  }

  const bounds = revealed && playerPin
    ? L.latLngBounds([
        [playerPin.lat, playerPin.lng],
        [current.lat, current.lng]
      ])
    : null

  // ── END SCREEN ──
  if (phase === 'end') {
    const grade = gradeFromTotal(totalScore, maxScore)
    const pct = Math.round((totalScore / maxScore) * 100)
    return (
      <section className="pp-end">
        <div className="pp-end-hero glass glass-glow">
          <div className="pp-end-icon"><TargetRegular /></div>
          <h2 className="pp-end-title">PinPoint Complete!</h2>
          <div className="pp-end-score">{totalScore} <span>/ {maxScore}</span></div>
          <div className="pp-end-pct" style={{ color: grade.color }}>{pct}%</div>
          <div className="pp-end-grade" style={{ color: grade.color, borderColor: grade.color }}>{grade.label}</div>
          {(xpEarned > 0 || coinsEarned > 0) && (
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '0.75rem' }}>
              {xpEarned > 0 && <span style={{ color: '#8b5cf6', fontWeight: 700 }}><FlashRegular /> +{xpEarned} XP</span>}
              {coinsEarned > 0 && <span style={{ color: '#eab308', fontWeight: 700 }}>🪙 +{coinsEarned}</span>}
            </div>
          )}
        </div>

        <h3 className="pp-breakdown-title">Question Breakdown</h3>
        <div className="pp-breakdown">
          {results.map((r, i) => {
            const sc = r.score >= 800 ? '#00c853' : r.score >= 400 ? '#f59e0b' : '#ef4444'
            return (
              <div key={i} className="pp-result-card glass-subtle">
                <div className="pp-result-header">
                  <span className="pp-result-num">#{i + 1}</span>
                  <span className="pp-result-name">{r.place.name}</span>
                  <span className="pp-result-score" style={{ color: sc }}>+{r.score}</span>
                </div>
                <span className="pp-result-dist">{formatDist(r.distance)} away</span>
              </div>
            )
          })}
        </div>

        <div className="pp-end-actions">
          <button className="pp-btn pp-btn-primary" onClick={() => navigate(0)}><PlayRegular /> Play Again</button>
          <Link to="/play" className="pp-btn pp-btn-outline"><HomeRegular /> Back to Games</Link>
        </div>
      </section>
    )
  }

  // ── PLAYING ──
  return (
    <section className="pp-game">
      {/* Header */}
      <div className="pp-header glass">
        <div className="pp-header-left">
          <span className="pp-q-count">{qIndex + 1}/{TOTAL}</span>
          <span className="pp-total-score">🪙 {totalScore}</span>
        </div>
        <div className={`pp-timer ${timeLeft <= 5 ? 'pp-timer-danger' : ''}`}>
          <TimerRegular /> {timeLeft}s
        </div>
      </div>

      {/* Place name */}
      <div className={`pp-place-name glass glass-glow ${feedback ? 'pp-feedback-' + feedback : ''}`}>
        <TargetRegular className="pp-place-icon" />
        <span>Where is <strong>{current.name}</strong>?</span>
      </div>

      {/* Map */}
      <div className="pp-map-wrap">
        <MapContainer
          center={[9.0, 8.0]}
          zoom={6}
          className="pp-map"
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapClickHandler onMapClick={handleMapClick} disabled={revealed} />

          {playerPin && <Marker position={[playerPin.lat, playerPin.lng]} icon={playerIcon} />}

          {revealed && (
            <>
              <Marker position={[current.lat, current.lng]} icon={targetIcon} />
              {playerPin && (
                <Polyline
                  positions={[[playerPin.lat, playerPin.lng], [current.lat, current.lng]]}
                  pathOptions={{ color: '#ef4444', weight: 2, dashArray: '8 4' }}
                />
              )}
              <FitBounds bounds={bounds} />
            </>
          )}
        </MapContainer>
      </div>

      {/* Reveal info */}
      {revealed && results.length > 0 && (
        <div className="pp-reveal glass glass-glow">
          <div className="pp-reveal-score" style={{ color: results[results.length - 1].score >= 800 ? '#00c853' : results[results.length - 1].score >= 400 ? '#f59e0b' : '#ef4444' }}>
            +{results[results.length - 1].score} pts
          </div>
          <div className="pp-reveal-dist">
            {results[results.length - 1].distance < 9999
              ? `${formatDist(results[results.length - 1].distance)} away`
              : 'No pin placed'}
          </div>
        </div>
      )}

      {/* Action button */}
      <div className="pp-actions">
        {!revealed ? (
          <button
            className="pp-btn pp-btn-primary"
            onClick={() => handleReveal(playerPin)}
            disabled={!playerPin}
          >
            <TargetRegular /> {playerPin ? 'Lock Pin' : 'Tap the map first'}
          </button>
        ) : (
          <button className="pp-btn pp-btn-primary" onClick={handleNext}>
            {qIndex + 1 >= TOTAL ? 'See Results' : 'Next'} <ArrowRightRegular />
          </button>
        )}
      </div>
    </section>
  )
}
