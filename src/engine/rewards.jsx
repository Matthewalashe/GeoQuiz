/**
 * Reward Engine — Duolingo-style XP/Stars/Streaks/Chests
 * Used by all mini-games as a shared celebration system.
 */

import { useState, useEffect, useCallback } from 'react'

// ── XP Pop (floating +XP text) ────────────────────────────────────────────
export function XPPop({ amount, x, y, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 900)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <div className="xp-pop" style={{ left: x, top: y }}>
      +{amount} XP
    </div>
  )
}

// ── Star burst (3 stars falling in) ──────────────────────────────────────
export function StarBurst({ count = 3, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1200)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <div className="star-burst">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="star-burst-star" style={{ animationDelay: `${i * 0.15}s` }}>⭐</div>
      ))}
    </div>
  )
}

// ── Streak Flash (🔥 streak counter) ─────────────────────────────────────
export function StreakFlash({ streak, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1500)
    return () => clearTimeout(t)
  }, [onDone])
  return (
    <div className="streak-flash">
      <span className="streak-flash-fire">🔥</span>
      <span className="streak-flash-num">{streak}</span>
      <span className="streak-flash-label">Streak!</span>
    </div>
  )
}

// ── Treasure Chest (click to open & collect XP) ───────────────────────────
export function TreasureChest({ xp, onCollect }) {
  const [opened, setOpened] = useState(false)
  const [collected, setCollected] = useState(false)

  function open() {
    if (opened) return
    setOpened(true)
    setTimeout(() => setCollected(true), 600)
    setTimeout(() => onCollect(), 800)
  }

  return (
    <div className={`chest-wrap ${opened ? 'opened' : ''}`} onClick={open}>
      <div className="chest-body">
        <div className="chest-lid" />
        <div className="chest-base">
          {!opened && <span className="chest-tap-hint">Tap!</span>}
        </div>
      </div>
      {collected && (
        <div className="chest-xp-burst">
          <span>+{xp} XP</span>
          {['⭐','💛','✨'].map((e, i) => (
            <span key={i} className="chest-particle" style={{ '--i': i }}>{e}</span>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Correct Answer Overlay (full-screen flash) ────────────────────────────
export function CorrectFlash({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 600)
    return () => clearTimeout(t)
  }, [onDone])
  return <div className="correct-flash" />
}

// ── Wrong Answer Shake indicator ──────────────────────────────────────────
export function WrongShake({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 500)
    return () => clearTimeout(t)
  }, [onDone])
  return <div className="wrong-flash" />
}

// ── Hearts display (lives system) ─────────────────────────────────────────
export function HeartsDisplay({ hearts, maxHearts = 3 }) {
  return (
    <div className="hearts-display">
      {Array.from({ length: maxHearts }).map((_, i) => (
        <span key={i} className={`heart ${i < hearts ? 'full' : 'empty'}`}>
          {i < hearts ? '❤️' : '🖤'}
        </span>
      ))}
    </div>
  )
}

// ── Combo Multiplier badge ─────────────────────────────────────────────────
export function ComboBadge({ combo }) {
  if (combo < 2) return null
  return (
    <div className="combo-badge">
      <span className="combo-x">x{combo}</span>
      <span className="combo-label">Combo!</span>
    </div>
  )
}

// ── Hook: useRewardSystem ─────────────────────────────────────────────────
export function useRewardSystem() {
  const [xpPops, setXpPops] = useState([])
  const [showStars, setShowStars] = useState(false)
  const [showStreak, setShowStreak] = useState(false)
  const [streakCount, setStreakCount] = useState(0)
  const [showChest, setShowChest] = useState(false)
  const [chestXP, setChestXP] = useState(0)
  const [showCorrectFlash, setShowCorrectFlash] = useState(false)
  const [showWrongFlash, setShowWrongFlash] = useState(false)
  const [combo, setCombo] = useState(0)

  const popXP = useCallback((amount, element) => {
    const rect = element?.getBoundingClientRect?.()
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2
    const y = rect ? rect.top : window.innerHeight / 2
    const id = Date.now() + Math.random()
    setXpPops(prev => [...prev, { id, amount, x, y }])
  }, [])

  const celebrateCorrect = useCallback((streak = 0) => {
    setShowCorrectFlash(true)
    setCombo(c => c + 1)
    if (streak > 0 && streak % 3 === 0) {
      setStreakCount(streak)
      setShowStreak(true)
    }
  }, [])

  const celebrateWrong = useCallback(() => {
    setShowWrongFlash(true)
    setCombo(0)
  }, [])

  const openChest = useCallback((xpAmount) => {
    setChestXP(xpAmount)
    setShowChest(true)
  }, [])

  const showStarBurst = useCallback((count = 3) => {
    setShowStars(count)
  }, [])

  const removeXpPop = useCallback((id) => {
    setXpPops(prev => prev.filter(p => p.id !== id))
  }, [])

  const Rewards = useCallback(() => (
    <>
      {xpPops.map(p => (
        <XPPop key={p.id} amount={p.amount} x={p.x} y={p.y} onDone={() => removeXpPop(p.id)} />
      ))}
      {showCorrectFlash && <CorrectFlash onDone={() => setShowCorrectFlash(false)} />}
      {showWrongFlash && <WrongFlash onDone={() => setShowWrongFlash(false)} />}
      {showStars && <StarBurst count={showStars} onDone={() => setShowStars(false)} />}
      {showStreak && <StreakFlash streak={streakCount} onDone={() => setShowStreak(false)} />}
      {combo >= 2 && <ComboBadge combo={combo} />}
      {showChest && (
        <div className="chest-overlay">
          <div className="chest-overlay-inner">
            <p className="chest-title">🎁 Bonus Reward!</p>
            <TreasureChest xp={chestXP} onCollect={() => setShowChest(false)} />
          </div>
        </div>
      )}
    </>
  ), [xpPops, showCorrectFlash, showWrongFlash, showStars, showStreak, streakCount, combo, showChest, chestXP])

  return {
    popXP, celebrateCorrect, celebrateWrong,
    openChest, showStarBurst,
    combo, Rewards,
  }
}
