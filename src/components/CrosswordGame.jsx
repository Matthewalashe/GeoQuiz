import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckmarkCircleRegular } from '@fluentui/react-icons'
import { addXP } from '../engine/xp.js'
import { RewardsOverlay, useRewardSystem } from '../engine/rewards.jsx'

// ── PUZZLES ───────────────────────────────────────────────────────────────────
const PUZZLES = [
  {
    id: 'lagos',
    label: '🌊 Lagos Icons',
    desc: 'Bridges, markets & landmarks',
    color: '#0ea5e9',
    size: 5,
    across: [
      { num: 1, text: 'Commercial capital of Nigeria', answer: 'LAGOS', row: 0, col: 0 },
      { num: 4, text: 'Native name for Lagos Island', answer: 'EKO', row: 2, col: 1 },
    ],
    down: [
      { num: 1, text: 'Affluent Lagos peninsula (Lekki)', answer: 'LEKKI', row: 0, col: 0 },
      { num: 2, text: '___maiko — a Lagos suburb', answer: 'OKOKO', row: 0, col: 3 },
      { num: 3, text: 'Spicy Nigerian grilled meat snack', answer: 'SUYA', row: 0, col: 4 },
    ]
  },
  {
    id: 'culture',
    label: '🎭 Culture & Food',
    desc: 'Festivals, food & Yoruba words',
    color: '#f97316',
    size: 5,
    across: [
      { num: 1, text: 'Yoruba masquerade festival unique to Lagos', answer: 'EYO', row: 0, col: 0 },
      { num: 3, text: 'Popular Lagos street breakfast bread from Agege', answer: 'AGEGE', row: 2, col: 0 },
    ],
    down: [
      { num: 1, text: 'Lagos beach where horses gallop', answer: 'EKO', row: 0, col: 0 },
      { num: 2, text: 'Yoruba word for child / friend (slang)', answer: 'OMO', row: 0, col: 2 },
      { num: 4, text: 'The "abami ___" — Fela Kuti nickname (eda)', answer: 'EDA', row: 2, col: 3 },
    ]
  },
  {
    id: 'nigeria',
    label: '🇳🇬 Nigeria Knows',
    desc: 'History, geography & leaders',
    color: '#22c55e',
    size: 5,
    across: [
      { num: 1, text: "Nigeria's federal capital territory", answer: 'ABUJA', row: 0, col: 0 },
      { num: 4, text: 'Tallest rock in Nigeria (725m)', answer: 'ZUMA', row: 3, col: 1 },
    ],
    down: [
      { num: 1, text: "Igbo war leader — Biafran general", answer: 'OJUKWU', row: 0, col: 0 },
      { num: 2, text: "Nigeria's longest river (shared name)", answer: 'BENUE', row: 0, col: 2 },
      { num: 3, text: 'Nobel Laureate: Wole ___', answer: 'SOYINKA', row: 0, col: 4 },
    ]
  }
]

export default function CrosswordGame() {
  const navigate = useNavigate()
  const { showStarBurst, openChest, rewardProps } = useRewardSystem()
  const [selectedPuzzle, setSelectedPuzzle] = useState(null)
  const [started, setStarted] = useState(false)
  const [grid, setGrid] = useState([])
  const [activeClue, setActiveClue] = useState({ dir: 'across', num: 1 })
  const [won, setWon] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showQuitModal, setShowQuitModal] = useState(false)
  const [pendingNav, setPendingNav] = useState(null)

  const puzzle = selectedPuzzle ? PUZZLES.find(p => p.id === selectedPuzzle) : null

  function startPuzzle() {
    setGrid(Array(5).fill(null).map(() => Array(5).fill('')))
    setActiveClue({ dir: 'across', num: puzzle.across[0].num })
    setWon(false)
    setStarted(true)
  }

  // Build derived maps only when a puzzle is active
  let cellMap = [], numMap = [], activeCells = [], currentClue = null
  if (puzzle && started) {
    cellMap = Array(5).fill(null).map(() => Array(5).fill(false))
    numMap = Array(5).fill(null).map(() => Array(5).fill(null));

    [...puzzle.across, ...puzzle.down].forEach(clue => {
      const isAcross = puzzle.across.includes(clue)
      numMap[clue.row][clue.col] = clue.num
      for (let i = 0; i < clue.answer.length; i++) {
        const r = isAcross ? clue.row : clue.row + i
        const c = isAcross ? clue.col + i : clue.col
        if (r < 5 && c < 5) cellMap[r][c] = true
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
      addXP('GAME_WIN', 100)
      showStarBurst(3)
      setTimeout(() => openChest(100), 800)
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
          <div className="game-end-card">
            <CheckmarkCircleRegular fontSize={64} style={{ color: '#22c55e' }} />
            <h2>Puzzle Solved! 🎉</h2>
            <div className="game-end-score">+100 XP</div>
            <div className="game-end-actions">
              <button className="btn btn-primary" onClick={() => { setStarted(false); setSelectedPuzzle(null) }}>Try Another</button>
              <button className="btn btn-outline" onClick={() => navigate('/play')}>Back to Hub</button>
            </div>
          </div>
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
