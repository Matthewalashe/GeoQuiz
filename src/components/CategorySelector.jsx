import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CATEGORIES, REGIONS, getFilteredQuestions, getQuestionsByRegion } from '../data/questions.js'

const QUESTION_COUNTS = [10, 15, 20, 25, 30]
const DIFFICULTIES = [
  { id: 'all', label: 'All Levels', color: '#888' },
  { id: 'beginner', label: 'Beginner', color: '#22c55e' },
  { id: 'intermediate', label: 'Medium', color: '#f59e0b' },
  { id: 'expert', label: 'Expert', color: '#ef4444' },
]
const TIMER_OPTIONS = [
  { id: 0, label: 'Off' },
  { id: 30, label: '30s' },
  { id: 45, label: '45s' },
  { id: 60, label: '60s' },
  { id: 90, label: '90s' },
]

export default function CategorySelector() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselected = searchParams.get('cat')
  const mode = searchParams.get('mode')

  const [selectedCats, setSelectedCats] = useState(preselected ? [preselected] : [])
  const [difficulty, setDifficulty] = useState('all')
  const [questionCount, setQuestionCount] = useState(10)
  const [timer, setTimer] = useState(0)
  const [region, setRegion] = useState('lagos')
  const [step, setStep] = useState(mode === 'quick' ? 'go' : 'setup') // setup | go

  const available = getQuestionsByRegion(region, selectedCats, difficulty)

  useEffect(() => {
    if (preselected && !selectedCats.includes(preselected)) {
      setSelectedCats([preselected])
    }
  }, [preselected])

  // Quick play: auto-start
  useEffect(() => {
    if (mode === 'quick') {
      navigate('/game', { state: { categories: [], difficulty: 'all', count: 10, timer: 0, region: 'lagos' } })
    }
  }, [mode])

  function toggleCat(id) {
    setSelectedCats(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  function startGame() {
    if (available.length < 5) {
      alert('Not enough questions. Try adding more categories.')
      return
    }
    const actualCount = Math.min(questionCount, available.length)
    navigate('/game', { state: { categories: selectedCats, difficulty, count: actualCount, timer, region } })
  }

  function startDailyChallenge() {
    const today = new Date().toISOString().slice(0, 10)
    const seed = today.split('-').reduce((a, b) => a * 31 + parseInt(b), 0)
    navigate('/game', { state: { categories: [], difficulty: 'all', count: 10, timer: 45, daily: true, seed } })
  }

  function startBlitz() {
    const pool = getQuestionsByRegion(region, [], 'all')
    navigate('/game', { state: { categories: [], difficulty: 'all', count: Math.min(30, pool.length), timer: 10, region, mode: 'blitz', totalTimer: 300 } })
  }

  const todayStr = new Date().toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <section className="play-page">
      {/* Hero — brought from former Landing */}
      <div className="play-hero">
        <h1>
          <span className="hero-sub">How well do you know</span>
          <span className="hero-main">Nigeria?</span>
        </h1>
        <p className="hero-desc">
          Drop pins on the map. {available.length}+ questions across Lagos & Abuja.
        </p>
      </div>

      {/* How to Play */}
      <div className="how-it-works">
        <h2 className="section-label-home">How to Play</h2>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-num">1</div>
            <h3>📍 Read the clue</h3>
            <p>Each question describes a location in Nigeria.</p>
          </div>
          <div className="step-card">
            <div className="step-num">2</div>
            <h3>🗺️ Drop your pin</h3>
            <p>Tap the map where you think the location is.</p>
          </div>
          <div className="step-card">
            <div className="step-num">3</div>
            <h3>🏆 Score points</h3>
            <p>The closer your pin, the higher your score!</p>
          </div>
        </div>
      </div>

      {/* Mode selector cards */}
      <div className="play-modes">
        <button className="play-mode-card play-mode-daily" onClick={startDailyChallenge}>
          <div className="play-mode-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div className="play-mode-info">
            <div className="play-mode-name">Daily Challenge</div>
            <div className="play-mode-desc">{todayStr} · 10Q · 45s timer</div>
          </div>
          <span className="play-mode-arrow">→</span>
        </button>

        <button className="play-mode-card play-mode-blitz" onClick={startBlitz}>
          <div className="play-mode-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          </div>
          <div className="play-mode-info">
            <div className="play-mode-name">Blitz Mode</div>
            <div className="play-mode-desc">30Q · 5 min total · Race!</div>
          </div>
          <span className="play-mode-arrow">→</span>
        </button>
      </div>

      {/* Custom Game Builder */}
      <div className="play-builder">
        <h3 className="play-builder-title">Custom Game</h3>

        {/* Region */}
        <div className="play-row">
          <span className="play-row-label">Region</span>
          <div className="play-chips">
            {REGIONS.map(r => (
              <button key={r.id} className={`play-chip ${region === r.id ? 'active' : ''}`} onClick={() => setRegion(r.id)}>
                {r.icon} {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="play-row">
          <span className="play-row-label">Categories</span>
          <div className="play-chips play-chips-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                className={`play-chip play-chip-cat ${selectedCats.includes(cat.id) ? 'active' : ''}`}
                onClick={() => toggleCat(cat.id)}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>
          <span className="play-row-hint">
            {selectedCats.length === 0 ? 'All categories' : `${selectedCats.length} selected`} · {available.length} questions
          </span>
        </div>

        {/* Difficulty */}
        <div className="play-row">
          <span className="play-row-label">Difficulty</span>
          <div className="play-chips">
            {DIFFICULTIES.map(d => (
              <button key={d.id}
                className={`play-chip ${difficulty === d.id ? 'active' : ''}`}
                onClick={() => setDifficulty(d.id)}
                style={difficulty === d.id ? { borderColor: d.color, background: d.color, color: '#fff' } : {}}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Questions */}
        <div className="play-row">
          <span className="play-row-label">Questions</span>
          <div className="play-chips">
            {QUESTION_COUNTS.map(n => (
              <button key={n} className={`play-chip ${questionCount === n ? 'active' : ''}`} onClick={() => setQuestionCount(n)}>
                {n}
              </button>
            ))}
          </div>
          {questionCount > available.length && (
            <span className="play-row-warn">Only {available.length} available</span>
          )}
        </div>

        {/* Timer */}
        <div className="play-row">
          <span className="play-row-label">Timer</span>
          <div className="play-chips">
            {TIMER_OPTIONS.map(t => (
              <button key={t.id} className={`play-chip ${timer === t.id ? 'active' : ''}`} onClick={() => setTimer(t.id)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Start */}
        <button className="play-start-btn" onClick={startGame}>
          <span>Start Quiz</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        </button>
      </div>
    </section>
  )
}
