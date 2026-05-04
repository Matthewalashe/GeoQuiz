import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { POSTCARD_QUESTIONS } from '../data/postcards.js'
import { playCorrect, playWrong, vibrate } from '../engine/audio.js'

function shuffleArray(arr, seed) {
  const a = [...arr]
  let s = seed || Date.now()
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 16807) % 2147483647
    const j = s % (i + 1)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function PostCards() {
  const navigate = useNavigate()
  const [questions] = useState(() => shuffleArray(POSTCARD_QUESTIONS).slice(0, 10))
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState(null)
  const [phase, setPhase] = useState('playing') // playing | answered | done
  const [score, setScore] = useState(0)
  const [results, setResults] = useState([])
  const [imgLoaded, setImgLoaded] = useState(false)
  const [streak, setStreak] = useState(0)

  const q = questions[idx]

  function handleSelect(optIdx) {
    if (phase !== 'playing') return
    setSelected(optIdx)
    const isCorrect = optIdx === q.correct
    if (isCorrect) {
      playCorrect(); vibrate([50])
      setScore(prev => prev + 100)
      setStreak(prev => prev + 1)
    } else {
      playWrong(); vibrate([30, 50, 30])
      setStreak(0)
    }
    setResults(prev => [...prev, { question: q, selected: optIdx, correct: isCorrect }])
    setPhase('answered')
  }

  function next() {
    if (idx + 1 >= questions.length) {
      setPhase('done')
      return
    }
    setIdx(prev => prev + 1)
    setSelected(null)
    setPhase('playing')
    setImgLoaded(false)
  }

  if (phase === 'done') {
    const pct = Math.round((score / (questions.length * 100)) * 100)
    return (
      <section className="pc-results">
        <div className="pc-results-card">
          <div className="pc-results-icon">{pct >= 80 ? '🏆' : pct >= 50 ? '⭐' : '📷'}</div>
          <h2>PostCard Results</h2>
          <div className="pc-results-score">{score}<span>/{questions.length * 100}</span></div>
          <div className="pc-results-pct">{pct}% accuracy</div>
          <div className="pc-results-breakdown">
            {results.map((r, i) => (
              <div key={i} className={`pc-rb-row ${r.correct ? 'correct' : 'wrong'}`}>
                <span className="pc-rb-num">{i + 1}</span>
                <span className="pc-rb-q">{r.question.options[r.question.correct]}</span>
                <span className="pc-rb-icon">{r.correct ? '✓' : '✕'}</span>
              </div>
            ))}
          </div>
          <div className="pc-results-actions">
            <button className="btn btn-primary" onClick={() => navigate('/postcards')}>Play Again</button>
            <button className="btn btn-outline" onClick={() => navigate('/')}>Home</button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="postcard-game">
      {/* HUD */}
      <div className="pc-hud">
        <span className="pc-hud-q">📷 {idx + 1}/{questions.length}</span>
        <span className="pc-hud-score">{score} pts</span>
        {streak >= 3 && <span className="pc-hud-streak">🔥{streak}</span>}
      </div>

      {/* Postcard image */}
      <div className="pc-image-wrap">
        {!imgLoaded && <div className="pc-image-skeleton"><div className="pc-skeleton-pulse" /></div>}
        <img
          src={q.image}
          alt="Postcard"
          className={`pc-image ${imgLoaded ? 'loaded' : ''}`}
          onLoad={() => setImgLoaded(true)}
          draggable={false}
        />
        <div className="pc-image-badge">POSTCARD</div>
      </div>

      {/* Question */}
      <div className="pc-question">
        <h3>{q.question}</h3>
      </div>

      {/* Options */}
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

      {/* Fact + Next */}
      {phase === 'answered' && (
        <div className="pc-fact-bar">
          <p className="pc-fact">{q.fact}</p>
          <button className="pc-next-btn" onClick={next}>
            {idx + 1 >= questions.length ? 'See Results' : 'Next Postcard'} →
          </button>
        </div>
      )}
    </section>
  )
}
