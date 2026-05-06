import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getXPData, getLevel, getLevelProgress, getLevelTitle, getXPToNextLevel,
  getCurrentLeague, getNextLeague, LEAGUE_TIERS
} from '../engine/xp.js'
import { getExplorationPercent, getCheckIns } from '../engine/exploration.js'
import Leaderboard from './Leaderboard.jsx'

const AVATARS = [
  '🎭','🗿','👑','🐚','⚡','🔱','🛡️','🦅','🌀','🌍','🪘','🏺','🌴','🔥','🐆','🐘',
  '🧭','🗺️','🏆','💎','🚀','⭐','🎯','🌟','🏅','🎮',
  '🦁','🐊','🦈','🐉','🌙','🛰️','🎓','🎲','🧩','🎪','🐺','🦊','🐯','🌊',
]

const JOURNEY_STOPS = [
  { level: 1,  name: 'Tafawa Balewa Sq.', color: '#00ff88' },
  { level: 2,  name: 'Third Mainland',    color: '#00d4ff' },
  { level: 3,  name: 'Lekki Toll Gate',   color: '#ff6b35' },
  { level: 4,  name: 'National Theatre',  color: '#a855f7' },
  { level: 5,  name: 'Eko Atlantic',      color: '#00ffd5' },
  { level: 6,  name: 'Badagry Heritage',  color: '#ff3366' },
  { level: 7,  name: 'Ikoyi Club',        color: '#fbbf24' },
  { level: 8,  name: 'Computer Village',  color: '#34d399' },
  { level: 9,  name: 'Makoko',            color: '#60a5fa' },
  { level: 10, name: 'Victoria Island',   color: '#f472b6' },
  { level: 12, name: 'Apapa Wharf',       color: '#a78bfa' },
  { level: 14, name: 'Obalende',          color: '#fb923c' },
  { level: 16, name: 'Ikeja Mall',        color: '#818cf8' },
  { level: 18, name: 'Ajah',              color: '#22d3ee' },
  { level: 20, name: 'Lagos Island',      color: '#facc15' },
  { level: 23, name: 'Banana Island',     color: '#4ade80' },
  { level: 26, name: 'Elegushi Beach',    color: '#38bdf8' },
  { level: 30, name: 'Aso Rock',          color: '#f97316' },
  { level: 35, name: 'Zuma Rock',         color: '#a3e635' },
  { level: 40, name: 'Cross River NP',    color: '#2dd4bf' },
  { level: 45, name: 'Yankari Reserve',   color: '#e879f9' },
  { level: 50, name: 'Grandmaster',       color: '#fbbf24' },
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
  const league = getCurrentLeague(xp.totalXP)
  const nextLeague = getNextLeague(xp.totalXP)
  const exploredPct = getExplorationPercent()
  const checkIns = getCheckIns()

  const totalGames = sessions.length
  const totalScore = sessions.reduce((s, g) => s + g.score, 0)
  const totalMax   = sessions.reduce((s, g) => s + g.max, 0)
  const avgPct     = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0
  const bestStreak = Math.max(...sessions.map(s => s.streak || 0), xp.streakDays || 0)

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

      {/* ── Hero Profile Card ── */}
      <div className="db-profile-card">
        <div className="db-avatar-wrap" onClick={() => setShowAvatarPicker(!showAvatarPicker)}>
          <span className="db-avatar">{avatar}</span>
          <span className="db-avatar-edit">✎</span>
        </div>
        <div className="db-profile-info">
          {editing ? (
            <div className="db-name-edit">
              <input value={editName} onChange={e => setEditName(e.target.value)} maxLength={20}
                onKeyDown={e => e.key === 'Enter' && saveName()} autoFocus />
              <button className="btn btn-primary btn-sm" onClick={saveName}>Save</button>
            </div>
          ) : (
            <div className="db-name" onClick={() => { setEditing(true); setEditName(playerName) }}>
              {playerName} <span className="db-name-pen">✎</span>
            </div>
          )}
          <div className="db-title-row">
            <span className="db-level-badge" style={{ background: league.color }}>Lv.{level}</span>
            <span className="db-title">{title.emoji} {title.title}</span>
            <span className="db-league-badge" style={{ background: league.color + '22', color: league.color, border: `1px solid ${league.color}` }}>
              {league.emoji} {league.name}
            </span>
          </div>
        </div>
      </div>

      {showAvatarPicker && (
        <div className="avatar-picker">
          {AVATARS.map(a => (
            <button key={a} className={`avatar-opt ${a === avatar ? 'selected' : ''}`} onClick={() => pickAvatar(a)}>{a}</button>
          ))}
        </div>
      )}

      {/* ── XP Progress Bar ── */}
      <div className="db-xp-card">
        <div className="db-xp-header">
          <span className="db-xp-label">Level {level} → {level + 1}</span>
          <span className="db-xp-value">{xp.totalXP.toLocaleString()} XP</span>
        </div>
        <div className="db-xp-track">
          <div className="db-xp-fill" style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="db-xp-footer">
          <span>{Math.round(progress * 100)}% complete</span>
          <span>{xpToNext} XP to next level</span>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="db-stats-grid">
        <div className="db-stat-card">
          <span className="db-stat-icon">🔥</span>
          <span className="db-stat-val">{xp.streakDays || 0}</span>
          <span className="db-stat-lbl">Day Streak</span>
        </div>
        <div className="db-stat-card">
          <span className="db-stat-icon">🎮</span>
          <span className="db-stat-val">{totalGames}</span>
          <span className="db-stat-lbl">Games Played</span>
        </div>
        <div className="db-stat-card">
          <span className="db-stat-icon">🎯</span>
          <span className="db-stat-val">{avgPct}%</span>
          <span className="db-stat-lbl">Avg Score</span>
        </div>
        <div className="db-stat-card">
          <span className="db-stat-icon">📍</span>
          <span className="db-stat-val">{checkIns.length}</span>
          <span className="db-stat-lbl">Check-ins</span>
        </div>
        <div className="db-stat-card">
          <span className="db-stat-icon">🗺️</span>
          <span className="db-stat-val">{exploredPct}%</span>
          <span className="db-stat-lbl">Lagos Explored</span>
        </div>
        <div className="db-stat-card">
          <span className="db-stat-icon">❄️</span>
          <span className="db-stat-val">{xp.streakFreezes || 0}</span>
          <span className="db-stat-lbl">Freezes</span>
        </div>
      </div>

      {/* ── Exploration progress bar ── */}
      {exploredPct > 0 && (
        <div className="db-explore-bar-wrap">
          <div className="db-explore-label">
            <span>🌍 Lagos Exploration</span>
            <span className="db-explore-pct">{exploredPct}%</span>
          </div>
          <div className="db-explore-track">
            <div className="db-explore-fill" style={{ width: `${exploredPct}%` }} />
          </div>
          <Link to="/discovery" className="db-explore-cta">Open Discovery Map →</Link>
        </div>
      )}

      {/* ── Journey Map ── */}
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
                  style={reached ? { '--stop-color': stop.color, borderColor: stop.color, boxShadow: `0 0 12px ${stop.color}40` } : {}}>
                  <span className="neon-stop-num">{stop.level}</span>
                </div>
                <div className="neon-stop-name" style={reached ? { color: stop.color } : {}}>
                  {reached ? stop.name : '—'}
                </div>
              </div>
            )
          })}
        </div>
        <div className="neon-map-footer">{currentStopIdx + 1} / {JOURNEY_STOPS.length} stops explored</div>
      </div>

      {/* ── Recent check-ins ── */}
      {checkIns.length > 0 && (
        <div className="db-checkins">
          <h4 className="db-section-title">📍 Recent Check-ins</h4>
          <div className="db-checkin-list">
            {checkIns.slice(-5).reverse().map((c, i) => (
              <div key={i} className="db-checkin-row">
                <span className="db-checkin-name">{c.name}</span>
                <span className="db-checkin-area">{c.area}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Action buttons ── */}
      <div className="db-actions">
        <Link to="/play" className="btn btn-primary">Play Now</Link>
        <Link to="/discovery" className="btn btn-outline">🧭 Discover</Link>
        <Link to="/rewards" className="btn btn-outline">🎁 Rewards</Link>
        <Link to="/story" className="btn btn-outline">📖 Story</Link>
        <Link to="/achievements" className="btn btn-outline">Achievements</Link>
      </div>

      {/* ── Global Leaderboard ── */}
      <div style={{ marginTop: '4rem', paddingTop: '1rem', borderTop: '2px solid var(--border)' }}>
        <Leaderboard isEmbedded={true} />
      </div>
    </section>
  )
}
