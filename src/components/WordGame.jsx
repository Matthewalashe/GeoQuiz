import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getWordGame } from '../lib/cms.js'
import { getWordsForLevel, getDifficultyForLevel, getAllLocalWords } from '../data/wordBank.js'
import { playCorrect, playWrong, playPinDrop, vibrate } from '../engine/audio.js'
import { addXP } from '../engine/xp.js'
import { calculateGameReward, addCoins } from '../engine/coinEconomy.js'
import { autoSubmitScore } from '../engine/leaderboard.js'
import { completeLevel } from '../lib/gameService.js'
import { supabase } from '../lib/supabase.js'
import ResultCard from './ResultCard.jsx'
import GameContinueModal from './GameContinueModal.jsx'

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

// ── Level difficulty scaling ──
function getLevelConfig(level) {
  const hints = Math.max(3 - Math.floor((level - 1) / 3), 1)
  const wordsPerRound = 8
  const passThreshold = Math.min(4 + Math.floor((level - 1) / 2), 8)
  const difficulty = getDifficultyForLevel(level)
  return { hints, wordsPerRound, passThreshold, difficulty }
}

// ── LocalStorage for dedup (tracks ALL word IDs ever used) ──
const USED_KEY = 'wanda_word_used_ids'
const LEVEL_KEY = 'wanda_word_level'

function getUsedWordIds() {
  try { return JSON.parse(localStorage.getItem(USED_KEY) || '[]') } catch { return [] }
}
function addUsedWordIds(ids) {
  const merged = [...new Set([...getUsedWordIds(), ...ids])]
  localStorage.setItem(USED_KEY, JSON.stringify(merged))
}
function getStoredLevel() {
  return parseInt(localStorage.getItem(LEVEL_KEY) || '1', 10)
}
function setStoredLevel(level) {
  localStorage.setItem(LEVEL_KEY, String(level))
}

export default function WordGame() {
  const navigate = useNavigate()
  const [cmsWords, setCmsWords] = useState([])
  const [cmsLoading, setCmsLoading] = useState(true)
  const [cmsError, setCmsError] = useState(null)

  // Level progression
  const [level, setLevel] = useState(() => getStoredLevel())
  const levelConfig = getLevelConfig(level)

  // Build the word pool for current level: local bank + CMS, deduped
  function pickWordsForLevel(lvl, cmsPool = []) {
    const usedIds = getUsedWordIds()
    const config = getLevelConfig(lvl)

    // 1. Get words from the local bank for this difficulty
    const localWords = getWordsForLevel(lvl, config.wordsPerRound, usedIds)

    // 2. Also try CMS words — normalize to uppercase + add fallback fields
    const normalizedCms = cmsPool.map(w => ({
      ...w,
      id: w.id || w.word,
      word: (w.word || '').toUpperCase(),
      clue: w.clue || w.description || '',
      category: w.category || 'General',
      description: w.description || '',
      history: w.history || [],
      footnotes: w.footnotes || [],
    }))
    const freshCms = normalizedCms.filter(w => !usedIds.includes(w.id))

    // 3. Combine: prioritise local bank (difficulty-matched), fill gaps with CMS
    let combined = [...localWords]
    if (combined.length < config.wordsPerRound) {
      const needed = config.wordsPerRound - combined.length
      const cmsIds = new Set(combined.map(w => w.id))
      const extras = freshCms.filter(w => !cmsIds.has(w.id || w.word)).slice(0, needed)
      combined = [...combined, ...extras]
    }

    // 4. If still short (extremely unlikely with 100+ words), pull from any unused
    if (combined.length < config.wordsPerRound) {
      const allLocal = getAllLocalWords().filter(w => !usedIds.includes(w.id))
      const existingIds = new Set(combined.map(w => w.id))
      const backfill = allLocal.filter(w => !existingIds.has(w.id))
      combined = [...combined, ...shuffle(backfill)].slice(0, config.wordsPerRound)
    }

    return shuffle(combined).slice(0, config.wordsPerRound)
  }

  function loadWords() {
    setCmsLoading(true); setCmsError(null)
    getWordGame().then(({ data, error }) => {
      // CMS errors are non-fatal — we have the local bank
      if (!error && data) setCmsWords(data)
      // Pick words for current level
      const picked = pickWordsForLevel(level, data || [])
      if (picked.length === 0) {
        setCmsError('No words available. Please try again.')
        setCmsLoading(false)
        return
      }
      setWords(picked)
      setCmsLoading(false)
    }).catch(() => {
      // Network error — use local bank only
      const picked = pickWordsForLevel(level, [])
      setWords(picked)
      setCmsLoading(false)
    })
  }
  useEffect(() => { loadWords() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [words, setWords] = useState([])
  const [idx, setIdx] = useState(0)
  const [scrambled, setScrambled] = useState([])
  const [placed, setPlaced] = useState([])
  const [phase, setPhase] = useState('playing') // playing | solved | info | done | continue
  const [score, setScore] = useState(0)
  const [results, setResults] = useState([])
  const [hints, setHints] = useState(() => getLevelConfig(getStoredLevel()).hints)
  const [attempts, setAttempts] = useState(0)
  const [showInfo, setShowInfo] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showQuitModal, setShowQuitModal] = useState(false)
  const [pendingNav, setPendingNav] = useState(null)
  const [showResultCard, setShowResultCard] = useState(false)
  const [earnedXP, setEarnedXP] = useState(0)
  const [earnedCoins, setEarnedCoins] = useState(0)

  // Lock body scroll while game is mounted (except during info view)
  useEffect(() => {
    if (showInfo) {
      document.body.style.overflow = 'auto'
    } else {
      document.body.style.overflow = 'hidden'
    }
    return () => { document.body.style.overflow = '' }
  }, [showInfo])

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

    if (fromIdx !== undefined && placed[fromIdx]) {
      const returned = placed[fromIdx]
      setPlaced(prev => { const n = [...prev]; n[fromIdx] = null; return n })
      setScrambled(prev => [...prev, returned])
      return
    }

    const emptyIdx = placed.indexOf(null)
    if (emptyIdx === -1) return

    setScrambled(prev => prev.filter(t => t.id !== tile.id))
    setPlaced(prev => {
      const n = [...prev]
      n[emptyIdx] = tile
      if (n.every(t => t !== null)) {
        const attempt = n.map(t => t.letter).join('')
        if (attempt === w.word) {
          setTimeout(() => {
            playCorrect(); vibrate([80])
            const pts = Math.max(100 - attempts * 20, 20)
            setScore(prev => prev + pts)
            setResults(prev => [...prev, { word: w, pts, attempts: attempts + 1 }])
            // Award XP per correct answer
            try {
              const xpResult = addXP('CORRECT_ANSWER')
              setEarnedXP(prev => prev + (xpResult?.xpAdded || 10))
            } catch {}
            setPhase('solved')
          }, 200)
        } else {
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
    const currentPlaced = [...placed]
    for (let i = 0; i < w.word.length; i++) {
      if (!currentPlaced[i] || currentPlaced[i].letter !== w.word[i]) {
        if (currentPlaced[i]) {
          setScrambled(prev => [...prev, currentPlaced[i]])
        }
        const correctLetter = w.word[i]
        const tile = scrambled.find(t => t.letter === correctLetter)
        if (tile) {
          currentPlaced[i] = tile
          setScrambled(prev => prev.filter(t => t.id !== tile.id))
          setPlaced([...currentPlaced])
          setHints(prev => prev - 1)
          playPinDrop()
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
  function backToGame() { setShowInfo(false); setPhase('solved') }

  function next() {
    if (idx + 1 >= words.length) {
      // Round complete — show continue modal
      const maxPts = words.length * 100
      // Award completion XP
      try {
        const xpResult = addXP('WORD_COMPLETE')
        setEarnedXP(prev => prev + (xpResult?.xpAdded || 70))
      } catch {}
      // Award coins based on score
      try {
        const coins = calculateGameReward(score, maxPts)
        if (coins > 0) {
          addCoins(coins, 'Word Game reward')
          setEarnedCoins(coins)
        }
      } catch {}
      autoSubmitScore({ gameType: 'guessword', score, maxScore: maxPts, questionCount: words.length })
      // Track used word IDs so they NEVER repeat
      addUsedWordIds(words.map(w => w.id || w.word))
      setPhase('continue')
      return
    }
    setIdx(prev => prev + 1)
  }

  // ── Continue modal handlers ──
  const correctCount = results.filter(r => r.pts > 0).length
  const passed = correctCount >= levelConfig.passThreshold

  async function syncLevelToDb(lvl, didPass) {
    // Sync with Supabase so LevelSelect shows correct progress
    try {
      if (!supabase) return
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.id) return
      await completeLevel(
        session.user.id,
        'guessword',     // gameType slug matching game_config
        lvl,
        correctCount,
        words.length,
        results.map(r => ({
          question_id: r.word?.id || r.word?.word,
          was_correct: r.pts > 0
        }))
      )
    } catch (e) {
      console.warn('Level sync failed (non-fatal):', e.message)
    }
  }

  function handleContinue() {
    // Passed → unlock next level
    const nextLevel = level + 1
    setStoredLevel(nextLevel)
    setLevel(nextLevel)
    // Sync to DB
    syncLevelToDb(level, true)
    // Reset game state for next level
    const nextConfig = getLevelConfig(nextLevel)
    const picked = pickWordsForLevel(nextLevel, cmsWords)
    setWords(picked)
    setIdx(0); setScore(0); setResults([]); setHints(nextConfig.hints)
    setEarnedXP(0); setEarnedCoins(0)
    setPhase('playing')
    setShowResultCard(false)
  }

  function handleReplay() {
    // Failed → replay same level with fresh words
    syncLevelToDb(level, false)
    const picked = pickWordsForLevel(level, cmsWords)
    setWords(picked)
    setIdx(0); setScore(0); setResults([]); setHints(levelConfig.hints)
    setEarnedXP(0); setEarnedCoins(0)
    setPhase('playing')
    setShowResultCard(false)
  }

  function handleCancel() {
    navigate('/play')
  }

  if (cmsLoading) return <div className="game-lobby"><div className="lb-empty">Loading word game...</div></div>
  if (cmsError) return (
    <div className="game-lobby">
      <button className="gh-back" onClick={() => navigate('/play')}>← Back</button>
      <div className="lb-empty" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ fontSize: '2rem' }}>⚠️</div>
        <p style={{ color: '#ef4444', fontSize: '0.9rem' }}>{cmsError}</p>
        <button onClick={loadWords} style={{ padding: '0.5rem 1.2rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>Try Again</button>
      </div>
    </div>
  )
  if (words.length === 0) return null

  // ── Continue Modal (pass/fail gateway) ──
  if (phase === 'continue' && !showResultCard) {
    return (
      <GameContinueModal
        passed={passed}
        level={level}
        score={score}
        maxScore={words.length * 100}
        correctCount={correctCount}
        totalQuestions={words.length}
        passThreshold={levelConfig.passThreshold}
        gameTitle="Guess the Word"
        gameEmoji="🔤"
        xpEarned={earnedXP}
        coinsEarned={earnedCoins}
        onContinue={handleContinue}
        onReplay={handleReplay}
        onCancel={handleCancel}
      />
    )
  }

  // ── Final results ──
  if (phase === 'done' || showResultCard) {
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
            const picked = pickWordsForLevel(level, cmsWords)
            setWords(picked)
            setIdx(0); setScore(0); setResults([]); setHints(levelConfig.hints)
            setEarnedXP(0); setEarnedCoins(0)
            setPhase('playing')
            setShowResultCard(false)
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
        <button className="wg-info-back" onClick={backToGame}>
          ← Back to Game
        </button>
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

          {w.footnotes && w.footnotes.length > 0 && (
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
          <span className="wg-level-pill">Lv.{level}</span>
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
        {attempts >= 3 && phase === 'playing' && (
          <button className="wg-reveal-btn" onClick={() => {
            const correctTiles = w.word.split('').map((ch, i) => ({ id: `r-${i}`, letter: ch }))
            setPlaced(correctTiles)
            setScrambled([])
            setPhase('revealed')
            setResults(prev => [...prev, { word: w, pts: 0, attempts, revealed: true }])
            playWrong()
          }}>
            Show Answer
          </button>
        )}
        <button className="wg-skip-btn" onClick={() => {
          const correctTiles = w.word.split('').map((ch, i) => ({ id: `r-${i}`, letter: ch }))
          setPlaced(correctTiles)
          setScrambled([])
          setPhase('skipped')
          setResults(prev => [...prev, { word: w, pts: 0, attempts, skipped: true }])
          playWrong()
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
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="wg-details-btn" onClick={showDetails} style={{ background: 'transparent', border: '2px solid var(--primary)', color: 'var(--primary)' }}>
              Learn More →
            </button>
            <button className="wg-details-btn" onClick={next} style={{ background: 'var(--primary)', color: '#fff' }}>
              {idx + 1 >= words.length ? 'Results' : 'Next'} →
            </button>
          </div>
        </div>
      )}

      {/* Skipped / Revealed state */}
      {(phase === 'skipped' || phase === 'revealed') && (
        <div className="wg-solved-bar" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
          <div className="wg-solved-text" style={{ color: '#ef4444' }}>
            <span className="wg-solved-check" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>✗</span>
            Answer: <strong style={{ marginLeft: '0.3rem' }}>{w.word}</strong>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="wg-details-btn" onClick={showDetails}>
              Learn More →
            </button>
            <button className="wg-details-btn" onClick={next} style={{ background: 'var(--primary)', color: '#fff' }}>
              {idx + 1 >= words.length ? 'Results' : 'Next'} →
            </button>
          </div>
        </div>
      )}
      </div>
    </section>
  )
}
