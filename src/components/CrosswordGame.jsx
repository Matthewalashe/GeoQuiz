import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckmarkCircleRegular } from '@fluentui/react-icons'
import { addXP } from '../engine/xp.js'
import { autoSubmitScore } from '../engine/leaderboard.js'
import { RewardsOverlay, useRewardSystem } from '../engine/rewards.jsx'
import PostGameLoop from './PostGameLoop.jsx'

// ── PUZZLES (20 themed mini-crosswords) ──────────────────────────────────────
const PUZZLES = [
  { id: 'lagos', label: '🌊 Lagos Icons', desc: 'Bridges, markets & landmarks', color: '#0ea5e9', size: 5,
    across: [
      { num: 1, text: 'Commercial capital of Nigeria', answer: 'LAGOS', row: 0, col: 0 },
      { num: 4, text: 'Native name for Lagos Island', answer: 'EKO', row: 2, col: 1 },
    ],
    down: [
      { num: 1, text: 'Affluent Lagos peninsula', answer: 'LEKKI', row: 0, col: 0 },
      { num: 2, text: '___maiko — a Lagos suburb', answer: 'OKOKO', row: 0, col: 3 },
      { num: 3, text: 'Spicy Nigerian grilled meat snack', answer: 'SUYA', row: 0, col: 4 },
    ]
  },
  { id: 'culture', label: '🎭 Culture & Food', desc: 'Festivals, food & Yoruba words', color: '#f97316', size: 5,
    across: [
      { num: 1, text: 'Yoruba masquerade festival unique to Lagos', answer: 'EYO', row: 0, col: 0 },
      { num: 3, text: 'Popular Lagos street breakfast bread', answer: 'AGEGE', row: 2, col: 0 },
    ],
    down: [
      { num: 1, text: 'Lagos beach where horses gallop', answer: 'EKO', row: 0, col: 0 },
      { num: 2, text: 'Yoruba word for child / friend (slang)', answer: 'OMO', row: 0, col: 2 },
      { num: 4, text: 'The "abami ___" — Fela Kuti nickname', answer: 'EDA', row: 2, col: 3 },
    ]
  },
  { id: 'nigeria', label: '🇳🇬 Nigeria Knows', desc: 'History, geography & leaders', color: '#22c55e', size: 6,
    across: [
      { num: 1, text: "Nigeria's federal capital territory", answer: 'ABUJA', row: 0, col: 0 },
      { num: 4, text: 'Tallest rock in Nigeria (725m)', answer: 'ZUMA', row: 3, col: 1 },
      { num: 5, text: "Nigeria's currency", answer: 'NAIRA', row: 5, col: 0 },
    ],
    down: [
      { num: 1, text: 'The first president of Nigeria', answer: 'AZIKI', row: 0, col: 0 },
      { num: 2, text: "Nigeria's longest river (shared name)", answer: 'BENUE', row: 0, col: 2 },
      { num: 3, text: 'Nobel Laureate: Wole ___', answer: 'SOYIN', row: 0, col: 4 },
    ]
  },
  { id: 'rivers', label: '🏞️ Rivers & Water', desc: 'Rivers, lakes & waterfalls', color: '#06b6d4', size: 5,
    across: [
      { num: 1, text: 'River that gives Nigeria its name', answer: 'NIGER', row: 0, col: 0 },
      { num: 3, text: 'Longest river entirely in Nigeria', answer: 'BENUE', row: 2, col: 0 },
    ],
    down: [
      { num: 1, text: 'Waterfall town in Osun State (Erin-Ijesha)', answer: 'NILE', row: 0, col: 0 },
      { num: 2, text: 'Lake in Borno State, shrinking fast', answer: 'CHAD', row: 0, col: 3 },
    ]
  },
  { id: 'states', label: '🗺️ State Capitals', desc: 'Match states to capitals', color: '#8b5cf6', size: 5,
    across: [
      { num: 1, text: 'Capital of Kano State', answer: 'KANO', row: 0, col: 0 },
      { num: 3, text: 'Capital of Rivers State', answer: 'PHC', row: 2, col: 0 },
      { num: 4, text: 'Capital of Oyo State', answer: 'IBADAN', row: 3, col: 0 },
    ],
    down: [
      { num: 1, text: 'Capital of Kaduna State', answer: 'KAD', row: 0, col: 0 },
      { num: 2, text: 'Capital of Ogun State', answer: 'ABEO', row: 0, col: 2 },
    ]
  },
  { id: 'food', label: '🍲 Nigerian Food', desc: 'Dishes, snacks & ingredients', color: '#ef4444', size: 5,
    across: [
      { num: 1, text: 'Famous Nigerian rice dish', answer: 'JOLLOF', row: 0, col: 0 },
      { num: 3, text: 'Fried bean cake (breakfast staple)', answer: 'AKARA', row: 2, col: 0 },
    ],
    down: [
      { num: 1, text: 'Cassava flour meal (swallow)', answer: 'GARRI', row: 0, col: 0 },
      { num: 2, text: 'Fermented locust bean condiment', answer: 'OGIRI', row: 0, col: 3 },
    ]
  },
  { id: 'music', label: '🎵 Nigerian Music', desc: 'Artists, genres & hits', color: '#ec4899', size: 5,
    across: [
      { num: 1, text: 'Genre Fela Kuti created', answer: 'AFRO', row: 0, col: 0 },
      { num: 3, text: 'Wizkid hit song "___" (Come Closer)', answer: 'OJUEL', row: 2, col: 0 },
    ],
    down: [
      { num: 1, text: 'Burna Boy album: African ___ (Giant)', answer: 'AFRI', row: 0, col: 0 },
      { num: 2, text: 'Lagos nightclub island for concerts', answer: 'ROVE', row: 0, col: 3 },
    ]
  },
  { id: 'sport', label: '⚽ Nigerian Sports', desc: 'Football, athletes & records', color: '#22c55e', size: 5,
    across: [
      { num: 1, text: 'Nigeria national football team (Super ___)', answer: 'EAGLE', row: 0, col: 0 },
      { num: 3, text: 'Olympic gold sprinter: Blessing ___', answer: 'OKAGB', row: 2, col: 0 },
    ],
    down: [
      { num: 1, text: 'Legendary striker: Jay-Jay ___', answer: 'EAKIN', row: 0, col: 0 },
      { num: 2, text: 'City of the 2003 All Africa Games', answer: 'ABUJA', row: 0, col: 3 },
    ]
  },
  { id: 'pidgin', label: '🗣️ Pidgin English', desc: 'Translate the slangs!', color: '#f59e0b', size: 5,
    across: [
      { num: 1, text: '"How far" means ___', answer: 'HELLO', row: 0, col: 0 },
      { num: 3, text: '"Wahala" means ___', answer: 'TROUB', row: 2, col: 0 },
    ],
    down: [
      { num: 1, text: '"Hustle" means to ___', answer: 'GRIND', row: 0, col: 0 },
      { num: 2, text: '"E choke" means it\'s ___', answer: 'EPIC', row: 0, col: 3 },
    ]
  },
  { id: 'nollywood', label: '🎬 Nollywood', desc: 'Movies, actors & directors', color: '#a855f7', size: 5,
    across: [
      { num: 1, text: 'Nigeria\'s film industry', answer: 'NOLLY', row: 0, col: 0 },
      { num: 3, text: 'Actor: Genevieve ___ (Nnaji)', answer: 'NNAJI', row: 2, col: 0 },
    ],
    down: [
      { num: 1, text: 'First Nollywood film (1992): Living in ___', answer: 'BOND', row: 0, col: 0 },
      { num: 2, text: 'Comedy king: ___ Bello-Osagie (AY)', answer: 'ADEYI', row: 0, col: 3 },
    ]
  },
  { id: 'yoruba', label: '🏛️ Yoruba Words', desc: 'Basic Yoruba vocabulary', color: '#0ea5e9', size: 5,
    across: [
      { num: 1, text: 'Yoruba for "water"', answer: 'OMI', row: 0, col: 0 },
      { num: 3, text: 'Yoruba for "house"', answer: 'ILE', row: 2, col: 0 },
    ],
    down: [
      { num: 1, text: 'Yoruba for "money"', answer: 'OWO', row: 0, col: 0 },
      { num: 2, text: 'Yoruba for "road"', answer: 'ONA', row: 0, col: 2 },
    ]
  },
  { id: 'igbo', label: '🌴 Igbo Words', desc: 'Basic Igbo vocabulary', color: '#22c55e', size: 5,
    across: [
      { num: 1, text: 'Igbo for "thank you"', answer: 'DALU', row: 0, col: 0 },
      { num: 3, text: 'Igbo for "food"', answer: 'NRI', row: 2, col: 0 },
    ],
    down: [
      { num: 1, text: 'Igbo new yam festival', answer: 'DIRI', row: 0, col: 0 },
      { num: 2, text: 'Igbo for "one" (otu)', answer: 'OTU', row: 0, col: 2 },
    ]
  },
  { id: 'hausa', label: '🕌 Hausa Words', desc: 'Basic Hausa vocabulary', color: '#f97316', size: 5,
    across: [
      { num: 1, text: 'Hausa for "welcome"', answer: 'SANNU', row: 0, col: 0 },
      { num: 3, text: 'Hausa for "market"', answer: 'KASUWA', row: 2, col: 0 },
    ],
    down: [
      { num: 1, text: 'Hausa for "king" (Sarki)', answer: 'SARKI', row: 0, col: 0 },
      { num: 2, text: 'Hausa for "water"', answer: 'RUWA', row: 0, col: 3 },
    ]
  },
  { id: 'landmarks', label: '🏗️ Landmarks', desc: 'Famous Nigerian structures', color: '#64748b', size: 5,
    across: [
      { num: 1, text: 'Rock housing the Presidential Villa', answer: 'ASO', row: 0, col: 0 },
      { num: 3, text: 'Gateway rock on Abuja highway', answer: 'ZUMA', row: 2, col: 0 },
    ],
    down: [
      { num: 1, text: 'Abeokuta rock fortress', answer: 'OLUMO', row: 0, col: 0 },
      { num: 2, text: 'Sacred grove in Osun State', answer: 'OSUN', row: 0, col: 2 },
    ]
  },
  { id: 'transport', label: '🚐 Transport', desc: 'Getting around Nigeria', color: '#eab308', size: 5,
    across: [
      { num: 1, text: 'Yellow Lagos bus (VW T3)', answer: 'DANFO', row: 0, col: 0 },
      { num: 3, text: 'Three-wheeled taxi', answer: 'KEKE', row: 2, col: 0 },
    ],
    down: [
      { num: 1, text: 'Motorbike taxi (banned in Lagos)', answer: 'OKADA', row: 0, col: 0 },
      { num: 2, text: 'Lagos rapid transit bus', answer: 'BRT', row: 0, col: 3 },
    ]
  },
  { id: 'markets', label: '🛒 Famous Markets', desc: 'Where Lagos shops', color: '#ef4444', size: 5,
    across: [
      { num: 1, text: 'Largest tech market in Africa (Ikeja)', answer: 'COMP', row: 0, col: 0 },
      { num: 3, text: 'Auto parts market in Mushin', answer: 'LADIP', row: 2, col: 0 },
    ],
    down: [
      { num: 1, text: 'Biggest market on Lagos Island', answer: 'BALOG', row: 0, col: 0 },
      { num: 2, text: 'Mile 12 sells mainly ___', answer: 'FOOD', row: 0, col: 3 },
    ]
  },
  { id: 'festivals', label: '🎊 Festivals', desc: 'Celebrations across Nigeria', color: '#a855f7', size: 5,
    across: [
      { num: 1, text: 'Calabar carnival month', answer: 'DEC', row: 0, col: 0 },
      { num: 3, text: 'Durbar is celebrated during ___ (Eid)', answer: 'EID', row: 2, col: 0 },
    ],
    down: [
      { num: 1, text: 'Ijebu-Ode horse festival: Ojude ___', answer: 'OBA', row: 0, col: 0 },
      { num: 2, text: 'Argungu ___ festival in Kebbi', answer: 'FISH', row: 0, col: 2 },
    ]
  },
  { id: 'nature', label: '🌿 Wildlife & Nature', desc: 'Parks, reserves & animals', color: '#16a34a', size: 5,
    across: [
      { num: 1, text: 'Game reserve in Bauchi State', answer: 'YANK', row: 0, col: 0 },
      { num: 3, text: 'Gorilla sanctuary in Cross River', answer: 'AFI', row: 2, col: 0 },
    ],
    down: [
      { num: 1, text: 'Lekki conservation center walk: canopy ___', answer: 'WALK', row: 0, col: 0 },
      { num: 2, text: 'Nigeria\'s largest national park: Gashaka ___', answer: 'GUMTI', row: 0, col: 3 },
    ]
  },
  { id: 'history', label: '📜 Nigerian History', desc: 'Key dates & events', color: '#78716c', size: 5,
    across: [
      { num: 1, text: 'Year Nigeria gained independence', answer: 'SIXTY', row: 0, col: 0 },
      { num: 3, text: 'Civil war region (1967-70)', answer: 'BIAFR', row: 2, col: 0 },
    ],
    down: [
      { num: 1, text: 'First PM: Tafawa ___', answer: 'BALEW', row: 0, col: 0 },
      { num: 2, text: 'City that was capital before Abuja', answer: 'LAGOS', row: 0, col: 2 },
    ]
  },
  { id: 'tech', label: '💻 Nigerian Tech', desc: 'Startups & innovation', color: '#0284c7', size: 5,
    across: [
      { num: 1, text: 'Fintech unicorn founded by Shola Akinlade', answer: 'PAYSTACK', row: 0, col: 0 },
      { num: 3, text: 'Ride-hailing app popular in Lagos', answer: 'BOLT', row: 2, col: 0 },
    ],
    down: [
      { num: 1, text: 'CcHub innovation hub location in Yaba', answer: 'YABA', row: 0, col: 0 },
      { num: 2, text: 'Flutterwave payment ___', answer: 'API', row: 0, col: 3 },
    ]
  },
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
          <>
          <div className="game-end-card">
            <CheckmarkCircleRegular fontSize={64} style={{ color: '#22c55e' }} />
            <h2>Puzzle Solved! 🎉</h2>
            <div className="game-end-score">+100 XP</div>
            <div className="game-end-actions">
              <button className="btn btn-primary" onClick={() => { setStarted(false); setSelectedPuzzle(null) }}>Try Another</button>
              <button className="btn btn-outline" onClick={() => navigate('/play')}>Back to Hub</button>
            </div>
          </div>
          <PostGameLoop gameType="crossword" onPlayAgain={() => { setStarted(false); setSelectedPuzzle(null) }} />
          </>
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
