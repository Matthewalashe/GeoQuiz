/**
 * CELEBRATIONS ENGINE
 * Full-screen celebration overlays for milestones.
 * - Level up
 * - Streak milestones (3, 7, 14, 30 days)
 * - Coin milestones (100, 500, 1000, 5000)
 * - League promotions
 * - Perfect game
 *
 * Usage: import { CelebrationOverlay, useCelebrations } from './celebrations.jsx'
 *        const { celebrate, celebrationProps } = useCelebrations()
 *        celebrate('levelup', { level: 5, title: 'Explorer' })
 *        <CelebrationOverlay {...celebrationProps} />
 */
import { useState, useCallback, useEffect, useRef } from 'react'

// ── Celebration configs ──
const CELEBRATIONS = {
  levelup: {
    emoji: '🎉',
    title: (d) => `Level ${d.level}!`,
    subtitle: (d) => `${d.title?.emoji || '⭐'} ${d.title?.title || 'Explorer'}`,
    message: () => 'You leveled up! Keep going!',
    color: '#8b5cf6',
    confetti: true,
  },
  streak: {
    emoji: '🔥',
    title: (d) => `${d.days}-Day Streak!`,
    subtitle: () => 'You\'re on fire!',
    message: (d) => d.days >= 30 ? 'Legendary dedication!' : d.days >= 14 ? 'Two weeks strong!' : d.days >= 7 ? 'A full week! Amazing!' : 'Keep the streak alive!',
    color: '#f59e0b',
    confetti: true,
  },
  coins: {
    emoji: '🪙',
    title: (d) => `${d.amount.toLocaleString()} Coins!`,
    subtitle: () => 'Coin milestone reached',
    message: () => 'Visit the store to spend your coins!',
    color: '#eab308',
    confetti: false,
  },
  league: {
    emoji: '🏆',
    title: (d) => `${d.league?.name || 'New'} League!`,
    subtitle: (d) => d.league?.emoji || '🏆',
    message: () => 'You\'ve been promoted!',
    color: '#00c853',
    confetti: true,
  },
  perfect: {
    emoji: '💯',
    title: () => 'Perfect Game!',
    subtitle: () => 'Flawless victory',
    message: () => 'Every answer was correct!',
    color: '#ec4899',
    confetti: true,
  },
  achievement: {
    emoji: '🏅',
    title: (d) => d.name || 'Achievement Unlocked!',
    subtitle: (d) => d.description || '',
    message: () => 'Nice work!',
    color: '#06b6d4',
    confetti: false,
  },
}

// ── Hook ──
export function useCelebrations() {
  const [active, setActive] = useState(null)
  const timeoutRef = useRef(null)

  const celebrate = useCallback((type, data = {}) => {
    const config = CELEBRATIONS[type]
    if (!config) return
    setActive({ type, data, config })
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setActive(null), 4000)
  }, [])

  const dismiss = useCallback(() => {
    clearTimeout(timeoutRef.current)
    setActive(null)
  }, [])

  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  return {
    celebrate,
    celebrationProps: { active, onDismiss: dismiss },
  }
}

// ── Confetti particles ──
function ConfettiParticles() {
  const bits = Array.from({ length: 40 }, (_, i) => ({
    x: Math.random() * 100,
    delay: Math.random() * 0.6,
    dur: 1.5 + Math.random() * 1.5,
    color: ['#ff006e', '#8338ec', '#3a86ff', '#00c853', '#ffbe0b', '#fb5607'][i % 6],
    size: 4 + Math.random() * 6,
    drift: -30 + Math.random() * 60,
  }))

  return (
    <div className="cel-confetti" aria-hidden>
      {bits.map((b, i) => (
        <span key={i} className="cel-confetti-bit" style={{
          left: `${b.x}%`,
          '--delay': `${b.delay}s`,
          '--dur': `${b.dur}s`,
          '--color': b.color,
          '--size': `${b.size}px`,
          '--drift': `${b.drift}px`,
        }} />
      ))}
    </div>
  )
}

// ── Overlay component ──
export function CelebrationOverlay({ active, onDismiss }) {
  if (!active) return null

  const { config, data } = active

  return (
    <div className="cel-overlay" onClick={onDismiss}>
      {config.confetti && <ConfettiParticles />}
      <div className="cel-card" onClick={e => e.stopPropagation()} style={{ '--cel-color': config.color }}>
        <div className="cel-glow" />
        <div className="cel-emoji">{config.emoji}</div>
        <h2 className="cel-title">{config.title(data)}</h2>
        <div className="cel-subtitle">{config.subtitle(data)}</div>
        <p className="cel-message">{config.message(data)}</p>
        <button className="cel-btn" onClick={onDismiss}>Awesome! 🎉</button>
      </div>
    </div>
  )
}

// ── Check milestones ──
const MILESTONE_KEY = 'wanda_milestones'

function getMilestones() {
  try { return JSON.parse(localStorage.getItem(MILESTONE_KEY) || '{}') } catch { return {} }
}

function setMilestone(key) {
  const m = getMilestones()
  m[key] = Date.now()
  localStorage.setItem(MILESTONE_KEY, JSON.stringify(m))
}

/**
 * Check and trigger milestone celebrations.
 * Call after XP changes, game completions, etc.
 * Returns the celebration type and data if a milestone was hit, or null.
 */
export function checkMilestones({ level, prevLevel, streak, coins, score, maxScore, league, prevLeague }) {
  const milestones = getMilestones()

  // Level up
  if (level > (prevLevel || 0) && !milestones[`level-${level}`]) {
    setMilestone(`level-${level}`)
    return { type: 'levelup', data: { level } }
  }

  // Streak milestones
  const streakMilestones = [3, 7, 14, 30, 60, 100]
  for (const s of streakMilestones) {
    if (streak >= s && !milestones[`streak-${s}`]) {
      setMilestone(`streak-${s}`)
      return { type: 'streak', data: { days: s } }
    }
  }

  // Coin milestones
  const coinMilestones = [100, 500, 1000, 5000]
  for (const c of coinMilestones) {
    if (coins >= c && !milestones[`coins-${c}`]) {
      setMilestone(`coins-${c}`)
      return { type: 'coins', data: { amount: c } }
    }
  }

  // Perfect game
  if (score && maxScore && score >= maxScore && !milestones[`perfect-${Date.now()}`]) {
    return { type: 'perfect', data: {} }
  }

  // League promotion
  if (league && prevLeague && league.id !== prevLeague.id && !milestones[`league-${league.id}`]) {
    setMilestone(`league-${league.id}`)
    return { type: 'league', data: { league } }
  }

  return null
}
