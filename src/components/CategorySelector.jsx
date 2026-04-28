import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CATEGORIES, REGIONS, getFilteredQuestions, getQuestionsByRegion } from '../data/questions.js'

const QUESTION_COUNTS = [10, 15, 20, 25, 30]
const DIFFICULTIES = [
  { id: 'all', label: 'All Levels' },
  { id: 'beginner', label: '🟢 Beginner' },
  { id: 'intermediate', label: '🟡 Intermediate' },
  { id: 'expert', label: '🔴 Expert' },
]
const TIMER_OPTIONS = [
  { id: 0, label: 'No Timer' },
  { id: 30, label: '30s' },
  { id: 45, label: '45s' },
  { id: 60, label: '60s' },
  { id: 90, label: '90s' },
]

export default function CategorySelector() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselected = searchParams.get('cat')

  const [selectedCats, setSelectedCats] = useState(preselected ? [preselected] : [])
  const [difficulty, setDifficulty] = useState('all')
  const [questionCount, setQuestionCount] = useState(10)
  const [timer, setTimer] = useState(0)
  const [region, setRegion] = useState('lagos')

  const available = getQuestionsByRegion(region, selectedCats, difficulty)

  useEffect(() => {
    if (preselected && !selectedCats.includes(preselected)) {
      setSelectedCats([preselected])
    }
  }, [preselected])

  function toggleCat(id) {
    setSelectedCats(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  function startGame() {
    if (available.length < 5) {
      alert('Not enough questions for this selection. Try adding more categories or changing difficulty.')
      return
    }
    const config = {
      categories: selectedCats,
      difficulty,
      count: Math.min(questionCount, available.length),
      timer,
      region,
    }
    navigate('/game', { state: config })
  }

  function startDailyChallenge() {
    // Seed from today's date — everyone gets the same questions
    const today = new Date().toISOString().slice(0, 10) // "2026-04-28"
    const seed = today.split('-').reduce((a, b) => a * 31 + parseInt(b), 0)
    const config = {
      categories: [],
      difficulty: 'all',
      count: 10,
      timer: 45,
      daily: true,
      seed,
    }
    navigate('/game', { state: config })
  }

  return (
    <section className="selector">
      <h2>Configure Your Quiz</h2>
      <p className="subtitle">Pick categories, difficulty, timer, and how many questions you want.</p>

      {/* Daily Challenge */}
      <button className="daily-challenge-btn" onClick={startDailyChallenge}>
        🏆 Daily Challenge — {new Date().toLocaleDateString('en-NG', { weekday: 'long', month: 'short', day: 'numeric' })}
        <br /><span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-secondary)' }}>10 questions · 45s timer · Same for everyone today</span>
      </button>

      {/* Region Selector */}
      <div className="selector-section">
        <label>Region</label>
        <div className="option-grid">
          {REGIONS.map(r => (
            <button key={r.id} className={`option-chip ${region === r.id ? 'selected' : ''}`} onClick={() => setRegion(r.id)}>
              {r.icon} {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="selector-section">
        <label>Categories (pick one or more)</label>
        <div className="option-grid">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              className={`option-chip ${selectedCats.includes(cat.id) ? 'selected' : ''}`}
              onClick={() => toggleCat(cat.id)}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>
        {selectedCats.length === 0 && (
          <p className="mt-1" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            No category selected = all categories included
          </p>
        )}
        <p style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600, marginTop: '0.5rem' }}>
          📝 {available.length} questions available
        </p>
      </div>

      <div className="selector-section">
        <label>Difficulty</label>
        <div className="option-grid">
          {DIFFICULTIES.map(d => (
            <button
              key={d.id}
              className={`option-chip diff-${d.id} ${difficulty === d.id ? 'selected' : ''}`}
              onClick={() => setDifficulty(d.id)}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div className="selector-section">
        <label>⏱️ Timer per Question</label>
        <div className="option-grid">
          {TIMER_OPTIONS.map(t => (
            <button
              key={t.id}
              className={`option-chip ${timer === t.id ? 'selected' : ''}`}
              onClick={() => setTimer(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        {timer > 0 && (
          <p className="mt-1" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            You'll have {timer} seconds per question. Unanswered = 0 points.
          </p>
        )}
      </div>

      <div className="selector-section">
        <label>Number of Questions (min 5)</label>
        <div className="option-grid">
          {QUESTION_COUNTS.map(n => (
            <button
              key={n}
              className={`option-chip ${questionCount === n ? 'selected' : ''}`}
              onClick={() => setQuestionCount(n)}
            >
              {n}
            </button>
          ))}
        </div>
        <p className="mt-1" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {available.length} questions available for this selection
        </p>
      </div>

      <div className="selector-actions">
        <button className="btn btn-primary btn-lg" onClick={startGame}>
          Start Quiz →
        </button>
        <button className="btn btn-outline" onClick={() => navigate('/')}>
          ← Back
        </button>
      </div>
    </section>
  )
}
