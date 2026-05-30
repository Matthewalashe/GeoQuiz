import { useState, useEffect, useRef } from 'react'
import { getDiscoveryPOIs } from '../lib/cms.js'

// Build weighted wheel slices: sponsored POIs get 2× weight
function buildSlices(categoryId, poisList) {
  let pool = categoryId === 'all'
    ? poisList
    : poisList.filter(p => p.category === categoryId)

  if (pool.length === 0) pool = poisList

  // Expand sponsored entries (2× weight)
  const weighted = []
  pool.forEach(poi => {
    weighted.push(poi)
    if (poi.sponsored) weighted.push(poi)
  })

  // Deduplicate for display — but use weighted for random pick
  return { weighted, display: pool.slice(0, 12) }
}

const PALETTE = [
  '#00ff88', '#00d4ff', '#a855f7', '#ff6b35',
  '#fbbf24', '#f472b6', '#34d399', '#60a5fa',
  '#fb923c', '#818cf8', '#22d3ee', '#facc15',
]

function drawWheel(canvas, slices, rotation) {
  const ctx = canvas.getContext('2d')
  const W = canvas.width
  const cx = W / 2
  const cy = W / 2
  const r = W / 2 - 6
  const n = slices.length
  const arc = (2 * Math.PI) / n

  ctx.clearRect(0, 0, W, W)

  slices.forEach((poi, i) => {
    const start = rotation + arc * i
    const end = start + arc

    // Slice fill
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, r, start, end)
    ctx.closePath()
    ctx.fillStyle = PALETTE[i % PALETTE.length] + (poi.sponsored ? 'ff' : 'cc')
    ctx.fill()
    ctx.strokeStyle = '#0a1628'
    ctx.lineWidth = 2
    ctx.stroke()

    // Label
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(start + arc / 2)
    ctx.textAlign = 'right'
    ctx.fillStyle = '#0a1628'
    ctx.font = `bold ${Math.max(9, Math.floor(W / 40))}px Inter, sans-serif`
    const label = poi.name.length > 14 ? poi.name.slice(0, 13) + '…' : poi.name
    ctx.fillText(label, r - 8, 4)
    ctx.restore()
  })

  // Centre circle
  ctx.beginPath()
  ctx.arc(cx, cy, 28, 0, 2 * Math.PI)
  ctx.fillStyle = '#0a1628'
  ctx.fill()
  ctx.strokeStyle = '#00ff88'
  ctx.lineWidth = 3
  ctx.stroke()

  ctx.fillStyle = '#00ff88'
  ctx.font = 'bold 13px Inter, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('SPIN', cx, cy + 5)
}

export default function SpinWheel({ onClose }) {
  const canvasRef = useRef(null)
  const [category, setCategory] = useState('all')
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('geoquiz_spin_history') || '[]') }
    catch { return [] }
  })
  const [poisList, setPoisList] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const animRef = useRef(null)
  const rotRef = useRef(0)

  function loadPOIs() {
    setLoading(true)
    setFetchError(null)
    getDiscoveryPOIs()
      .then(({ data, error }) => {
        if (error) setFetchError(error)
        setPoisList(data)
        setLoading(false)
      })
      .catch(err => {
        setFetchError(err.message || 'Failed to load places.')
        setLoading(false)
      })
  }

  useEffect(() => { loadPOIs() }, [])

  const { weighted, display } = buildSlices(category, poisList)
  const slices = display

  // Draw on every rotation change
  useEffect(() => {
    if (loading) return
    const canvas = canvasRef.current
    if (!canvas) return
    drawWheel(canvas, slices, rotRef.current)
  }, [category, result, slices, loading])

  function spin() {
    if (spinning || loading || slices.length === 0) return
    setResult(null)
    setSpinning(true)

    const totalSpins = 5 + Math.random() * 5 // 5–10 full rotations
    const extra = Math.random() * 2 * Math.PI
    const target = rotRef.current + totalSpins * 2 * Math.PI + extra
    const duration = 4000
    const start = performance.now()
    const startRot = rotRef.current

    function animate(now) {
      const elapsed = now - start
      const t = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const ease = 1 - Math.pow(1 - t, 3)
      rotRef.current = startRot + (target - startRot) * ease

      const canvas = canvasRef.current
      if (canvas) drawWheel(canvas, slices, rotRef.current)

      if (t < 1) {
        animRef.current = requestAnimationFrame(animate)
      } else {
        rotRef.current = target % (2 * Math.PI)
        setSpinning(false)

        // Determine winning slice — pick from weighted pool
        // (geometric calculation removed in favor of weighted random pick)
        const winner = weighted[Math.floor(Math.random() * weighted.length)]
        setResult(winner)

        const entry = { name: winner.name, area: winner.area, mapUrl: winner.mapUrl, date: new Date().toISOString() }
        const newHistory = [entry, ...history].slice(0, 10)
        setHistory(newHistory)
        localStorage.setItem('geoquiz_spin_history', JSON.stringify(newHistory))
      }
    }
    animRef.current = requestAnimationFrame(animate)
  }

  useEffect(() => () => { if (animRef.current) cancelAnimationFrame(animRef.current) }, [])

  return (
    <div className="spin-overlay" onClick={onClose}>
      <div className="spin-modal" onClick={e => e.stopPropagation()}>
        <div className="spin-modal-header">
          <h2 className="spin-title">🎡 Spin the Wheel</h2>
          <button className="spin-close" onClick={onClose}>✕</button>
        </div>
        <p className="spin-subtitle">Can't decide? Let fate choose your next Lagos adventure!</p>

        {/* Category filter */}
        <div className="spin-cats">
          {[{ id: 'all', icon: '🗺️', label: 'All' },
            { id: 'food', icon: '🍽️', label: 'Food' },
            { id: 'nightlife', icon: '🎉', label: 'Night' },
            { id: 'beaches', icon: '🏖️', label: 'Beach' },
            { id: 'parks', icon: '🌳', label: 'Parks' },
            { id: 'art', icon: '🎭', label: 'Art' },
          ].map(c => (
            <button
              key={c.id}
              className={`spin-cat-btn ${category === c.id ? 'active' : ''}`}
              onClick={() => { setCategory(c.id); setResult(null) }}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>

        {/* Pointer */}
        <div className="spin-pointer-wrap">
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '320px', width: '320px' }}>
              <div className="loading-icon" style={{ animation: 'float 2s ease-in-out infinite', fontSize: '3rem' }}>🎡</div>
              <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading spots...</p>
            </div>
          ) : fetchError ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '320px', width: '320px', gap: '0.75rem' }}>
              <div style={{ fontSize: '2.5rem' }}>⚠️</div>
              <p style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center' }}>{fetchError}</p>
              <button onClick={loadPOIs} style={{ padding: '0.5rem 1.2rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>Try Again</button>
            </div>
          ) : (
            <>
              <div className="spin-pointer">▼</div>
              <canvas
                ref={canvasRef}
                width={320}
                height={320}
                className="spin-canvas"
                onClick={!spinning ? spin : undefined}
              />
            </>
          )}
        </div>

        <button
          className={`spin-btn ${spinning ? 'spinning' : ''}`}
          onClick={spin}
          disabled={spinning || loading}
        >
          {spinning ? 'Spinning…' : '🎡 SPIN!'}
        </button>

        {/* Result card */}
        {result && (
          <div className="spin-result">
            <div className="spin-result-label">You got:</div>
            <div className="spin-result-name">{result.name}</div>
            <div className="spin-result-area">📍 {result.area}</div>
            {result.sponsored && <span className="spin-sponsored-tag">⭐ Featured Spot</span>}
            <p className="spin-result-desc">{result.description}</p>
            <div className="spin-result-actions">
              <a href={result.mapUrl} target="_blank" rel="noopener noreferrer" className="spin-nav-btn">
                🧭 Navigate There
              </a>
              <button className="spin-again-btn" onClick={spin}>Spin Again</button>
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="spin-history">
            <div className="spin-history-title">Recent spins</div>
            {history.slice(0, 5).map((h, i) => (
              <div key={i} className="spin-history-row">
                <span>{h.name}</span>
                <a href={h.mapUrl} target="_blank" rel="noopener noreferrer">→</a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
