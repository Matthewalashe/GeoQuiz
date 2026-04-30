import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getXPData, getLevel, getLevelProgress, getLevelTitle, getXPToNextLevel } from '../engine/xp.js'

const AVATARS = ['🧭', '🗺️', '🌍', '🎯', '⚡', '🔥', '🌟', '🏆', '👑', '🛰️', '🎓', '🧑‍🚀', '🦁', '🐊', '🦅']

const JOURNEY_STOPS = [
  { level: 1, name: 'Tafawa Balewa Square', color: '#008751' },
  { level: 2, name: 'Third Mainland Bridge', color: '#3498db' },
  { level: 3, name: 'Lekki Toll Gate', color: '#e67e22' },
  { level: 4, name: 'National Theatre', color: '#9b59b6' },
  { level: 5, name: 'Eko Atlantic', color: '#1abc9c' },
  { level: 6, name: 'Badagry Heritage', color: '#e74c3c' },
  { level: 7, name: 'Ikoyi Club', color: '#f39c12' },
  { level: 8, name: 'Computer Village', color: '#2ecc71' },
  { level: 9, name: 'Makoko Waterfront', color: '#3498db' },
  { level: 10, name: 'Victoria Island', color: '#e91e63' },
  { level: 12, name: 'Apapa Wharf', color: '#795548' },
  { level: 14, name: 'Obalende Market', color: '#ff5722' },
  { level: 16, name: 'Ikeja City Mall', color: '#673ab7' },
  { level: 18, name: 'Ajah Roundabout', color: '#00bcd4' },
  { level: 20, name: 'Lagos Island', color: '#FFD700' },
  { level: 23, name: 'Banana Island', color: '#4caf50' },
  { level: 26, name: 'Elegushi Beach', color: '#03a9f4' },
  { level: 30, name: 'Aso Rock, Abuja', color: '#ff9800' },
  { level: 35, name: 'Zuma Rock', color: '#8bc34a' },
  { level: 40, name: 'Cross River NP', color: '#009688' },
  { level: 45, name: 'Yankari Reserve', color: '#cddc39' },
  { level: 50, name: 'Naija Grandmaster', color: '#FFD700' },
]

export default function Dashboard() {
  const [sessions] = useState(() => JSON.parse(localStorage.getItem('geoquiz_sessions') || '[]'))
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('geoquiz_player') || 'Explorer')
  const [avatar, setAvatar] = useState(() => localStorage.getItem('geoquiz_avatar') || '🧭')
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(playerName)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)

  const xp = getXPData()
  const level = getLevel(xp.totalXP)
  const progress = getLevelProgress(xp.totalXP)
  const title = getLevelTitle(level)
  const xpToNext = getXPToNextLevel(xp.totalXP)

  const totalGames = sessions.length
  const totalScore = sessions.reduce((s, g) => s + g.score, 0)
  const totalMax = sessions.reduce((s, g) => s + g.max, 0)
  const avgPct = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0

  const currentStopIdx = JOURNEY_STOPS.reduce((acc, stop, i) => (level >= stop.level ? i : acc), 0)
  const nextStop = JOURNEY_STOPS[currentStopIdx + 1] || null

  function saveName() {
    if (editName.trim().length < 2) return
    setPlayerName(editName.trim())
    localStorage.setItem('geoquiz_player', editName.trim())
    setEditing(false)
  }

  function pickAvatar(a) {
    setAvatar(a)
    localStorage.setItem('geoquiz_avatar', a)
    setShowAvatarPicker(false)
  }

  return (
    <section className="dashboard">
      {/* Profile Card */}
      <div className="profile-card">
        <div className="profile-avatar-wrap" onClick={() => setShowAvatarPicker(!showAvatarPicker)}>
          <span className="profile-avatar">{avatar}</span>
          <span className="profile-edit-badge">✎</span>
        </div>
        {showAvatarPicker && (
          <div className="avatar-picker">
            {AVATARS.map(a => (
              <button key={a} className={`avatar-opt ${a === avatar ? 'selected' : ''}`} onClick={() => pickAvatar(a)}>{a}</button>
            ))}
          </div>
        )}
        <div className="profile-info">
          {editing ? (
            <div className="profile-name-edit">
              <input value={editName} onChange={e => setEditName(e.target.value)} maxLength={20} onKeyDown={e => e.key === 'Enter' && saveName()} autoFocus />
              <button className="btn btn-primary btn-sm" onClick={saveName}>Save</button>
            </div>
          ) : (
            <div className="profile-name" onClick={() => { setEditing(true); setEditName(playerName) }}>
              {playerName} <span className="profile-name-pen">✎</span>
            </div>
          )}
          <div className="profile-title">{title.emoji} {title.title} · Level {level}</div>
        </div>
      </div>

      {/* XP Progress */}
      <div className="journey-xp-section">
        <div className="journey-xp-bar">
          <div className="journey-xp-fill" style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="journey-xp-info">
          <span>{xp.totalXP} XP</span>
          <span>{xpToNext} to Lv.{level + 1}</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="profile-stats">
        <div className="profile-stat">
          <div className="profile-stat-val">{xp.streakDays || 0}</div>
          <div className="profile-stat-lbl">Streak</div>
        </div>
        <div className="profile-stat">
          <div className="profile-stat-val">{totalGames}</div>
          <div className="profile-stat-lbl">Games</div>
        </div>
        <div className="profile-stat">
          <div className="profile-stat-val">{avgPct}%</div>
          <div className="profile-stat-lbl">Avg</div>
        </div>
        <div className="profile-stat">
          <div className="profile-stat-val">{xp.streakFreezes || 0}</div>
          <div className="profile-stat-lbl">Freezes</div>
        </div>
      </div>

      {/* Journey Map with themed background */}
      <div className="journey-map">
        <div className="journey-map-bg" />
        <h3 className="journey-map-title">Exploration Journey</h3>
        {nextStop && (
          <div className="journey-next-hint">
            Next: <strong>{nextStop.name}</strong> — Lv.{nextStop.level}
          </div>
        )}
        <div className="journey-path">
          {JOURNEY_STOPS.map((stop, i) => {
            const reached = level >= stop.level
            const isCurrent = i === currentStopIdx
            const isLast = i === JOURNEY_STOPS.length - 1
            const side = i % 2 === 0 ? 'left' : 'right'

            return (
              <div key={i} className={`journey-node-wrap journey-${side}`}>
                {/* Connector */}
                {i > 0 && (
                  <div className={`journey-connector ${reached ? 'filled' : ''}`}>
                    <div className="journey-conn-line" />
                  </div>
                )}
                <div className="journey-stop-row">
                  <div
                    className={`journey-node ${reached ? 'reached' : 'locked'} ${isCurrent ? 'current' : ''}`}
                    style={{ borderColor: reached ? stop.color : '#555', background: reached ? stop.color : '#2a2a2a' }}
                  >
                    <span className="journey-node-level" style={{ color: reached ? '#fff' : '#777' }}>
                      {stop.level}
                    </span>
                  </div>
                  <div className={`journey-node-label ${reached ? '' : 'locked-label'}`}>
                    {reached ? stop.name : `Lv.${stop.level}`}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <Link to="/play" className="btn btn-primary">Keep Exploring</Link>
        <Link to="/achievements" className="btn btn-outline">Achievements</Link>
      </div>
    </section>
  )
}
