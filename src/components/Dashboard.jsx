import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CATEGORIES } from '../data/questions.js'
import { getXPData, getLevel, getLevelProgress, getLevelTitle, getXPToNextLevel } from '../engine/xp.js'

// Journey milestones — each level unlocks a "location" on the map
const JOURNEY_STOPS = [
  { level: 1, name: 'Tafawa Balewa Square', icon: '◎', color: '#008751' },
  { level: 2, name: 'Third Mainland Bridge', icon: '◈', color: '#3498db' },
  { level: 3, name: 'Lekki Toll Gate', icon: '◎', color: '#e67e22' },
  { level: 4, name: 'National Theatre', icon: '◈', color: '#9b59b6' },
  { level: 5, name: 'Eko Atlantic', icon: '★', color: '#1abc9c' },
  { level: 6, name: 'Badagry Heritage', icon: '◎', color: '#e74c3c' },
  { level: 7, name: 'Ikoyi Club', icon: '◈', color: '#f39c12' },
  { level: 8, name: 'Computer Village', icon: '◎', color: '#2ecc71' },
  { level: 9, name: 'Makoko Waterfront', icon: '◈', color: '#3498db' },
  { level: 10, name: 'Victoria Island', icon: '★', color: '#e91e63' },
  { level: 12, name: 'Apapa Wharf', icon: '◎', color: '#795548' },
  { level: 14, name: 'Obalende Market', icon: '◈', color: '#ff5722' },
  { level: 16, name: 'Ikeja City Mall', icon: '◎', color: '#673ab7' },
  { level: 18, name: 'Ajah Roundabout', icon: '◈', color: '#00bcd4' },
  { level: 20, name: 'Lagos Island', icon: '★', color: '#FFD700' },
  { level: 23, name: 'Banana Island', icon: '◎', color: '#4caf50' },
  { level: 26, name: 'Elegushi Beach', icon: '◈', color: '#03a9f4' },
  { level: 30, name: 'Aso Rock (Abuja)', icon: '★', color: '#ff9800' },
  { level: 35, name: 'Zuma Rock', icon: '◈', color: '#8bc34a' },
  { level: 40, name: 'Cross River NP', icon: '★', color: '#009688' },
  { level: 45, name: 'Yankari Reserve', icon: '◈', color: '#cddc39' },
  { level: 50, name: 'Naija Grandmaster', icon: '★', color: '#FFD700' },
]

export default function Dashboard() {
  const [sessions, setSessions] = useState([])
  const [catStats, setCatStats] = useState({})

  useEffect(() => {
    const raw = JSON.parse(localStorage.getItem('geoquiz_sessions') || '[]')
    setSessions(raw)
    const cs = JSON.parse(localStorage.getItem('geoquiz_cat_stats') || '{}')
    setCatStats(cs)
  }, [])

  const xp = getXPData()
  const level = getLevel(xp.totalXP)
  const progress = getLevelProgress(xp.totalXP)
  const title = getLevelTitle(level)
  const xpToNext = getXPToNextLevel(xp.totalXP)

  const totalGames = sessions.length
  const totalScore = sessions.reduce((s, g) => s + g.score, 0)
  const totalMax = sessions.reduce((s, g) => s + g.max, 0)
  const avgPct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0
  const bestStreak = sessions.reduce((m, g) => Math.max(m, g.streak || 0), 0)
  const perfectGames = sessions.filter(g => g.score === g.max).length

  const mastery = CATEGORIES.map(cat => {
    const s = catStats[cat.id] || { correct: 0, total: 0 }
    const pct = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0
    return { ...cat, pct, correct: s.correct, total: s.total }
  }).sort((a, b) => b.pct - a.pct)

  const exploredCats = mastery.filter(c => c.total > 0).length

  // Find current stop and next stop on journey
  const currentStopIdx = JOURNEY_STOPS.reduce((acc, stop, i) => (level >= stop.level ? i : acc), 0)
  const nextStop = JOURNEY_STOPS[currentStopIdx + 1] || null

  return (
    <section className="dashboard">
      {/* Journey Header */}
      <div className="journey-hero">
        <div className="journey-title-row">
          <span className="journey-emoji">{title.emoji}</span>
          <div>
            <h2 className="journey-heading">{title.title}</h2>
            <div className="journey-subtitle">Level {level} Explorer</div>
          </div>
        </div>
        <div className="journey-xp-bar">
          <div className="journey-xp-fill" style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="journey-xp-info">
          <span>{xp.totalXP} XP</span>
          <span>{xpToNext} XP to Lv.{level + 1}</span>
        </div>

        {/* Streak */}
        <div className="journey-streak-row">
          <div className="journey-stat">
            <div className="journey-stat-val">{xp.streakDays || 0}</div>
            <div className="journey-stat-lbl">Day Streak</div>
          </div>
          <div className="journey-stat">
            <div className="journey-stat-val">{totalGames}</div>
            <div className="journey-stat-lbl">Games</div>
          </div>
          <div className="journey-stat">
            <div className="journey-stat-val">{avgPct}%</div>
            <div className="journey-stat-lbl">Avg Score</div>
          </div>
          <div className="journey-stat">
            <div className="journey-stat-val">{xp.streakFreezes || 0}</div>
            <div className="journey-stat-lbl">Freezes</div>
          </div>
        </div>
      </div>

      {/* Journey Map — Candy Crush style path */}
      <div className="journey-map">
        <h3 className="journey-map-title">Your Exploration Journey</h3>
        {nextStop && (
          <div className="journey-next-hint">
            Next stop: <strong>{nextStop.name}</strong> at Lv.{nextStop.level}
          </div>
        )}
        <div className="journey-path">
          {JOURNEY_STOPS.map((stop, i) => {
            const reached = level >= stop.level
            const isCurrent = i === currentStopIdx
            const isLast = i === JOURNEY_STOPS.length - 1

            return (
              <div key={i} className="journey-node-wrap">
                <div
                  className={`journey-node ${reached ? 'reached' : 'locked'} ${isCurrent ? 'current' : ''}`}
                  style={{ borderColor: reached ? stop.color : '#ccc' }}
                >
                  <span className="journey-node-icon" style={{ color: reached ? stop.color : '#bbb' }}>
                    {stop.icon}
                  </span>
                  <span className="journey-node-level">Lv.{stop.level}</span>
                </div>
                <div className={`journey-node-label ${reached ? '' : 'locked-label'}`}>
                  {reached ? stop.name : '???'}
                </div>
                {!isLast && (
                  <div className={`journey-connector ${reached && level >= (JOURNEY_STOPS[i + 1]?.level || 999) ? 'filled' : ''}`}>
                    <div className="journey-conn-line" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Category Mastery */}
      <div className="journey-mastery">
        <h3>Category Mastery</h3>
        <div className="mastery-grid">
          {mastery.map(cat => (
            <div key={cat.id} className="mastery-card card">
              <div className="mastery-header">
                <span className="mastery-icon">{cat.icon}</span>
                <span className="mastery-name">{cat.label}</span>
                <span className="mastery-pct" style={{ color: `hsl(${(cat.pct / 100) * 120}, 70%, 45%)` }}>{cat.pct}%</span>
              </div>
              <div className="mastery-bar-wrap">
                <div className="mastery-bar-fill" style={{ width: `${cat.pct}%`, background: `hsl(${(cat.pct / 100) * 120}, 70%, 45%)` }} />
              </div>
              <div className="mastery-detail">
                {cat.total > 0 ? `${cat.correct}/${cat.total} correct` : 'Not explored yet'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <Link to="/play" className="btn btn-primary">Keep Exploring</Link>
        <Link to="/achievements" className="btn btn-outline">Achievements</Link>
      </div>
    </section>
  )
}
