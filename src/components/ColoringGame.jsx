import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckmarkCircleRegular, ArrowClockwiseRegular } from '@fluentui/react-icons'
import { addXP } from '../engine/xp.js'
import { autoSubmitScore } from '../engine/leaderboard.js'
import ResultCard from './ResultCard.jsx'
import { getColoringScenes } from '../lib/cms.js'

// ── PALETTE ──────────────────────────────────────────────────────────────────
const PALETTE = [
  { color: '#fde047', label: 'Danfo Yellow' },
  { color: '#22c55e', label: 'Lagos Green' },
  { color: '#3b82f6', label: 'Ocean Blue' },
  { color: '#ef4444', label: 'Red' },
  { color: '#a855f7', label: 'Purple' },
  { color: '#f97316', label: 'Sunset Orange' },
  { color: '#f472b6', label: 'Pink' },
  { color: '#14b8a6', label: 'Teal' },
  { color: '#000000', label: 'Black' },
  { color: '#64748b', label: 'Gray' },
  { color: '#ffffff', label: 'White' },
  { color: '#a16207', label: 'Brown' },
]

// ── SVG REGISTRY — maps svg_key to React SVG components ─────────────────────
import { EXTRA_SCENES } from '../data/coloringScenes.jsx'
const SVG_REGISTRY = {
  danfo: DanfoSVG,
  market: MarketSVG,
  house: HouseSVG,
  // Add SVGs from EXTRA_SCENES
  ...Object.fromEntries(Object.entries(EXTRA_SCENES).map(([k, v]) => [k, v.SVG])),
}

// ── SVGs ─────────────────────────────────────────────────────────────────────
function DanfoSVG({ fills, onFill }) {
  const s = (part) => ({ fill: fills[part] || '#fff', cursor: onFill ? 'pointer' : 'default', transition: 'fill 0.15s' })
  return (
    <svg viewBox="0 0 400 260" className="color-svg" xmlns="http://www.w3.org/2000/svg">
      <g stroke="#1e293b" strokeWidth="3.5" strokeLinejoin="round">
        <path d="M 50 130 L 50 220 L 350 220 L 350 110 L 310 110 L 265 55 L 100 55 C 78 55 50 72 50 130 Z"
          style={s('body')} onClick={() => onFill?.('body')} />
        <rect x="40" y="212" width="320" height="18" rx="4" style={s('bumper')} onClick={() => onFill?.('bumper')} />
        <path d="M 100 74 L 138 74 L 138 122 L 68 122 C 68 105 80 82 100 74 Z"
          style={s('window1')} onClick={() => onFill?.('window1')} />
        <rect x="158" y="74" width="40" height="48" rx="4" style={s('window2')} onClick={() => onFill?.('window2')} />
        <path d="M 222 74 L 252 74 L 292 122 L 222 122 Z"
          style={s('window3')} onClick={() => onFill?.('window3')} />
        <path d="M 50 148 L 345 148 L 348 172 L 50 172 Z"
          style={s('stripe')} onClick={() => onFill?.('stripe')} />
        <circle cx="330" cy="190" r="11" style={s('headlight')} onClick={() => onFill?.('headlight')} />
        <circle cx="120" cy="228" r="26" style={s('wheel1')} onClick={() => onFill?.('wheel1')} />
        <circle cx="120" cy="228" r="10" fill="#94a3b8" pointerEvents="none" />
        <circle cx="278" cy="228" r="26" style={s('wheel2')} onClick={() => onFill?.('wheel2')} />
        <circle cx="278" cy="228" r="10" fill="#94a3b8" pointerEvents="none" />
      </g>
    </svg>
  )
}

function MarketSVG({ fills, onFill }) {
  const s = (part) => ({ fill: fills[part] || '#fff', cursor: onFill ? 'pointer' : 'default', transition: 'fill 0.15s' })
  return (
    <svg viewBox="0 0 400 260" className="color-svg" xmlns="http://www.w3.org/2000/svg">
      <g stroke="#1e293b" strokeWidth="3" strokeLinejoin="round">
        <rect x="5" y="240" width="390" height="20" style={s('ground')} onClick={() => onFill?.('ground')} />
        {/* Stall 1 */}
        <rect x="15" y="150" width="110" height="95" style={s('stall1')} onClick={() => onFill?.('stall1')} />
        <polygon points="5,155 130,155 120,110 15,110" style={s('roof1')} onClick={() => onFill?.('roof1')} />
        {/* Stall 2 */}
        <rect x="145" y="140" width="110" height="105" style={s('stall2')} onClick={() => onFill?.('stall2')} />
        <polygon points="135,145 265,145 255,95 145,95" style={s('roof2')} onClick={() => onFill?.('roof2')} />
        {/* Stall 3 */}
        <rect x="275" y="155" width="110" height="90" style={s('stall3')} onClick={() => onFill?.('stall3')} />
        <polygon points="265,160 395,160 385,115 275,115" style={s('roof3')} onClick={() => onFill?.('roof3')} />
        {/* Goods on tables */}
        <ellipse cx="70" cy="215" rx="35" ry="12" style={s('goods')} onClick={() => onFill?.('goods')} />
        <ellipse cx="200" cy="205" rx="35" ry="12" style={s('goods')} onClick={() => onFill?.('goods')} />
        <ellipse cx="330" cy="220" rx="35" ry="12" style={s('goods')} onClick={() => onFill?.('goods')} />
      </g>
    </svg>
  )
}

function HouseSVG({ fills, onFill }) {
  const s = (part) => ({ fill: fills[part] || '#fff', cursor: onFill ? 'pointer' : 'default', transition: 'fill 0.15s' })
  return (
    <svg viewBox="0 0 400 280" className="color-svg" xmlns="http://www.w3.org/2000/svg">
      <g stroke="#1e293b" strokeWidth="3" strokeLinejoin="round">
        {/* Sky */}
        <rect x="0" y="0" width="400" height="280" style={s('sky')} onClick={() => onFill?.('sky')} />
        {/* Grass */}
        <rect x="0" y="220" width="400" height="60" style={s('grass')} onClick={() => onFill?.('grass')} />
        {/* Path */}
        <polygon points="165,280 235,280 210,220 190,220" style={s('path')} onClick={() => onFill?.('path')} />
        {/* House wall */}
        <rect x="60" y="120" width="280" height="110" style={s('wall')} onClick={() => onFill?.('wall')} />
        {/* Roof */}
        <polygon points="40,125 200,35 360,125" style={s('roof')} onClick={() => onFill?.('roof')} />
        {/* Door */}
        <rect x="170" y="175" width="60" height="55" rx="4" style={s('door')} onClick={() => onFill?.('door')} />
        {/* Windows */}
        <rect x="85" y="145" width="55" height="45" rx="4" style={s('window1')} onClick={() => onFill?.('window1')} />
        <rect x="260" y="145" width="55" height="45" rx="4" style={s('window2')} onClick={() => onFill?.('window2')} />
      </g>
    </svg>
  )
}

// ── COMPONENT ────────────────────────────────────────────────────────────────
export default function ColoringGame() {
  const navigate = useNavigate()

  // CMS data
  const [SCENES, setSCENES] = useState({})
  const [SCENE_LIST, setSCENE_LIST] = useState([])
  const [cmsLoading, setCmsLoading] = useState(true)
  const [cmsError, setCmsError] = useState(null)

  function loadScenes() {
    setCmsLoading(true); setCmsError(null)
    getColoringScenes().then(({ data, error }) => {
      if (error) { setCmsError(error); setCmsLoading(false); return }
      // Merge CMS metadata with code-side SVG registry
      const merged = {}
      data.forEach(scene => {
        const svgKey = scene.svg_key || scene.id
        const SVG = SVG_REGISTRY[svgKey]
        if (SVG) merged[scene.id] = { ...scene, SVG }
      })
      setSCENES(merged)
      setSCENE_LIST(Object.values(merged))
      setCmsLoading(false)
    })
  }
  useEffect(() => { loadScenes() }, [])

  const [selectedScene, setSelectedScene] = useState(null)
  const [started, setStarted] = useState(false)
  const [activeColor, setActiveColor] = useState(PALETTE[0].color)
  const [fills, setFills] = useState({})
  const [won, setWon] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showQuitModal, setShowQuitModal] = useState(false)
  const [pendingNav, setPendingNav] = useState(null)

  function startScene() {
    const scene = SCENES[selectedScene]
    const defaultFills = {}
    scene.parts.forEach(p => (defaultFills[p] = '#ffffff'))
    setFills(defaultFills)
    setWon(false)
    setActiveColor(PALETTE[0].color)
    setStarted(true)
  }

  function handleFill(part) {
    if (won) return
    setFills(prev => ({ ...prev, [part]: activeColor }))
  }

  function handleReset() {
    const scene = SCENES[selectedScene]
    const defaultFills = {}
    scene.parts.forEach(p => (defaultFills[p] = '#ffffff'))
    setFills(defaultFills)
  }

  function handleFinish() {
    const scene = SCENES[selectedScene]
    const painted = Object.values(fills).filter(c => c !== '#ffffff').length
    if (painted < scene.minParts) {
      alert(`Keep painting! Add color to at least ${scene.minParts} parts of the drawing.`)
      return
    }
    setWon(true)
    addXP('GAME_WIN')
    autoSubmitScore({ gameType: 'coloring', score: 100, maxScore: 100, questionCount: 1 })
  }

  function handleQuit(dest) {
    setPendingNav(dest)
    if (!won) setShowQuitModal(true)
    else navigate(dest)
  }

  const scene = selectedScene ? SCENES[selectedScene] : null

  // Loading / Error
  if (cmsLoading) return <div className="game-lobby"><div className="lb-empty">Loading coloring scenes...</div></div>
  if (cmsError) return (
    <div className="game-lobby">
      <button className="gh-back" onClick={() => navigate('/play')}>← Back</button>
      <div className="lb-empty" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ fontSize: '2rem' }}>⚠️</div>
        <p style={{ color: '#ef4444', fontSize: '0.9rem' }}>{cmsError}</p>
        <button onClick={loadScenes} style={{ padding: '0.5rem 1.2rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>Try Again</button>
      </div>
    </div>
  )

  // ── SCENE SELECTOR ─────────────────────────────────────────────────────────────────
  if (!started) {
    return (
      <div className="game-lobby">
        <button className="gh-back" onClick={() => navigate('/play')}>← Back</button>
        <h2 className="lobby-title">🎨 Coloring Book</h2>
        <p className="lobby-sub">Pick a scene and bring it to life with color</p>
        <div className="lobby-packs">
          {SCENE_LIST.map(s => (
            <button
              key={s.id}
              className={`lobby-pack-card coloring-lobby-card ${selectedScene === s.id ? 'active' : ''}`}
              style={{ '--pack-color': s.color }}
              onClick={() => setSelectedScene(s.id)}
            >
              <div className="coloring-preview-wrap">
                <s.SVG fills={s.guide} onFill={null} />
              </div>
              <span className="lpc-label">{s.title}</span>
              <span className="lpc-desc">{s.desc}</span>
            </button>
          ))}
        </div>
        <button
          className="lobby-start-btn"
          disabled={!selectedScene}
          onClick={startScene}
          style={{ background: selectedScene ? (SCENES[selectedScene]?.color || '#ec4899') : undefined }}
        >
          Start Coloring →
        </button>
      </div>
    )
  }

  const SVGComponent = scene.SVG

  // ── GAMEPLAY ─────────────────────────────────────────────────────────────
  return (
    <div className="game-screen">
      {showQuitModal && (
        <div className="quit-overlay" onClick={() => setShowQuitModal(false)}>
          <div className="quit-modal" onClick={e => e.stopPropagation()}>
            <h3>Quit Game?</h3>
            <p>Your artwork will be lost.</p>
            <div className="quit-actions">
              <button className="btn btn-primary" onClick={() => setShowQuitModal(false)}>Keep Painting</button>
              <button className="btn btn-outline quit-confirm" onClick={() => navigate(pendingNav || '/')}>Quit</button>
            </div>
          </div>
        </div>
      )}
      <div className={`legend-sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="legend-section sidebar-nav">
          <button className="sidebar-nav-btn" onClick={() => handleQuit('/')}>Home</button>
          <button className="sidebar-nav-btn" onClick={() => { setStarted(false); setSelectedScene(null) }}>Change Scene</button>
          <button className="sidebar-nav-btn" onClick={handleReset}>Reset Colors</button>
          <button className="sidebar-nav-btn sidebar-quit" onClick={() => handleQuit('/')}>Quit</button>
        </div>
      </div>
      <button className={`legend-toggle ${menuOpen ? 'shifted' : ''}`} onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? '◀' : '☰'}
      </button>

      <div className="game-hud" style={{ borderImage: 'none', borderColor: 'var(--border)' }}>
        <div className="hud-left">
          <span className="hud-counter">🎨 {scene.title}</span>
        </div>
        <div className="hud-right">
          <div className="color-active-dot" style={{ background: activeColor, border: '2px solid var(--border)', width: 24, height: 24, borderRadius: '50%' }} />
        </div>
      </div>

      <div className="color-body">
        {won ? (
          <ResultCard
            score={100}
            maxScore={100}
            pointsEarned={100}
            gameTitle="Coloring"
            gameEmoji="🎨"
            gameType="coloring"
            onPlayAgain={() => { setWon(false); setStarted(false); setSelectedScene(null) }}
          >
            <div className="color-artwork-preview">
              <SVGComponent fills={fills} onFill={null} />
            </div>
          </ResultCard>
        ) : (
          <>
            {/* Guide + Canvas row */}
            <div className="color-layout">
              <div className="color-guide-panel">
                <span className="color-guide-label">Guide</span>
                <SVGComponent fills={scene.guide} onFill={null} />
              </div>
              <div className="color-canvas-panel">
                <SVGComponent fills={fills} onFill={handleFill} />
              </div>
            </div>

            {/* Controls */}
            <div className="color-controls">
              <div className="color-palette">
                {PALETTE.map(({ color, label }) => (
                  <button
                    key={color}
                    className={`color-swatch ${activeColor === color ? 'active' : ''}`}
                    style={{ backgroundColor: color }}
                    title={label}
                    onClick={() => setActiveColor(color)}
                  />
                ))}
              </div>
              <div className="color-actions">
                <button className="btn btn-outline btn-sm" onClick={handleReset}>
                  <ArrowClockwiseRegular /> Reset
                </button>
                <button className="btn btn-primary btn-sm" onClick={handleFinish}>
                  ✓ Done!
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
