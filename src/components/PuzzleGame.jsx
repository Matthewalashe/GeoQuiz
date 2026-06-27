import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPuzzleImages } from '../lib/cms.js'

function shuffleArr(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
import { playCorrect, playPinDrop, vibrate } from '../engine/audio.js'
import { addXP } from '../engine/xp.js'
import { calculateGameReward, addCoins } from '../engine/coinEconomy.js'
import { autoSubmitScore } from '../engine/leaderboard.js'
import ResultCard from './ResultCard.jsx'

const GRID = 3

function createTiles() {
  return Array.from({ length: GRID * GRID }, (_, i) => i)
}

function shuffleTiles() {
  const a = createTiles()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  // Don't start solved
  if (a.every((t, i) => t === i)) [a[0], a[1]] = [a[1], a[0]]
  return a
}

function isSolved(tiles) {
  return tiles.every((t, i) => t === i)
}

export default function PuzzleGame() {
  const navigate = useNavigate()
  const [puzzles, setPuzzles] = useState([])
  const [cmsLoading, setCmsLoading] = useState(true)
  const [cmsError, setCmsError] = useState(null)

  function loadPuzzles() {
    setCmsLoading(true); setCmsError(null)
    getPuzzleImages().then(({ data, error }) => {
      if (error) { setCmsError(error); setCmsLoading(false); return }
      setPuzzles(shuffleArr(data))
      setCmsLoading(false)
    })
  }
  useEffect(() => { loadPuzzles() }, [])
  const [puzzleIdx, setPuzzleIdx] = useState(0)
  const [tiles, setTiles] = useState(createTiles)
  const [selected, setSelected] = useState(null)
  const [moves, setMoves] = useState(0)
  const [phase, setPhase] = useState('preview') // preview | playing | solved | allDone
  const [timer, setTimer] = useState(0)
  const [score, setScore] = useState(0)
  const [results, setResults] = useState([])
  const [menuOpen, setMenuOpen] = useState(false)
  const [showQuitModal, setShowQuitModal] = useState(false)
  const [pendingNav, setPendingNav] = useState(null)
  const [imgLoaded, setImgLoaded] = useState(false)
  const intervalRef = useRef(null)

  // Lock body scroll while game is mounted
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const puzzle = puzzles[puzzleIdx]
  const [showReveal, setShowReveal] = useState(false)

  // Timer
  useEffect(() => {
    if (phase !== 'playing') {
      clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = setInterval(() => setTimer(t => t + 1), 1000)
    return () => clearInterval(intervalRef.current)
  }, [phase])

  // When image loads, show preview then scramble
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!imgLoaded) return
    setPhase('preview')
    const t = setTimeout(() => {
      setTiles(shuffleTiles())
      setPhase('playing')
    }, 2500)
    return () => clearTimeout(t)
  }, [imgLoaded])
  /* eslint-enable react-hooks/set-state-in-effect */

  function handleTileClick(idx) {
    if (phase !== 'playing') return
    if (selected === null) {
      setSelected(idx)
      playPinDrop()
    } else {
      const newTiles = [...tiles]
      ;[newTiles[selected], newTiles[idx]] = [newTiles[idx], newTiles[selected]]
      setTiles(newTiles)
      setSelected(null)
      setMoves(prev => prev + 1)
      if (isSolved(newTiles)) {
        clearInterval(intervalRef.current)
        playCorrect(); vibrate([100])
        const actualMoves = moves + 1
        const stars = actualMoves < 10 ? 3 : actualMoves < 20 ? 2 : 1
        const timeBonus = timer < 30 ? 50 : timer < 60 ? 25 : 0
        const pts = stars * 100 + timeBonus
        setScore(prev => prev + pts)
        addXP('PUZZLE_COMPLETE')
        try {
          const finalScore = score + pts
          const pct = Math.round((finalScore / (puzzles.length * 300)) * 100)
          const coins = calculateGameReward(pct)
          if (coins > 0) addCoins(coins, 'Puzzle game reward')
        } catch {}
        setResults(prev => [...prev, { puzzle, moves: actualMoves, time: timer, stars, timeBonus }])
        setPhase('solved')
        setShowReveal(false)
      }
    }
  }

  function nextPuzzle() {
    if (puzzleIdx + 1 >= puzzles.length) {
      setPhase('allDone')
      // Submit final score to leaderboard — score state is current here since it was set during solved phase
      autoSubmitScore({ gameType: 'puzzle', score, maxScore: puzzles.length * 300, questionCount: puzzles.length })
      return
    }
    setPuzzleIdx(prev => prev + 1)
    setTiles(createTiles())
    setSelected(null)
    setMoves(0)
    setTimer(0)
    setImgLoaded(false)
  }

  function restart() {
    setPuzzleIdx(0); setResults([]); setMoves(0); setTimer(0)
    setTiles(createTiles()); setSelected(null); setImgLoaded(false)
  }

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  // Loading / Error
  if (cmsLoading) return <div className="game-lobby"><div className="lb-empty">Loading puzzles...</div></div>
  if (cmsError) return (
    <div className="game-lobby">
      <button className="gh-back" onClick={() => navigate('/play')}>← Back</button>
      <div className="lb-empty" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ fontSize: '2rem' }}>⚠️</div>
        <p style={{ color: '#ef4444', fontSize: '0.9rem' }}>{cmsError}</p>
        <button onClick={loadPuzzles} style={{ padding: '0.5rem 1.2rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>Try Again</button>
      </div>
    </div>
  )
  if (puzzles.length === 0) return null

  if (phase === 'allDone') {
    const totalStars = results.reduce((s, r) => s + r.stars, 0)
    return (
      <section className="pz-results">
        <ResultCard
          score={totalStars * 100}
          maxScore={puzzles.length * 300}
          correctCount={totalStars}
          totalQuestions={puzzles.length * 3}
          pointsEarned={totalStars * 100}
          gameTitle="Puzzle"
          gameEmoji="🧩"
          gameType="puzzle"
          onPlayAgain={() => {
            setPuzzleIdx(0); setResults([]); setScore(0); setMoves(0); setTimer(0)
            setTiles(createTiles()); setSelected(null); setImgLoaded(false); setPhase('preview')
          }}
        >
          <div className="pz-results-list">
            {results.map((r, i) => (
              <div key={i} className="pz-result-row">
                <span className="pz-rr-name">{r.puzzle.title}</span>
                <span className="pz-rr-moves">{r.moves} moves</span>
                <span className="pz-rr-time">{formatTime(r.time)}</span>
                <span className="pz-rr-stars">{'⭐'.repeat(r.stars)}</span>
              </div>
            ))}
          </div>
        </ResultCard>
      </section>
    )
  }

  function handleQuit(dest) {
    setPendingNav(dest)
    if (phase === 'playing') setShowQuitModal(true)
    else navigate(dest)
  }

  return (
    <section className="game-screen puzzle-game">
      {/* Quit modal */}
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

      {/* Menu sidebar */}
      <div className={`legend-sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="legend-section sidebar-nav">
          <button className="sidebar-nav-btn" onClick={() => handleQuit('/')}>Home</button>
          <button className="sidebar-nav-btn" onClick={() => handleQuit('/play')}>New Game</button>
          <button className="sidebar-nav-btn" onClick={() => window.location.reload()}>Restart</button>
          <button className="sidebar-nav-btn sidebar-quit" onClick={() => handleQuit('/')}>Quit</button>
        </div>
      </div>
      <button className={`legend-toggle ${menuOpen ? 'shifted' : ''}`} onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? '◀' : '☰'}
      </button>

      {/* Floating HUD */}
      <div className="game-hud" style={{ borderImage: 'none', borderColor: 'var(--border)' }}>
        <div className="hud-left">
          <span className="hud-counter">🧩 {puzzleIdx + 1}/{puzzles.length}</span>
        </div>
        <div className="hud-right">
          <span className="hud-score">{score} pts</span>
        </div>
      </div>

      <div className="pg-body" style={{ marginTop: '70px', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="pz-stats">
        <span className="pz-stat">⏱ {formatTime(timer)}</span>
        <span className="pz-stat">🔄 {moves} moves</span>
        {phase === 'preview' && <span className="pz-stat pz-stat-preview">👀 Memorize!</span>}
      </div>

      {/* Reference image */}
      <div className="pz-ref">
        <img src={puzzle.image} alt="Reference" />
        <span>Reference</span>
      </div>

      {/* Puzzle board */}
      <div className="pz-board" style={{ '--grid': GRID }}>
        {(phase === 'preview' ? createTiles() : tiles).map((tileIdx, pos) => {
          const row = Math.floor(tileIdx / GRID)
          const col = tileIdx % GRID
          return (
            <div
              key={pos}
              className={`pz-tile ${selected === pos ? 'selected' : ''} ${phase === 'preview' ? 'preview' : ''} ${phase === 'solved' ? 'solved' : ''}`}
              onClick={() => handleTileClick(pos)}
              style={{
                backgroundImage: `url(${puzzle.image})`,
                backgroundSize: `${GRID * 100}%`,
                backgroundPosition: `${(col / (GRID - 1)) * 100}% ${(row / (GRID - 1)) * 100}%`,
              }}
            />
          )
        })}
      </div>

      {phase === 'playing' && (
        <p className="pz-instruction">Tap a tile to select, then tap another to swap</p>
      )}

      {/* Solved overlay */}
      {phase === 'solved' && (
        <div className="pz-solved">
          <div className="pz-solved-card">
            <div className="pz-solved-icon">✨</div>
            <h3>Puzzle Solved!</h3>
            <p>{moves} moves · {formatTime(timer)}{results[results.length-1]?.timeBonus > 0 ? ` · +${results[results.length-1].timeBonus} speed bonus!` : ''}</p>
            {showReveal ? (
              <div className="pz-reveal">
                <img src={puzzle.image} alt={puzzle.title} className="pz-reveal-img" />
                <p className="pz-reveal-title">{puzzle.title}</p>
              </div>
            ) : (
              <button className="pz-reveal-btn" onClick={() => setShowReveal(true)}>🖼️ Reveal Full Image</button>
            )}
            <p className="pz-solved-fact">{puzzle.fact}</p>
            <button className="pz-next-btn" onClick={nextPuzzle}>
              {puzzleIdx + 1 >= puzzles.length ? 'See Results' : 'Next Puzzle'} →
            </button>
          </div>
        </div>
      )}

      {/* Hidden image preloader */}
      <img src={puzzle.image} alt="" style={{ display: 'none' }} onLoad={() => setImgLoaded(true)} />
      </div>
    </section>
  )
}
