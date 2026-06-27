import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckmarkCircleRegular } from '@fluentui/react-icons'
import { addXP } from '../engine/xp.js'
import { calculateGameReward, addCoins } from '../engine/coinEconomy.js'
import { autoSubmitScore } from '../engine/leaderboard.js'
import { RewardsOverlay, useRewardSystem } from '../engine/rewards.jsx'
import ResultCard from './ResultCard.jsx'
import { getCrosswords } from '../lib/cms.js'

export default function CrosswordGame() {
  const navigate = useNavigate()
  const { showStarBurst, openChest, rewardProps } = useRewardSystem()

  // CMS data
  const [PUZZLES, setPUZZLES] = useState([])
  const [cmsLoading, setCmsLoading] = useState(true)
  const [cmsError, setCmsError] = useState(null)

  function loadPuzzles() {
    setCmsLoading(true); setCmsError(null)
    getCrosswords().then(({ data, error }) => {
      if (error) { setCmsError(error); setCmsLoading(false); return }
      setPUZZLES(data)
      setCmsLoading(false)
    })
  }
  useEffect(() => { loadPuzzles() }, [])

  const [selectedPuzzle, setSelectedPuzzle] = useState(null)
  const [started, setStarted] = useState(false)
  const [grid, setGrid] = useState([])
  const [activeClue, setActiveClue] = useState({ dir: 'across', num: 1 })
  const [won, setWon] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showQuitModal, setShowQuitModal] = useState(false)
  const [pendingNav, setPendingNav] = useState(null)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const puzzle = selectedPuzzle ? PUZZLES.find(p => p.id === selectedPuzzle) : null

  function startPuzzle() {
    const sz = puzzle.size || 5
    setGrid(Array(sz).fill(null).map(() => Array(sz).fill('')))
    setActiveClue({ dir: 'across', num: puzzle.across[0].num })
    setWon(false)
    setStarted(true)
  }

  // Build derived maps only when a puzzle is active
  let cellMap = [], numMap = [], activeCells = [], currentClue = null
  const gridSize = puzzle?.size || 5
  if (puzzle && started) {
    cellMap = Array(gridSize).fill(null).map(() => Array(gridSize).fill(false))
    numMap = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null));

    [...puzzle.across, ...puzzle.down].forEach(clue => {
      const isAcross = puzzle.across.includes(clue)
      numMap[clue.row][clue.col] = clue.num
      for (let i = 0; i < clue.answer.length; i++) {
        const r = isAcross ? clue.row : clue.row + i
        const c = isAcross ? clue.col + i : clue.col
        if (r < gridSize && c < gridSize) cellMap[r][c] = true
      }
    })

    currentClue = puzzle[activeClue.dir]?.find(c => c.num === activeClue.num)
    if (currentClue) {
      for (let i = 0; i < currentClue.answer.length; i++) {
        activeCells.push({
          r: activeClue.dir === 'across' ? currentClue.row : currentClue.row + i,
          c: activeClue.dir === 'across' ? currentClue.col + i : currentClue.col
        })
      }
    }
  }

  function handleCellClick(r, c) {
    if (!cellMap[r]?.[c]) return
    const acrossClue = puzzle.across.find(cl => r === cl.row && c >= cl.col && c < cl.col + cl.answer.length)
    const downClue = puzzle.down.find(cl => c === cl.col && r >= cl.row && r < cl.row + cl.answer.length)
    if (activeClue.dir === 'across' && downClue && (!acrossClue || activeCells.some(ac => ac.r === r && ac.c === c))) {
      setActiveClue({ dir: 'down', num: downClue.num })
    } else if (acrossClue) {
      setActiveClue({ dir: 'across', num: acrossClue.num })
    } else if (downClue) {
      setActiveClue({ dir: 'down', num: downClue.num })
    }
  }

  function handleKeyPress(key) {
    if (won || !currentClue) return
    const newGrid = grid.map(row => [...row])
    if (key === 'BACKSPACE') {
      for (let i = currentClue.answer.length - 1; i >= 0; i--) {
        const r = activeClue.dir === 'across' ? currentClue.row : currentClue.row + i
        const c = activeClue.dir === 'across' ? currentClue.col + i : currentClue.col
        if (newGrid[r][c] !== '') { newGrid[r][c] = ''; setGrid(newGrid); break }
      }
      return
    }
    for (let i = 0; i < currentClue.answer.length; i++) {
      const r = activeClue.dir === 'across' ? currentClue.row : currentClue.row + i
      const c = activeClue.dir === 'across' ? currentClue.col + i : currentClue.col
      if (newGrid[r][c] === '') { newGrid[r][c] = key; setGrid(newGrid); checkWin(newGrid); break }
    }
  }

  function checkWin(g) {
    let isWin = true;
    [...puzzle.across, ...puzzle.down].forEach(clue => {
      const isAcross = puzzle.across.includes(clue)
      for (let i = 0; i < clue.answer.length; i++) {
        const r = isAcross ? clue.row : clue.row + i
        const c = isAcross ? clue.col + i : clue.col
        if (g[r]?.[c] !== clue.answer[i]) isWin = false
      }
    })
    if (isWin) {
      setWon(true)
      addXP('GAME_WIN')
      try {
        const coins = calculateGameReward(100)
        if (coins > 0) addCoins(coins, 'Crossword game reward')
      } catch {}
      showStarBurst(3)
      setTimeout(() => openChest(100), 800)
      // Submit to leaderboard
      autoSubmitScore({ gameType: 'crossword', score: 100, maxScore: 100, questionCount: 1 })
    }
  }

  function handleQuit(dest) {
    setPendingNav(dest)
    if (!won) setShowQuitModal(true)
    else navigate(dest)
  }

  const keyboardRows = [
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L'],
    ['Z','X','C','V','B','N','M','BACKSPACE']
  ]

  // Loading / Error
  if (cmsLoading) return <div className="game-lobby"><div className="lb-empty">Loading crosswords...</div></div>
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

  // ── PUZZLE SELECTOR ──────────────────────────────────────────────────────
  if (!started) {
    return (
      <div className="game-lobby">
        <button className="gh-back" onClick={() => navigate('/play')}>← Back</button>
        <h2 className="lobby-title">✏️ Mini Crossword</h2>
        <p className="lobby-sub">Choose a theme to get started</p>
        <div className="lobby-packs">
          {PUZZLES.map(p => (
            <button
              key={p.id}
              className={`lobby-pack-card ${selectedPuzzle === p.id ? 'active' : ''}`}
              style={{ '--pack-color': p.color }}
              onClick={() => setSelectedPuzzle(p.id)}
            >
              <span className="lpc-icon">{p.label.split(' ')[0]}</span>
              <span className="lpc-label">{p.label.split(' ').slice(1).join(' ')}</span>
              <span className="lpc-desc">{p.desc}</span>
              <span className="lpc-count">{p.across.length + p.down.length} clues</span>
            </button>
          ))}
        </div>
        <button
          className="lobby-start-btn"
          disabled={!selectedPuzzle}
          onClick={startPuzzle}
          style={{ background: selectedPuzzle ? (PUZZLES.find(p => p.id === selectedPuzzle)?.color || '#0ea5e9') : undefined }}
        >
          Start Crossword →
        </button>
      </div>
    )
  }

  // ── GAMEPLAY ─────────────────────────────────────────────────────────────
  return (
    <div className="game-screen">
      <RewardsOverlay {...rewardProps} />
      {showQuitModal && (
        <div className="quit-overlay" onClick={() => setShowQuitModal(false)}>
          <div className="quit-modal" onClick={e => e.stopPropagation()}>
            <h3>Quit Puzzle?</h3>
            <p>Your progress will be lost.</p>
            <div className="quit-actions">
              <button className="btn btn-primary" onClick={() => setShowQuitModal(false)}>Keep Playing</button>
              <button className="btn btn-outline quit-confirm" onClick={() => navigate(pendingNav || '/')}>Quit</button>
            </div>
          </div>
        </div>
      )}
      <div className={`legend-sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="legend-section sidebar-nav">
          <button className="sidebar-nav-btn" onClick={() => handleQuit('/')}>Home</button>
          <button className="sidebar-nav-btn" onClick={() => { setStarted(false); setSelectedPuzzle(null) }}>Change Puzzle</button>
          <button className="sidebar-nav-btn" onClick={startPuzzle}>Restart</button>
          <button className="sidebar-nav-btn sidebar-quit" onClick={() => handleQuit('/')}>Quit</button>
        </div>
      </div>
      <button className={`legend-toggle ${menuOpen ? 'shifted' : ''}`} onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? '◀' : '☰'}
      </button>

      <div className="game-hud" style={{ borderImage: 'none', borderColor: 'var(--border)' }}>
        <div className="hud-left">
          <span className="hud-counter">✏️ {puzzle.label}</span>
        </div>
        <div className="hud-right">
          <span className="hud-score">{won ? '✅' : '🧩'}</span>
        </div>
      </div>

      <div className="cw-body">
        {won ? (
          <ResultCard
            score={100}
            maxScore={100}
            pointsEarned={100}
            gameTitle="Crossword"
            gameEmoji="✏️"
            gameType="crossword"
            onPlayAgain={() => { setWon(false); setStarted(false); setSelectedPuzzle(null) }}
          />
        ) : (
          <>
            <div className="cw-clue-bar">
              <strong>{activeClue.num} {activeClue.dir.toUpperCase()}</strong>: {currentClue?.text}
            </div>

            <div className="cw-grid-wrap">
              <div className="cw-grid">
                {cellMap.map((row, r) => (
                  <div key={r} className="cw-row">
                    {row.map((isValid, c) => {
                      const isActive = activeCells.some(ac => ac.r === r && ac.c === c)
                      return (
                        <div key={c}
                          className={`cw-cell ${isValid ? 'valid' : 'black'} ${isActive ? 'active' : ''}`}
                          onClick={() => handleCellClick(r, c)}>
                          {numMap[r][c] && <span className="cw-num">{numMap[r][c]}</span>}
                          <span className="cw-char">{grid[r]?.[c]}</span>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Clues list */}
            <div className="cw-clues-panel">
              <div className="cw-clues-col">
                <div className="cw-clues-header">ACROSS</div>
                {puzzle.across.map(cl => (
                  <button key={cl.num}
                    className={`cw-clue-item ${activeClue.dir === 'across' && activeClue.num === cl.num ? 'active' : ''}`}
                    onClick={() => setActiveClue({ dir: 'across', num: cl.num })}>
                    <span className="cw-clue-num">{cl.num}.</span> {cl.text}
                  </button>
                ))}
              </div>
              <div className="cw-clues-col">
                <div className="cw-clues-header">DOWN</div>
                {puzzle.down.map(cl => (
                  <button key={cl.num}
                    className={`cw-clue-item ${activeClue.dir === 'down' && activeClue.num === cl.num ? 'active' : ''}`}
                    onClick={() => setActiveClue({ dir: 'down', num: cl.num })}>
                    <span className="cw-clue-num">{cl.num}.</span> {cl.text}
                  </button>
                ))}
              </div>
            </div>

            <div className="cw-keyboard">
              {keyboardRows.map((row, i) => (
                <div key={i} className="cw-kb-row">
                  {row.map(key => (
                    <button key={key}
                      className={`cw-key ${key === 'BACKSPACE' ? 'cw-key-wide' : ''}`}
                      onClick={() => handleKeyPress(key)}>
                      {key === 'BACKSPACE' ? '⌫' : key}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
