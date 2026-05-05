import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { POSTCARD_QUESTIONS, CONTENT_PACKS } from '../data/postcards.js'
import { playCorrect, playWrong, vibrate } from '../engine/audio.js'

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
  const [streak, setStreak] = useState(0)

  function startGame() {
    const pool = pack === 'all' ? POSTCARD_QUESTIONS : POSTCARD_QUESTIONS.filter(q => q.category === pack)
    setQuestions(shuffle(pool).slice(0, Math.min(12, pool.length)))
    setStarted(true)
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
    if (idx + 1 >= questions.length) { setPhase('done'); return }
    setIdx(p => p + 1); setSelected(null); setPhase('playing'); setImgLoaded(false)
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
            <button className="btn btn-primary" onClick={() => window.location.reload()}>Play Again</button>
            <button className="btn btn-outline" onClick={() => navigate('/play')}>Games</button>
          </div>
        </div>
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
        {!imgLoaded && <div className="pc-image-skeleton"><div className="pc-skeleton-pulse" /></div>}
        <img src={q.image} alt="Postcard" className={`pc-image ${imgLoaded ? 'loaded' : ''}`}
          onLoad={() => setImgLoaded(true)} draggable={false} />
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
