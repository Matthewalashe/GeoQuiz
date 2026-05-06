import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeftRegular, CheckmarkCircleRegular, ArrowClockwiseRegular } from '@fluentui/react-icons'
import { addXP } from '../engine/xp.js'

const PALETTE = [
  '#fde047', // Yellow (Danfo)
  '#22c55e', // Green
  '#3b82f6', // Blue
  '#ef4444', // Red
  '#a855f7', // Purple
  '#f97316', // Orange
  '#000000', // Black
  '#64748b', // Gray
  '#ffffff', // White
]

export default function ColoringGame() {
  const navigate = useNavigate()
  const [activeColor, setActiveColor] = useState(PALETTE[0])
  const [won, setWon] = useState(false)

  // Track fills for each SVG element
  const [fills, setFills] = useState({
    body: '#ffffff',
    window1: '#ffffff',
    window2: '#ffffff',
    window3: '#ffffff',
    wheel1: '#ffffff',
    wheel2: '#ffffff',
    headlight: '#ffffff',
    stripe: '#ffffff',
    bumper: '#ffffff'
  })

  function handleFill(part) {
    if (won) return
    setFills(prev => ({ ...prev, [part]: activeColor }))
  }

  function handleFinish() {
    // Basic check: have they painted at least 3 things non-white?
    const paintedCount = Object.values(fills).filter(c => c !== '#ffffff').length
    if (paintedCount < 3) {
      alert('Keep painting! Add some more color first.')
      return
    }
    setWon(true)
    addXP('GAME_WIN', 100)
  }

  function handleReset() {
    const defaultFills = {}
    Object.keys(fills).forEach(k => defaultFills[k] = '#ffffff')
    setFills(defaultFills)
  }

  return (
    <div className="game-screen">
      <header className="game-header">
        <button className="gh-back-btn" onClick={() => navigate('/play')}>
          <ArrowLeftRegular fontSize={24} />
        </button>
        <div className="gh-score">
          <span className="gh-score-label">Coloring Book</span>
        </div>
      </header>

      <div className="color-body">
        {won ? (
          <div className="cw-win">
            <CheckmarkCircleRegular fontSize={64} style={{ color: '#ec4899' }} />
            <h2>Masterpiece Complete!</h2>
            <p>+100 XP</p>
            <div className="color-artwork-preview">
              <DanfoSVG fills={fills} onFill={() => {}} />
            </div>
            <button className="btn btn-primary" onClick={() => navigate('/play')}>Back to Hub</button>
          </div>
        ) : (
          <>
            <div className="color-canvas-wrap">
              <DanfoSVG fills={fills} onFill={handleFill} />
            </div>

            <div className="color-controls">
              <div className="color-palette">
                {PALETTE.map(color => (
                  <button
                    key={color}
                    className={`color-swatch ${activeColor === color ? 'active' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setActiveColor(color)}
                  />
                ))}
              </div>
              
              <div className="color-actions">
                <button className="btn btn-outline btn-sm" onClick={handleReset}>
                  <ArrowClockwiseRegular /> Reset
                </button>
                <button className="btn btn-primary btn-sm" onClick={handleFinish}>
                  Finish Artwork
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function DanfoSVG({ fills, onFill }) {
  return (
    <svg viewBox="0 0 400 300" className="color-svg" xmlns="http://www.w3.org/2000/svg">
      <g stroke="#1e293b" strokeWidth="4" strokeLinejoin="round">
        {/* Main Body */}
        <path 
          id="body" 
          d="M 50 140 L 50 240 L 350 240 L 350 120 L 310 120 L 260 60 L 100 60 C 80 60 50 80 50 140 Z" 
          fill={fills.body} 
          onClick={() => onFill('body')} 
        />
        
        {/* Bumper */}
        <rect 
          id="bumper"
          x="40" y="230" width="320" height="20" rx="5"
          fill={fills.bumper}
          onClick={() => onFill('bumper')}
        />

        {/* Windows */}
        <path 
          id="window1" 
          d="M 100 80 L 140 80 L 140 130 L 70 130 C 70 110 80 90 100 80 Z" 
          fill={fills.window1} 
          onClick={() => onFill('window1')} 
        />
        <rect 
          id="window2" 
          x="160" y="80" width="40" height="50" rx="4" 
          fill={fills.window2} 
          onClick={() => onFill('window2')} 
        />
        <path 
          id="window3" 
          d="M 220 80 L 250 80 L 290 130 L 220 130 Z" 
          fill={fills.window3} 
          onClick={() => onFill('window3')} 
        />

        {/* The classic Danfo Stripe */}
        <path 
          id="stripe" 
          d="M 50 160 L 345 160 L 348 185 L 50 185 Z" 
          fill={fills.stripe} 
          onClick={() => onFill('stripe')} 
        />

        {/* Headlight */}
        <circle 
          id="headlight" 
          cx="330" cy="205" r="12" 
          fill={fills.headlight} 
          onClick={() => onFill('headlight')} 
        />

        {/* Wheels (drawn last to overlay body) */}
        <circle 
          id="wheel1" 
          cx="120" cy="245" r="28" 
          fill={fills.wheel1} 
          onClick={() => onFill('wheel1')} 
        />
        <circle cx="120" cy="245" r="10" fill="#cbd5e1" pointerEvents="none" />
        
        <circle 
          id="wheel2" 
          cx="280" cy="245" r="28" 
          fill={fills.wheel2} 
          onClick={() => onFill('wheel2')} 
        />
        <circle cx="280" cy="245" r="10" fill="#cbd5e1" pointerEvents="none" />
      </g>
    </svg>
  )
}
