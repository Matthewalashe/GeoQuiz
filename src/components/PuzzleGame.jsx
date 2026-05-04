import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { PUZZLE_IMAGES } from '../data/postcards.js'
import { playCorrect, playWrong, playPinDrop, vibrate } from '../engine/audio.js'

const GRID = 3 // 3x3 puzzle

function createTiles(size) {
  return Array.from({ length: size * size }, (_, i) => i)
}

function shuffleTiles(tiles) {
  const a = [...tiles]
  // Fisher-Yates with solvability guarantee
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  // Ensure solvable (even number of inversions for odd grid)
  let inversions = 0
  for (let i = 0; i < a.length; i++) {
    for (let j = i + 1; j < a.length; j++) {
      if (a[i] > a[j]) inversions++
    }
  }
  if (inversions % 2 !== 0) {
    [a[0], a[1]] = [a[1], a[0]]
  }
  return a
}

function isSolved(tiles) {
  return tiles.every((t, i) => t === i)
}

export default function PuzzleGame() {
  const navigate = useNavigate()
  const [puzzleIdx, setPuzzleIdx] = useState(0)
  const [tiles, setTiles] = useState(() => shuffleTiles(createTiles(GRID)))
  const [selected, setSelected] = useState(null)
  const [moves, setMoves] = useState(0)
  const [phase, setPhase] = useState('loading') // loading | playing | solved | allDone
  const [timer, setTimer] = useState(0)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [results, setResults] = useState([])
  const [showPreview, setShowPreview] = useState(true)
  const intervalRef = useRef(null)

  const puzzle = PUZZLE_IMAGES[puzzleIdx]

  // Timer
  useEffect(() => {
    if (phase !== 'playing') return
    intervalRef.current = setInterval(() => setTimer(t => t + 1), 1000)
    return () => clearInterval(intervalRef.current)
  }, [phase])

  // Preview for 2 seconds, then scramble
  useEffect(() => {
    if (!imgLoaded) return
    setShowPreview(true)
    const t = setTimeout(() => {
      setShowPreview(false)
      setTiles(shuffleTiles(createTiles(GRID)))
      setPhase('playing')
    }, 2500)
    return () => clearTimeout(t)
  }, [imgLoaded, puzzleIdx])

  function handleTileClick(idx) {
    if (phase !== 'playing') return
    if (selected === null) {
      setSelected(idx)
      playPinDrop()
    } else {
      // Swap tiles
      const newTiles = [...tiles]
      ;[newTiles[selected], newTiles[idx]] = [newTiles[idx], newTiles[selected]]
      setTiles(newTiles)
      setSelected(null)
      setMoves(prev => prev + 1)

      if (isSolved(newTiles)) {
        clearInterval(intervalRef.current)
        playCorrect(); vibrate([100])
        const stars = moves < 10 ? 3 : moves < 20 ? 2 : 1
        setResults(prev => [...prev, { puzzle, moves: moves + 1, time: timer, stars }])
        setPhase('solved')
      }
    }
  }

  function nextPuzzle() {
    if (puzzleIdx + 1 >= PUZZLE_IMAGES.length) {
      setPhase('allDone')
      return
    }
    setPuzzleIdx(prev => prev + 1)
    setTiles(createTiles(GRID))
    setSelected(null)
    setMoves(0)
    setTimer(0)
    setPhase('loading')
    setImgLoaded(false)
  }

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  // All puzzles complete
  if (phase === 'allDone') {
    const totalStars = results.reduce((s, r) => s + r.stars, 0)
    const maxStars = results.length * 3
    return (
      <section className="pz-results">
        <div className="pz-results-card">
          <h2>🧩 Puzzle Complete!</h2>
          <div className="pz-results-stars">{'⭐'.repeat(totalStars)} <span className="pz-dim">/ {maxStars} stars</span></div>
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
          <div className="pz-results-actions">
            <button className="btn btn-primary" onClick={() => { setPuzzleIdx(0); setResults([]); setMoves(0); setTimer(0); setPhase('loading'); setImgLoaded(false) }}>Play Again</button>
            <button className="btn btn-outline" onClick={() => navigate('/')}>Home</button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="puzzle-game">
      {/* HUD */}
      <div className="pz-hud">
        <span className="pz-hud-title">🧩 {puzzle.title}</span>
        <span className="pz-hud-info">{puzzleIdx + 1}/{PUZZLE_IMAGES.length}</span>
      </div>
      <div className="pz-stats">
        <span className="pz-stat">⏱ {formatTime(timer)}</span>
        <span className="pz-stat">🔄 {moves} moves</span>
      </div>

      {/* Puzzle board */}
      <div className="pz-board-wrap">
        {/* Reference image (small) */}
        <div className="pz-ref">
          <img src={puzzle.image} alt="Reference" />
          <span>Reference</span>
        </div>

        <div className="pz-board" style={{ '--grid': GRID }}>
          {(showPreview ? createTiles(GRID) : tiles).map((tileIdx, pos) => {
            const row = Math.floor(tileIdx / GRID)
            const col = tileIdx % GRID
            return (
              <div
                key={pos}
                className={`pz-tile ${selected === pos ? 'selected' : ''} ${showPreview ? 'preview' : ''} ${phase === 'solved' ? 'solved' : ''}`}
                onClick={() => handleTileClick(pos)}
                style={{
                  backgroundImage: `url(${puzzle.image})`,
                  backgroundSize: `${GRID * 100}%`,
                  backgroundPosition: `${(col / (GRID - 1)) * 100}% ${(row / (GRID - 1)) * 100}%`,
                }}
              >
                {showPreview && <div className="pz-tile-num">{tileIdx + 1}</div>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Solved overlay */}
      {phase === 'solved' && (
        <div className="pz-solved">
          <div className="pz-solved-card">
            <div className="pz-solved-icon">✨</div>
            <h3>Puzzle Solved!</h3>
            <p>{moves} moves · {formatTime(timer)}</p>
            <p className="pz-solved-fact">{puzzle.fact}</p>
            <button className="pz-next-btn" onClick={nextPuzzle}>
              {puzzleIdx + 1 >= PUZZLE_IMAGES.length ? 'See Results' : 'Next Puzzle'} →
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {phase === 'loading' && !imgLoaded && (
        <div className="pz-loading">
          <div className="pz-loading-spinner" />
          <p>Loading puzzle...</p>
        </div>
      )}

      {/* Hidden image for preload */}
      <img
        src={puzzle.image}
        alt=""
        style={{ display: 'none' }}
        onLoad={() => setImgLoaded(true)}
      />
    </section>
  )
}
