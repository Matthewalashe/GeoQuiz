import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { WORD_DATA } from '../data/wordgame.js'
import { playCorrect, playWrong, playPinDrop, vibrate } from '../engine/audio.js'
import { autoSubmitScore } from '../engine/leaderboard.js'
import ResultCard from './ResultCard.jsx'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function scrambleWord(word) {
  const letters = word.split('')
  let scrambled
  let attempts = 0
  do { scrambled = shuffle(letters); attempts++ } while (scrambled.join('') === word && attempts < 100)
  return scrambled
}

export default function WordGame() {
  const navigate = useNavigate()
  const [words] = useState(() => {
    const solved = JSON.parse(localStorage.getItem('wanda_solved_words') || '[]')
    const unsolved = WORD_DATA.filter(w => !solved.includes(w.word))
    const pool = unsolved.length >= 8 ? unsolved : WORD_DATA
    return shuffle(pool).slice(0, 8)
  })
  const [idx, setIdx] = useState(0)
  const [scrambled, setScrambled] = useState([])
  const [placed, setPlaced] = useState([])
  const [phase, setPhase] = useState('playing') // playing | solved | info | done
  const [score, setScore] = useState(0)
  const [results, setResults] = useState([])
  const [hints, setHints] = useState(3)
  const [attempts, setAttempts] = useState(0)
  const [showInfo, setShowInfo] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showQuitModal, setShowQuitModal] = useState(false)
  const [pendingNav, setPendingNav] = useState(null)

  const w = words[idx]

  // Initialize each round
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!w) return
    const s = scrambleWord(w.word)
    setScrambled(s.map((ch, i) => ({ id: `s-${i}`, letter: ch })))
    setPlaced(Array(w.word.length).fill(null))
    setPhase('playing')
    setAttempts(0)
    setShowInfo(false)
  }, [idx, w])
  /* eslint-enable react-hooks/set-state-in-effect */

  function handleTileClick(tile, fromIdx) {
    if (phase !== 'playing') return
    playPinDrop()

    // If clicking from placed → return to scrambled
    if (fromIdx !== undefined && placed[fromIdx]) {
      const returned = placed[fromIdx]
      setPlaced(prev => { const n = [...prev]; n[fromIdx] = null; return n })
      setScrambled(prev => [...prev, returned])
      return
    }

    // Place tile in first empty slot
    const emptyIdx = placed.indexOf(null)
    if (emptyIdx === -1) return

    setScrambled(prev => prev.filter(t => t.id !== tile.id))
    setPlaced(prev => {
      const n = [...prev]
      n[emptyIdx] = tile
      // Check if all slots filled
      if (n.every(t => t !== null)) {
        const attempt = n.map(t => t.letter).join('')
        if (attempt === w.word) {
          // Correct!
          setTimeout(() => {
            playCorrect(); vibrate([80])
            const pts = Math.max(100 - attempts * 20, 20)
            setScore(prev => prev + pts)
            setResults(prev => [...prev, { word: w, pts, attempts: attempts + 1 }])
            setPhase('solved')
          }, 200)
        } else {
          // Wrong — shake and return all
          setAttempts(prev => prev + 1)
          playWrong(); vibrate([30, 50, 30])
          setTimeout(() => {
            const allTiles = n.filter(Boolean)
            setPlaced(Array(w.word.length).fill(null))
            setScrambled(prev => shuffle([...prev, ...allTiles]))
          }, 600)
        }
      }
      return n
    })
  }

  function useHint() {
    if (hints <= 0 || phase !== 'playing') return
    // Find first empty or wrong slot and fill with correct letter
    const currentPlaced = [...placed]
    for (let i = 0; i < w.word.length; i++) {
      if (!currentPlaced[i] || currentPlaced[i].letter !== w.word[i]) {
        // Return existing tile if any
        if (currentPlaced[i]) {
          setScrambled(prev => [...prev, currentPlaced[i]])
        }
        // Find correct tile in scrambled
        const correctLetter = w.word[i]
        const tile = scrambled.find(t => t.letter === correctLetter)
        if (tile) {
          currentPlaced[i] = tile
          setScrambled(prev => prev.filter(t => t.id !== tile.id))
          setPlaced([...currentPlaced])
          setHints(prev => prev - 1)
          playPinDrop()
          // Check if solved
          if (currentPlaced.every((t, j) => t && t.letter === w.word[j])) {
            setTimeout(() => {
              playCorrect(); vibrate([80])
              const pts = Math.max(50 - attempts * 10, 10)
              setScore(prev => prev + pts)
              setResults(prev => [...prev, { word: w, pts, attempts: attempts + 1, hinted: true }])
              setPhase('solved')
            }, 300)
          }
          break
        }
      }
    }
  }

  function showDetails() { setShowInfo(true); setPhase('info') }

  function next() {
    if (idx + 1 >= words.length) {
      setPhase('done')
      const maxPts = words.length * 100
      autoSubmitScore({ gameType: 'word', score, maxScore: maxPts, questionCount: words.length })
      // Track solved words
      const solved = JSON.parse(localStorage.getItem('wanda_solved_words') || '[]')
      const newSolved = [...new Set([...solved, ...results.filter(r => r.pts > 0).map(r => r.word.word)])]
      if (newSolved.length >= WORD_DATA.length) localStorage.setItem('wanda_solved_words', '[]')
      else localStorage.setItem('wanda_solved_words', JSON.stringify(newSolved))
      return
    }
    setIdx(prev => prev + 1)
  }

  // Final results
  if (phase === 'done') {
    return (
      <section className="wg-results">
        <ResultCard
          score={score}
          maxScore={words.length * 100}
          correctCount={results.filter(r => r.pts > 0).length}
          totalQuestions={words.length}
          pointsEarned={score}
          gameTitle="Guess the Word"
          gameEmoji="🔤"
          gameType="word"
          onPlayAgain={() => {
            setIdx(0); setScore(0); setResults([]); setHints(3)
            setPhase('playing')
          }}
        >
          <div className="wg-results-list">
            {results.map((r, i) => (
              <div key={i} className="wg-rl-row">
                <span className="wg-rl-word">{r.word.word}</span>
                <span className="wg-rl-cat">{r.word.category}</span>
                <span className="wg-rl-pts">+{r.pts}</span>
              </div>
            ))}
          </div>
        </ResultCard>
      </section>
    )
  }

  // Info view — rich history
  if (showInfo) {
    return (
      <section className="wg-info">
        <div className="wg-info-card">
          {w.image && <img src={w.image} alt={w.word} className="wg-info-img" />}
          <div className="wg-info-badge">{w.category}</div>
          <h2 className="wg-info-title">{w.word}</h2>
          <p className="wg-info-desc">{w.description}</p>

          <div className="wg-info-history">
            <h4>Historical Notes</h4>
            {w.history.map((h, i) => (
              <div key={i} className="wg-history-item">
                <span className="wg-hi-bullet" />
                <p>{h}</p>
              </div>
            ))}
          </div>

          {w.footnotes && (
            <div className="wg-footnotes">
              <h5>Sources</h5>
              {w.footnotes.map((f, i) => (
                <p key={i} className="wg-fn">{f}</p>
              ))}
            </div>
          )}

          <button className="wg-next-btn" onClick={next}>
            {idx + 1 >= words.length ? 'See Results →' : 'Next Word →'}
          </button>
        </div>
      </section>
    )
  }

  function handleQuit(dest) {
    setPendingNav(dest)
    if (phase === 'playing') setShowQuitModal(true)
    else navigate(dest)
  }

  return (
    <section className="game-screen word-game">
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
          <span className="hud-counter">🔤 {idx + 1}/{words.length}</span>
        </div>
        <div className="hud-right">
          <span className="hud-score">{score} pts</span>
        </div>
      </div>

      <div className="wg-body" style={{ marginTop: '70px', padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      {/* Clue */}
      <div className="wg-clue">
        <span className="wg-clue-label">CLUE</span>
        <p className="wg-clue-text">{w.clue}</p>
        <span className="wg-clue-cat">{w.category} · {w.word.length} letters</span>
      </div>

      {/* Answer slots */}
      <div className="wg-slots">
        {placed.map((tile, i) => (
          <div
            key={i}
            className={`wg-slot ${tile ? 'filled' : ''} ${phase === 'solved' ? 'solved' : ''}`}
            onClick={() => tile && handleTileClick(null, i)}
          >
            {tile ? tile.letter : ''}
          </div>
        ))}
      </div>

      {/* Scrambled letters */}
      <div className="wg-letters">
        {scrambled.map(tile => (
          <button
            key={tile.id}
            className="wg-letter"
            onClick={() => handleTileClick(tile)}
            disabled={phase !== 'playing'}
          >
            {tile.letter}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="wg-controls">
        <button className="wg-hint-btn" onClick={useHint} disabled={hints <= 0 || phase !== 'playing'}>
          💡 Hint ({hints})
        </button>
        <button className="wg-skip-btn" onClick={() => {
          setResults(prev => [...prev, { word: w, pts: 0, attempts, skipped: true }])
          next()
        }}>
          Skip →
        </button>
      </div>

      {/* Solved state */}
      {phase === 'solved' && (
        <div className="wg-solved-bar">
          <div className="wg-solved-text">
            <span className="wg-solved-check">✓</span> Correct!
          </div>
          <button className="wg-details-btn" onClick={showDetails}>
            Learn More →
          </button>
        </div>
      )}
      </div>
    </section>
  )
}
