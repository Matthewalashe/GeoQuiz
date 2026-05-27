import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { POSTCARD_QUESTIONS, CONTENT_PACKS } from '../data/postcards.js'
import { playCorrect, playWrong, vibrate } from '../engine/audio.js'
import { autoSubmitScore } from '../engine/leaderboard.js'
import { addXP } from '../engine/xp.js'
import ResultCard from './ResultCard.jsx'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function PostCards() {
  const navigate = useNavigate()
  const [pack, setPack] = useState('all')
  const [started, setStarted] = useState(false)
  const [questions, setQuestions] = useState([])
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState(null)
  const [phase, setPhase] = useState('playing')
  const [score, setScore] = useState(0)
  const [results, setResults] = useState([])
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState(false)
  const [streak, setStreak] = useState(0)

  // Preload next image
  useEffect(() => {
    if (questions.length > 0 && idx + 1 < questions.length) {
      const nextImg = new Image()
      nextImg.src = questions[idx + 1].image
    }
  }, [idx, questions])

  function startGame() {
    const pool = pack === 'all' ? POSTCARD_QUESTIONS : POSTCARD_QUESTIONS.filter(q => q.category === pack)
    setQuestions(shuffle(pool).slice(0, Math.min(12, pool.length)))
    setStarted(true)
  }

  function resetGame() {
    setStarted(false)
    setIdx(0)
    setSelected(null)
    setPhase('playing')
    setScore(0)
    setResults([])
    setImgLoaded(false)
    setImgError(false)
    setStreak(0)
  }

  // Pack selector
  if (!started) {
    return (
      <section className="pc-pack-select">
        <button className="gh-back" onClick={() => navigate('/play')}>← Back</button>
        <h2 className="pc-pack-title">📷 PostCards</h2>
        <p className="pc-pack-sub">Choose a content pack</p>
        <div className="pc-packs">
          {CONTENT_PACKS.map(p => (
            <button
              key={p.id}
              className={`pc-pack-card ${pack === p.id ? 'active' : ''}`}
              onClick={() => setPack(p.id)}
            >
              <span className="pc-pack-label">{p.label}</span>
              <span className="pc-pack-count">{p.count} cards</span>
            </button>
          ))}
        </div>
        <button className="gi-play-btn" style={{ background: '#8b5cf6' }} onClick={startGame}>
          Start PostCards →
        </button>
      </section>
    )
  }

  const q = questions[idx]

  function handleSelect(optIdx) {
    if (phase !== 'playing') return
    setSelected(optIdx)
    const isCorrect = optIdx === q.correct
    if (isCorrect) { playCorrect(); vibrate([50]); setScore(p => p + 100); setStreak(p => p + 1) }
    else { playWrong(); vibrate([30, 50, 30]); setStreak(0) }
    setResults(prev => [...prev, { question: q, selected: optIdx, correct: isCorrect }])
    setPhase('answered')
  }

  function next() {
    if (idx + 1 >= questions.length) {
      // Game complete — save score
      const finalScore = score + (selected === q?.correct ? 100 : 0)
      addXP('POSTCARD_COMPLETE')
      autoSubmitScore({
        gameType: 'postcards',
        score: finalScore,
        maxScore: questions.length * 100,
        questionCount: questions.length,
      })
      setPhase('done')
      return
    }
    setIdx(p => p + 1); setSelected(null); setPhase('playing'); setImgLoaded(false); setImgError(false)
  }

  if (phase === 'done') {
    const correctCount = results.filter(r => r.correct).length
    return (
      <section className="pc-results">
        <ResultCard
          score={score}
          maxScore={questions.length * 100}
          correctCount={correctCount}
          totalQuestions={questions.length}
          pointsEarned={60}
          gameTitle="PostCards"
          gameEmoji="📷"
          gameType="postcards"
          onPlayAgain={resetGame}
        >
          {/* Per-question breakdown */}
          <div className="pc-results-breakdown" style={{ marginTop: '0.75rem' }}>
            {results.map((r, i) => (
              <div key={i} className={`pc-rb-row ${r.correct ? 'correct' : 'wrong'}`}>
                <span className="pc-rb-num">{i + 1}</span>
                <span className="pc-rb-q">{r.question.options[r.question.correct]}</span>
                <span className="pc-rb-icon">{r.correct ? '✓' : '✕'}</span>
              </div>
            ))}
          </div>
        </ResultCard>
      </section>
    )
  }

  return (
    <section className="postcard-game">
      <div className="pc-hud">
        <span className="pc-hud-q">📷 {idx + 1}/{questions.length}</span>
        <div>
          <span className="pc-hud-score">{score} pts</span>
          {streak >= 3 && <span className="pc-hud-streak">🔥{streak}</span>}
        </div>
      </div>

      <div className="pc-image-wrap">
        {!imgLoaded && !imgError && <div className="pc-image-skeleton"><div className="pc-skeleton-pulse" /></div>}
        {imgError ? (
          <div className="pc-image-fallback">
            <span className="pc-fallback-emoji">🏙️</span>
            <span className="pc-fallback-text">Image unavailable</span>
          </div>
        ) : (
          <img src={q.image} alt="Postcard" className={`pc-image ${imgLoaded ? 'loaded' : ''}`}
            onLoad={() => setImgLoaded(true)}
            onError={() => { setImgError(true); setImgLoaded(true) }}
            draggable={false} />
        )}
        <div className="pc-image-badge">{q.category === 'visual' ? 'VISUAL GUESS' : q.category === 'cultural' ? 'CULTURAL' : 'HYPERLOCAL'}</div>
      </div>

      <div className="pc-question"><h3>{q.question}</h3></div>

      <div className="pc-options">
        {q.options.map((opt, i) => {
          let cls = 'pc-option'
          if (phase === 'answered') {
            if (i === q.correct) cls += ' correct'
            else if (i === selected && i !== q.correct) cls += ' wrong'
            else cls += ' dim'
          }
          return (
            <button key={i} className={cls} onClick={() => handleSelect(i)} disabled={phase !== 'playing'}>
              <span className="pc-opt-letter">{String.fromCharCode(65 + i)}</span>
              <span className="pc-opt-text">{opt}</span>
              {phase === 'answered' && i === q.correct && <span className="pc-opt-check">✓</span>}
              {phase === 'answered' && i === selected && i !== q.correct && <span className="pc-opt-check">✕</span>}
            </button>
          )
        })}
      </div>

      {phase === 'answered' && (
        <div className="pc-fact-bar">
          <p className="pc-fact">{q.fact}</p>
          <button className="pc-next-btn" onClick={next}>
            {idx + 1 >= questions.length ? 'See Results →' : 'Next Card →'}
          </button>
        </div>
      )}
    </section>
  )
}
