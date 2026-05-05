import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getXPData, getLevel, getLevelProgress, getLevelTitle, getXPToNextLevel,
  getCurrentLeague, getNextLeague, getXPToNextLeague, LEAGUE_TIERS,
  generateLeaguePeers, DAILY_REWARDS, getRewardsData, claimDailyReward, canClaimToday,
} from '../engine/xp.js'

export default function Rewards() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('rewards') // rewards | league
  const [xp, setXP] = useState(getXPData)
  const [rewards, setRewards] = useState(getRewardsData)
  const [canClaim, setCanClaim] = useState(canClaimToday)
  const [claimResult, setClaimResult] = useState(null)
  const [showConfetti, setShowConfetti] = useState(false)

  const level = getLevel(xp.totalXP)
  const title = getLevelTitle(level)
  const league = getCurrentLeague(xp.totalXP)
  const nextLeague = getNextLeague(xp.totalXP)
  const xpToNext = getXPToNextLeague(xp.totalXP)
  const playerName = localStorage.getItem('geoquiz_player') || 'Explorer'
  const peers = generateLeaguePeers(xp.weeklyXP || 0, playerName)

  function handleClaim() {
    const result = claimDailyReward()
    if (!result.alreadyClaimed) {
      setClaimResult(result)
      setCanClaim(false)
      setXP(getXPData())
      setRewards(getRewardsData())
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 2500)
    }
  }

  return (
    <section className="rewards-page">
      {/* Confetti burst */}
      {showConfetti && (
        <div className="rw-confetti">
          {Array.from({ length: 30 }).map((_, i) => (
            <span key={i} className="rw-confetti-bit" style={{
              '--x': `${Math.random() * 100}%`,
              '--delay': `${Math.random() * 0.5}s`,
              '--color': ['#00ff88', '#fbbf24', '#8b5cf6', '#00d4ff', '#ff6b35', '#ef4444'][i % 6],
            }} />
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="rw-tabs">
        <button className={`rw-tab ${tab === 'rewards' ? 'active' : ''}`} onClick={() => setTab('rewards')}>
          🎁 Daily Rewards
        </button>
        <button className={`rw-tab ${tab === 'league' ? 'active' : ''}`} onClick={() => setTab('league')}>
          {league.emoji} Leagues
        </button>
      </div>

      {/* ═══ DAILY REWARDS TAB ═══ */}
      {tab === 'rewards' && (
        <div className="rw-rewards">
          <div className="rw-streak-banner">
            <span className="rw-streak-fire">🔥</span>
            <div>
              <div className="rw-streak-count">{xp.streakDays || 0} Day Streak</div>
              <div className="rw-streak-sub">
                {xp.streakFreezes > 0 && <span>❄️ {xp.streakFreezes} freeze{xp.streakFreezes > 1 ? 's' : ''}</span>}
              </div>
            </div>
          </div>

          {/* 7-day reward calendar */}
          <div className="rw-calendar">
            {DAILY_REWARDS.map((r, i) => {
              const dayNum = i + 1
              const claimed = rewards.claimedDays?.includes(dayNum)
              const isToday = rewards.currentDay === dayNum || (rewards.currentDay === 0 && dayNum === 1)
              const isNext = !claimed && dayNum === (rewards.currentDay || 0) + 1
              return (
                <div key={i} className={`rw-day ${claimed ? 'claimed' : ''} ${isToday && canClaim ? 'today' : ''} ${isNext ? 'next' : ''}`}>
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
            <button className="rw-claim-btn" onClick={handleClaim}>
              Claim Today's Reward 🎁
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
                <p>✅ Today's reward claimed! Come back tomorrow.</p>
              )}
            </div>
          )}

          {/* XP progress */}
          <div className="rw-xp-card">
            <div className="rw-xp-top">
              <span>{title.emoji} Lv.{level} {title.title}</span>
              <span>{xp.totalXP} XP</span>
            </div>
            <div className="rw-xp-bar"><div className="rw-xp-fill" style={{ width: `${getLevelProgress(xp.totalXP) * 100}%` }} /></div>
            <div className="rw-xp-bot">{getXPToNextLevel(xp.totalXP)} XP to Level {level + 1}</div>
          </div>
        </div>
      )}

      {/* ═══ LEAGUES TAB ═══ */}
      {tab === 'league' && (
        <div className="rw-league">
          {/* Current league badge */}
          <div className="rw-league-badge" style={{ borderColor: league.color, boxShadow: `0 0 20px ${league.color}30` }}>
            <span className="rw-lb-emoji">{league.emoji}</span>
            <h3 className="rw-lb-name" style={{ color: league.color }}>{league.name} League</h3>
            {nextLeague && (
              <p className="rw-lb-progress">
                {xpToNext} XP to {nextLeague.emoji} {nextLeague.name}
              </p>
            )}
            {!nextLeague && <p className="rw-lb-progress">🏆 You've reached the top!</p>}
          </div>

          {/* League tiers */}
          <div className="rw-tiers">
            {LEAGUE_TIERS.map(t => {
              const isActive = t.id === league.id
              const isReached = xp.totalXP >= t.minXP
              return (
                <div key={t.id} className={`rw-tier ${isActive ? 'active' : ''} ${isReached ? 'reached' : ''}`}>
                  <span className="rw-tier-emoji">{t.emoji}</span>
                  <span className="rw-tier-name">{t.name}</span>
                  <span className="rw-tier-xp">{t.minXP.toLocaleString()} XP</span>
                  {isActive && <span className="rw-tier-you">YOU</span>}
                </div>
              )
            })}
          </div>

          {/* Weekly leaderboard */}
          <h4 className="rw-lb-title">Weekly Leaderboard</h4>
          <div className="rw-lb-list">
            {peers.slice(0, 15).map((p, i) => (
              <div key={i} className={`rw-lb-row ${p.isPlayer ? 'is-you' : ''} ${i < 10 ? 'promote' : ''}`}>
                <span className="rw-lb-rank">{i + 1}</span>
                <span className="rw-lb-avatar">{p.avatar}</span>
                <span className="rw-lb-pname">{p.name}{p.isPlayer ? ' (You)' : ''}</span>
                <span className="rw-lb-pxp">{p.xp} XP</span>
                {i < 10 && <span className="rw-lb-badge">▲</span>}
              </div>
            ))}
          </div>
          <p className="rw-lb-note">Top 10 promote · Bottom 5 demote · Resets Monday</p>

          {/* Motivational nudge */}
          {nextLeague && (
            <div className="rw-nudge">
              <span>🎯</span> Play {Math.ceil(xpToNext / 150)} more games to reach {nextLeague.emoji} {nextLeague.name}!
            </div>
          )}
        </div>
      )}

      <div className="rw-actions">
        <button className="btn btn-primary" onClick={() => navigate('/play')}>Play Now</button>
        <button className="btn btn-outline" onClick={() => navigate('/dashboard')}>Profile</button>
      </div>
    </section>
  )
}
