import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getXPData, getLevel, getLevelProgress, getLevelTitle, getXPToNextLevel } from '../engine/xp.js'

const AVATARS = [
  '🧭', '🗺️', '🌍', '🎯', '⚡', '🔥', '🌟', '🏆', '👑', '🛰️',
  '🎓', '🧑‍🚀', '🦁', '🐊', '🦅', '🐺', '🦊', '🐯', '🦈', '🐉',
  '🎮', '🎲', '🧩', '🏅', '💎', '🚀', '⭐', '🌙', '🎪', '🗿',
]

const JOURNEY_STOPS = [
  { level: 1, name: 'Tafawa Balewa Sq.', color: '#00ff88' },
  { level: 2, name: 'Third Mainland', color: '#00d4ff' },
  { level: 3, name: 'Lekki Toll Gate', color: '#ff6b35' },
  { level: 4, name: 'National Theatre', color: '#a855f7' },
  { level: 5, name: 'Eko Atlantic', color: '#00ffd5' },
  { level: 6, name: 'Badagry Heritage', color: '#ff3366' },
  { level: 7, name: 'Ikoyi Club', color: '#fbbf24' },
  { level: 8, name: 'Computer Village', color: '#34d399' },
  { level: 9, name: 'Makoko', color: '#60a5fa' },
  { level: 10, name: 'Victoria Island', color: '#f472b6' },
  { level: 12, name: 'Apapa Wharf', color: '#a78bfa' },
  { level: 14, name: 'Obalende', color: '#fb923c' },
  { level: 16, name: 'Ikeja Mall', color: '#818cf8' },
  { level: 18, name: 'Ajah', color: '#22d3ee' },
  { level: 20, name: 'Lagos Island', color: '#facc15' },
  { level: 23, name: 'Banana Island', color: '#4ade80' },
  { level: 26, name: 'Elegushi Beach', color: '#38bdf8' },
  { level: 30, name: 'Aso Rock', color: '#f97316' },
  { level: 35, name: 'Zuma Rock', color: '#a3e635' },
  { level: 40, name: 'Cross River NP', color: '#2dd4bf' },
  { level: 45, name: 'Yankari Reserve', color: '#e879f9' },
  { level: 50, name: 'Grandmaster', color: '#fbbf24' },
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

      {showAvatarPicker && (
        <div className="avatar-picker">
          {AVATARS.map(a => (
            <button key={a} className={`avatar-opt ${a === avatar ? 'selected' : ''}`} onClick={() => pickAvatar(a)}>{a}</button>
          ))}
        </div>
      )}

      {/* XP */}
      <div className="journey-xp-section">
        <div className="journey-xp-bar"><div className="journey-xp-fill" style={{ width: `${progress * 100}%` }} /></div>
        <div className="journey-xp-info"><span>{xp.totalXP} XP</span><span>{xpToNext} to Lv.{level + 1}</span></div>
      </div>

      {/* Stats */}
      <div className="profile-stats">
        <div className="profile-stat"><div className="profile-stat-val">{xp.streakDays || 0}</div><div className="profile-stat-lbl">Streak</div></div>
        <div className="profile-stat"><div className="profile-stat-val">{totalGames}</div><div className="profile-stat-lbl">Games</div></div>
        <div className="profile-stat"><div className="profile-stat-val">{avgPct}%</div><div className="profile-stat-lbl">Avg</div></div>
        <div className="profile-stat"><div className="profile-stat-val">{xp.streakFreezes || 0}</div><div className="profile-stat-lbl">Freezes</div></div>
      </div>

      {/* Futuristic Journey Map */}
      <div className="neon-map">
        <div className="neon-map-bg">
          <div className="neon-grid" />
          <div className="neon-glow-orb orb-1" />
          <div className="neon-glow-orb orb-2" />
          <div className="neon-glow-orb orb-3" />
        </div>

        <div className="neon-map-header">
          <h3>Exploration Path</h3>
          {nextStop && <span className="neon-next">Next → {nextStop.name} (Lv.{nextStop.level})</span>}
        </div>

        {/* Player position indicator */}
        <div className="neon-player-pos">
          <span className="neon-player-avatar">{avatar}</span>
          <span className="neon-player-label">{JOURNEY_STOPS[currentStopIdx].name}</span>
        </div>

        <div className="neon-path">
          {JOURNEY_STOPS.map((stop, i) => {
            const reached = level >= stop.level
            const isCurrent = i === currentStopIdx

            return (
              <div key={i} className="neon-stop-wrap">
                {i > 0 && <div className={`neon-wire ${reached ? 'active' : ''}`} style={reached ? { '--wire-color': stop.color } : {}} />}
                <div className={`neon-stop ${reached ? 'reached' : 'locked'} ${isCurrent ? 'current' : ''}`}
                  style={reached ? { '--stop-color': stop.color, borderColor: stop.color, boxShadow: `0 0 12px ${stop.color}40` } : {}}
                >
                  <span className="neon-stop-num">{stop.level}</span>
                </div>
                <div className="neon-stop-name" style={reached ? { color: stop.color } : {}}>
                  {reached ? stop.name : '—'}
                </div>
              </div>
            )
          })}
        </div>

        <div className="neon-map-footer">
          {currentStopIdx + 1} / {JOURNEY_STOPS.length} stops explored
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <Link to="/play" className="btn btn-primary">Keep Exploring</Link>
        <Link to="/achievements" className="btn btn-outline">Achievements</Link>
      </div>
    </section>
  )
}
