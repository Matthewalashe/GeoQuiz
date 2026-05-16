import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getXPData, getLevel, getLevelProgress, getLevelTitle, getXPToNextLevel,
  getCurrentLeague,
  DAILY_REWARDS, getRewardsData, claimDailyReward, canClaimToday,
} from '../engine/xp.js'
import { signOut } from '../lib/supabase.js'
import { getExplorationPercent, getCheckIns } from '../engine/exploration.js'
import {
  EditRegular, FireRegular, GamesRegular, TargetRegular, LocationRegular,
  MapRegular, TrophyRegular, CloudRegular, GiftRegular, CheckmarkCircleRegular,
  WeatherSnowflakeRegular, CompassNorthwestRegular, BookRegular, EarthRegular
} from '@fluentui/react-icons'

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

export default function Dashboard({ session, profile }) {
  const [sessions] = useState(() => JSON.parse(localStorage.getItem('geoquiz_sessions') || '[]'))
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('geoquiz_player') || 'Explorer')
  const [avatar, setAvatar] = useState(() => localStorage.getItem('geoquiz_avatar') || '🧭')
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(playerName)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)

  const xp = getXPData()
  
  // Cloud data overrides if logged in
  const displayXP = profile ? profile.total_xp : xp.totalXP
  const displayLevel = getLevel(displayXP)
  const displayTitle = getLevelTitle(displayLevel)
  const displayStreak = profile ? profile.streak_days : (xp.streakDays || 0)
  const displayPlayerName = profile ? (profile.username || profile.full_name || 'Explorer') : playerName
  const displayAvatar = profile ? (profile.avatar_url || '🧭') : avatar

  const progress = getLevelProgress(displayXP)
  const xpToNext = getXPToNextLevel(displayXP)
  const league = getCurrentLeague(displayXP)
  const exploredPct = getExplorationPercent()
  const checkIns = getCheckIns()

  // Streak & Daily Rewards state
  const [rewards, setRewards] = useState(getRewardsData)
  const [canClaim, setCanClaim] = useState(canClaimToday)
  const [claimResult, setClaimResult] = useState(null)
  const [showConfetti, setShowConfetti] = useState(false)

  function handleClaim() {
    const result = claimDailyReward()
    if (!result.alreadyClaimed) {
      setClaimResult(result)
      setCanClaim(false)
      setRewards(getRewardsData())
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 2000)
    }
  }

  const totalGames = sessions.length
  const totalScore = sessions.reduce((s, g) => s + g.score, 0)
  const totalMax   = sessions.reduce((s, g) => s + g.max, 0)
  const avgPct     = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0
  const bestStreak = Math.max(...sessions.map(s => s.streak || 0), xp.streakDays || 0)

  // Pre-compute confetti positions (lazy init avoids purity check)
  const [confettiBits] = useState(() => Array.from({ length: 24 }, () => ({
    x: `${Math.random() * 100}%`,
    delay: `${Math.random() * 0.5}s`,
  })))

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

  // Calculate sliding window for path nodes
  let startIdx = Math.max(0, currentStopIdx - 1)
  let endIdx = Math.min(JOURNEY_STOPS.length, startIdx + 3)
  if (endIdx === JOURNEY_STOPS.length) startIdx = Math.max(0, endIdx - 3)

  const pathNodes = []
  if (startIdx > 0) {
    pathNodes.push({ type: 'stop', stop: JOURNEY_STOPS[0], idx: 0 })
    if (startIdx > 1) pathNodes.push({ type: 'ellipsis', reached: true, key: 'ell-start' })
  }
  for (let i = startIdx; i < endIdx; i++) {
    pathNodes.push({ type: 'stop', stop: JOURNEY_STOPS[i], idx: i })
  }
  if (endIdx < JOURNEY_STOPS.length) {
    if (endIdx < JOURNEY_STOPS.length - 1) pathNodes.push({ type: 'ellipsis', reached: false, key: 'ell-end' })
    pathNodes.push({ type: 'stop', stop: JOURNEY_STOPS[JOURNEY_STOPS.length - 1], idx: JOURNEY_STOPS.length - 1 })
  }

  return (
    <section className="dashboard">

      {/* ── Hero Profile Card ── */}
      <div className="db-profile-card">
        <div className="db-avatar-wrap" onClick={() => setShowAvatarPicker(!showAvatarPicker)}>
          <span className="db-avatar">{avatar}</span>
          <span className="db-avatar-edit"><EditRegular fontSize={14} /></span>
        </div>
        <div className="db-profile-info">
          {editing ? (
            <div className="db-name-edit">
              <input value={editName} onChange={e => setEditName(e.target.value)} maxLength={20}
                onKeyDown={e => e.key === 'Enter' && saveName()} autoFocus />
              <button className="btn btn-primary btn-sm" onClick={saveName}>Save</button>
            </div>
          ) : (
            <div className="db-name" onClick={() => { setEditing(true); setEditName(displayPlayerName) }}>
              {displayPlayerName} <span className="db-name-pen"><EditRegular fontSize={14} /></span>
            </div>
          )}
          <div className="db-title-row">
            <span className="db-level-badge" style={{ background: league.color }}>Lv.{displayLevel}</span>
            <span className="db-title">{displayTitle.emoji} {displayTitle.title}</span>
            <span className="db-league-badge" style={{ background: league.color + '22', color: league.color, border: `1px solid ${league.color}` }}>
              {league.emoji} {league.name}
            </span>
          </div>
        </div>
        {session && (
          <button className="db-signout" onClick={() => signOut()}>Logout</button>
        )}
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
          <span className="db-xp-label">Level {displayLevel} → {displayLevel + 1}</span>
          <span className="db-xp-value">{displayXP.toLocaleString()} XP</span>
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
          <span className="db-stat-icon"><FireRegular /></span>
          <span className="db-stat-val">{displayStreak}</span>
          <span className="db-stat-lbl">Day Streak</span>
        </div>
        <div className="db-stat-card">
          <span className="db-stat-icon"><GamesRegular /></span>
          <span className="db-stat-val">{totalGames}</span>
          <span className="db-stat-lbl">Games Played</span>
        </div>
        <div className="db-stat-card">
          <span className="db-stat-icon"><TargetRegular /></span>
          <span className="db-stat-val">{avgPct}%</span>
          <span className="db-stat-lbl">Avg Score</span>
        </div>
        <div className="db-stat-card">
          <span className="db-stat-icon"><LocationRegular /></span>
          <span className="db-stat-val">{checkIns.length}</span>
          <span className="db-stat-lbl">Check-ins</span>
        </div>
        <div className="db-stat-card">
          <span className="db-stat-icon"><MapRegular /></span>
          <span className="db-stat-val">{exploredPct}%</span>
          <span className="db-stat-lbl">Lagos Explored</span>
        </div>
        <div className="db-stat-card">
          <span className="db-stat-icon"><TrophyRegular /></span>
          <span className="db-stat-val">{bestStreak}</span>
          <span className="db-stat-lbl">Best Streak</span>
        </div>
      </div>

      {/* Guest Save Progress CTA */}
      {!session && (
        <div className="db-guest-cta">
          <div className="db-guest-cta-inner">
            <span className="db-guest-icon"><CloudRegular fontSize={28} /></span>
            <div>
              <strong>Save your progress to the cloud</strong>
              <p>Create an account to keep your XP, streaks, and levels safe.</p>
            </div>
            <Link to="/auth" className="btn btn-primary btn-sm">Sign Up</Link>
          </div>
        </div>
      )}

      {/* ── Streak & Daily Rewards ── */}
      {showConfetti && (
        <div className="rw-confetti">
          {confettiBits.map((bit, i) => (
            <span key={i} className="rw-confetti-bit" style={{
              '--x': bit.x,
              '--delay': bit.delay,
              '--color': ['#00ff88','#fbbf24','#8b5cf6','#00d4ff','#ff6b35','#ef4444'][i % 6],
            }} />
          ))}
        </div>
      )}

      <div className="db-streak-section">
        <div className="db-section-header">
          <h3 className="db-section-title"><FireRegular fontSize={18} style={{ color: '#f97316' }} /> Streak &amp; Daily Rewards</h3>
          <Link to="/rewards" className="db-section-link">Full Rewards →</Link>
        </div>

        {/* Streak banner */}
        <div className="db-streak-banner">
          <div className="db-streak-fire">
            <span style={{ color: '#f97316' }}><FireRegular fontSize={40} /></span>
            <div>
              <div className="db-streak-count">{xp.streakDays || 0}</div>
              <div className="db-streak-label">Day Streak</div>
            </div>
          </div>
          {xp.streakFreezes > 0 && (
            <div className="db-streak-freeze"><WeatherSnowflakeRegular /> {xp.streakFreezes} freeze{xp.streakFreezes > 1 ? 's' : ''} left</div>
          )}
        </div>

        {/* 7-day calendar */}
        <div className="rw-calendar db-cal">
          {DAILY_REWARDS.map((r, i) => {
            const dayNum = i + 1
            const claimed = rewards.claimedDays?.includes(dayNum)
            const isNext = !claimed && dayNum === (rewards.currentDay || 0) + 1
            return (
              <div key={i} className={`rw-day ${claimed ? 'claimed' : ''} ${isNext && canClaim ? 'today' : ''} ${isNext ? 'next' : ''}`}>
                <div className="rw-day-num">Day {dayNum}</div>
                <div className="rw-day-emoji">{r.emoji}</div>
                <div className="rw-day-label">{r.label}</div>
                {claimed && <div className="rw-day-check">✓</div>}
              </div>
            )
          })}
        </div>

        {/* Claim button */}
        {canClaim ? (
          <button className="rw-claim-btn db-claim-btn" onClick={handleClaim}>
            Claim Today's Reward <GiftRegular fontSize={18} />
          </button>
        ) : (
          <div className="rw-claimed-msg">
            {claimResult ? (
              <div className="rw-claim-result">
                <span className="rw-claim-emoji">{claimResult.reward.emoji}</span>
                <span>{claimResult.reward.label} claimed!</span>
                {claimResult.xpAwarded > 0 && <span className="rw-claim-xp">+{claimResult.xpAwarded} XP</span>}
              </div>
            ) : (
              <p><CheckmarkCircleRegular style={{ color: 'var(--green)', verticalAlign: 'middle' }} /> Today's reward claimed! Come back tomorrow.</p>
            )}
          </div>
        )}
      </div>

      {/* ── Exploration progress bar ── */}
      {exploredPct > 0 && (
        <div className="db-explore-bar-wrap">
          <div className="db-explore-label">
            <span><EarthRegular style={{ verticalAlign: 'middle', marginRight: '0.3rem' }} /> Lagos Exploration</span>
            <span className="db-explore-pct">{exploredPct}%</span>
          </div>
          <div className="db-explore-track">
            <div className="db-explore-fill" style={{ width: `${exploredPct}%` }} />
          </div>
          <Link to="/discovery" className="db-explore-cta">Open Discovery Map →</Link>
        </div>
      )}

      {/* ── Exploration Path ── */}
      <div className="db-path-card">
        <div className="db-path-header">
          <div>
            <h3 className="db-path-title">Exploration Path</h3>
            <p className="db-path-subtitle">Your journey across Lagos</p>
          </div>
          <div className="db-path-count">{currentStopIdx + 1} / {JOURNEY_STOPS.length}</div>
        </div>

        <div className="db-path-stepper">
          {pathNodes.map((node) => {
            if (node.type === 'ellipsis') {
              return (
                <div key={node.key} className={`db-path-step ellipsis-step ${node.reached ? 'reached' : ''}`}>
                  <div className="db-path-ellipsis">⋮</div>
                </div>
              )
            }

            const { stop, idx } = node
            const reached = level >= stop.level
            const isCurrent = idx === currentStopIdx

            return (
              <div key={idx} className={`db-path-step ${reached ? 'reached' : ''} ${isCurrent ? 'current' : ''}`}>
                <div className="db-path-marker">{stop.level}</div>
                <div className="db-path-content">
                  <div className="db-path-name">{stop.name}</div>
                  <div className="db-path-meta">
                    {reached ? <span style={{ color: 'var(--green)' }}>✓ Explored</span> : <span>🔒 Locked</span>}
                    {isCurrent && <span className="db-path-xp-tag">Next: {nextStop ? nextStop.name : 'Max Level'}</span>}
                  </div>
                </div>
                {isCurrent && <div className="db-path-avatar">{avatar}</div>}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Recent check-ins ── */}
      {checkIns.length > 0 && (
        <div className="db-checkins">
          <h4 className="db-section-title"><LocationRegular style={{ color: 'var(--primary)' }} /> Recent Check-ins</h4>
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
        <Link to="/discovery" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}><CompassNorthwestRegular /> Discover</Link>
        <Link to="/deals" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}><GiftRegular /> Deals</Link>
        <Link to="/story" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}><BookRegular /> Story</Link>
        <Link to="/achievements" className="btn btn-outline">Achievements</Link>
        <Link to="/leaderboard" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}><TrophyRegular /> Leaderboard</Link>
      </div>
    </section>
  )
}
