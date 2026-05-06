import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeftRegular, CheckmarkCircleRegular } from '@fluentui/react-icons'
import { addXP } from '../engine/xp.js'

// Simple 5x5 Mini Crossword
const PUZZLE = {
  size: 5,
  across: [
    { num: 1, text: 'Commercial capital of Nigeria', answer: 'LAGOS', row: 0, col: 0 },
    { num: 4, text: 'Native name for Lagos Island', answer: 'EKO', row: 2, col: 1 },
  ],
  down: [
    { num: 1, text: 'Affluent peninsula in Lagos', answer: 'LEKKI', row: 0, col: 0 },
    { num: 2, text: '____maiko (Lagos area)', answer: 'OKOKO', row: 0, col: 3 },
    { num: 3, text: 'Spicy grilled meat', answer: 'SUYA', row: 0, col: 4 },
  ]
}

export default function CrosswordGame() {
  const navigate = useNavigate()
  const [grid, setGrid] = useState(Array(5).fill().map(() => Array(5).fill('')))
  const [activeClue, setActiveClue] = useState({ dir: 'across', num: 1 })
  const [won, setWon] = useState(false)
  
  // Calculate which cells are valid
  const cellMap = Array(5).fill().map(() => Array(5).fill(false))
  const numMap = Array(5).fill().map(() => Array(5).fill(null))
  
  ;[...PUZZLE.across, ...PUZZLE.down].forEach(clue => {
    const isAcross = PUZZLE.across.includes(clue)
    numMap[clue.row][clue.col] = clue.num
    for (let i = 0; i < clue.answer.length; i++) {
      const r = isAcross ? clue.row : clue.row + i
      const c = isAcross ? clue.col + i : clue.col
      if (r < 5 && c < 5) cellMap[r][c] = true
    }
  })

  // Highlighted cells for active clue
  const currentClue = PUZZLE[activeClue.dir].find(c => c.num === activeClue.num)
  const activeCells = []
  if (currentClue) {
    for (let i = 0; i < currentClue.answer.length; i++) {
      activeCells.push({
        r: activeClue.dir === 'across' ? currentClue.row : currentClue.row + i,
        c: activeClue.dir === 'across' ? currentClue.col + i : currentClue.col
      })
    }
  }

  function handleCellClick(r, c) {
    if (!cellMap[r][c]) return

    // Find clues that intersect this cell
    const acrossClue = PUZZLE.across.find(cl => r === cl.row && c >= cl.col && c < cl.col + cl.answer.length)
    const downClue = PUZZLE.down.find(cl => c === cl.col && r >= cl.row && r < cl.row + cl.answer.length)

    if (activeClue.dir === 'across' && downClue && (!acrossClue || activeCells.some(ac => ac.r === r && ac.c === c))) {
      setActiveClue({ dir: 'down', num: downClue.num })
    } else if (acrossClue) {
      setActiveClue({ dir: 'across', num: acrossClue.num })
    } else if (downClue) {
      setActiveClue({ dir: 'down', num: downClue.num })
    }
  }

  function handleKeyPress(key) {
    if (won) return
    if (!currentClue) return

    const newGrid = [...grid.map(row => [...row])]
    
    if (key === 'BACKSPACE') {
      // Find the last filled cell in the current clue
      for (let i = currentClue.answer.length - 1; i >= 0; i--) {
        const r = activeClue.dir === 'across' ? currentClue.row : currentClue.row + i
        const c = activeClue.dir === 'across' ? currentClue.col + i : currentClue.col
        if (newGrid[r][c] !== '') {
          newGrid[r][c] = ''
          setGrid(newGrid)
          break
        }
      }
      return
    }

    // Find first empty cell in current clue
    for (let i = 0; i < currentClue.answer.length; i++) {
      const r = activeClue.dir === 'across' ? currentClue.row : currentClue.row + i
      const c = activeClue.dir === 'across' ? currentClue.col + i : currentClue.col
      if (newGrid[r][c] === '') {
        newGrid[r][c] = key
        setGrid(newGrid)
        checkWin(newGrid)
        break
      }
    }
  }

  function checkWin(currentGrid) {
    let isWin = true
    ;[...PUZZLE.across, ...PUZZLE.down].forEach(clue => {
      const isAcross = PUZZLE.across.includes(clue)
      for (let i = 0; i < clue.answer.length; i++) {
        const r = isAcross ? clue.row : clue.row + i
        const c = isAcross ? clue.col + i : clue.col
        if (currentGrid[r][c] !== clue.answer[i]) {
          isWin = false
        }
      }
    })

    if (isWin) {
      setWon(true)
      addXP('GAME_WIN', 100)
    }
  }

  const keyboardRows = [
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L'],
    ['Z','X','C','V','B','N','M','BACKSPACE']
  ]

  return (
    <div className="game-screen">
      <header className="game-header">
        <button className="gh-back-btn" onClick={() => navigate('/play')}>
          <ArrowLeftRegular fontSize={24} />
        </button>
        <div className="gh-score">
          <span className="gh-score-label">Mini Crossword</span>
        </div>
      </header>

      <div className="cw-body">
        {won ? (
          <div className="cw-win">
            <CheckmarkCircleRegular fontSize={64} style={{ color: '#22c55e' }} />
            <h2>Puzzle Solved!</h2>
            <p>+100 XP</p>
            <button className="btn btn-primary" onClick={() => navigate('/play')}>Back to Hub</button>
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
                        <div 
                          key={c} 
                          className={`cw-cell ${isValid ? 'valid' : 'black'} ${isActive ? 'active' : ''}`}
                          onClick={() => handleCellClick(r, c)}
                        >
                          {numMap[r][c] && <span className="cw-num">{numMap[r][c]}</span>}
                          <span className="cw-char">{grid[r][c]}</span>
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="cw-keyboard">
              {keyboardRows.map((row, i) => (
                <div key={i} className="cw-kb-row">
                  {row.map(key => (
                    <button 
                      key={key} 
                      className={`cw-key ${key === 'BACKSPACE' ? 'cw-key-wide' : ''}`}
                      onClick={() => handleKeyPress(key)}
                    >
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
