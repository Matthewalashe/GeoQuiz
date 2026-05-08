/* eslint-disable react-refresh/only-export-components */
/**
 * Reward Engine — Duolingo-style XP/Stars/Streaks/Chests
 * Shared by all mini-games.
 */

import { useState, useEffect, useRef } from 'react'

// ── XP Pop ───────────────────────────────────────────────────────────────────
export function XPPop({ amount, x, y, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 900)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line
  return (
    <div className="xp-pop" style={{ left: x, top: y }}>
      +{amount} XP
    </div>
  )
}

// ── Star Burst ────────────────────────────────────────────────────────────────
export function StarBurst({ count = 3, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1200)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line
  return (
    <div className="star-burst">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="star-burst-star" style={{ animationDelay: `${i * 0.15}s` }}>⭐</div>
      ))}
    </div>
  )
}

// ── Streak Flash ──────────────────────────────────────────────────────────────
export function StreakFlash({ streak, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1500)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line
  return (
    <div className="streak-flash">
      <span className="streak-flash-fire">🔥</span>
      <span className="streak-flash-num">{streak}</span>
      <span className="streak-flash-label">Streak!</span>
    </div>
  )
}

// ── Correct / Wrong Flashes ───────────────────────────────────────────────────
export function CorrectFlash({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 600)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line
  return <div className="correct-flash" />
}

export function WrongFlash({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 500)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line
  return <div className="wrong-flash" />
}

// ── Combo Badge ───────────────────────────────────────────────────────────────
export function ComboBadge({ combo }) {
  if (combo < 2) return null
  return (
    <div className="combo-badge">
      <span className="combo-x">x{combo}</span>
      <span className="combo-label">Combo!</span>
    </div>
  )
}

// ── Treasure Chest ────────────────────────────────────────────────────────────
export function TreasureChest({ xp, onCollect }) {
  const [opened, setOpened] = useState(false)
  const [collected, setCollected] = useState(false)

  function open() {
    if (opened) return
    setOpened(true)
    setTimeout(() => setCollected(true), 600)
    setTimeout(() => onCollect(), 900)
  }

  return (
    <div className={`chest-wrap ${opened ? 'opened' : ''}`} onClick={open}>
      <div className="chest-body">
        <div className="chest-lid" />
        <div className="chest-base">
          {!opened && <span className="chest-tap-hint">Tap to open!</span>}
        </div>
      </div>
      {collected && (
        <div className="chest-xp-burst">
          <span>+{xp} XP</span>
          {['⭐', '💛', '✨'].map((e, i) => (
            <span key={i} className="chest-particle" style={{ '--i': i }}>{e}</span>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Hearts Display ────────────────────────────────────────────────────────────
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

// ── Rewards Overlay Component ─────────────────────────────────────────────────
// Rendered as a proper React component inside each game
export function RewardsOverlay({
  xpPops, onRemoveXP,
  showCorrect, onCorrectDone,
  showWrong, onWrongDone,
  stars, onStarsDone,
  streak, onStreakDone,
  combo,
  chest, chestXP, onChestCollect,
}) {
  return (
    <>
      {xpPops.map(p => (
        <XPPop key={p.id} amount={p.amount} x={p.x} y={p.y} onDone={() => onRemoveXP(p.id)} />
      ))}
      {showCorrect && <CorrectFlash onDone={onCorrectDone} />}
      {showWrong && <WrongFlash onDone={onWrongDone} />}
      {stars > 0 && <StarBurst count={stars} onDone={onStarsDone} />}
      {streak > 0 && <StreakFlash streak={streak} onDone={onStreakDone} />}
      {combo >= 2 && <ComboBadge combo={combo} />}
      {chest && (
        <div className="chest-overlay">
          <div className="chest-overlay-inner">
            <p className="chest-title">🎁 Bonus Reward!</p>
            <TreasureChest xp={chestXP} onCollect={onChestCollect} />
          </div>
        </div>
      )}
    </>
  )
}

// ── useRewardSystem hook ──────────────────────────────────────────────────────
export function useRewardSystem() {
  const [xpPops, setXpPops] = useState([])
  const [showCorrect, setShowCorrect] = useState(false)
  const [showWrong, setShowWrong] = useState(false)
  const [stars, setStars] = useState(0)
  const [streak, setStreak] = useState(0)
  const [combo, setCombo] = useState(0)
  const [chest, setChest] = useState(false)
  const [chestXP, setChestXP] = useState(0)
  const idRef = useRef(0)

  function popXP(amount, element) {
    const rect = element?.getBoundingClientRect?.()
    const x = rect ? Math.round(rect.left + rect.width / 2) : Math.round(window.innerWidth / 2)
    const y = rect ? Math.round(rect.top) : Math.round(window.innerHeight / 3)
    const id = ++idRef.current
    setXpPops(prev => [...prev, { id, amount, x, y }])
  }

  function removeXP(id) {
    setXpPops(prev => prev.filter(p => p.id !== id))
  }

  function celebrateCorrect(streakVal = 0) {
    setShowCorrect(true)
    setCombo(c => c + 1)
    if (streakVal > 0 && streakVal % 3 === 0) {
      setStreak(streakVal)
    }
  }

  function celebrateWrong() {
    setShowWrong(true)
    setCombo(0)
  }

  function openChest(amount) {
    setChestXP(amount)
    setChest(true)
  }

  function showStarBurst(count = 3) {
    setStars(count)
  }

  const rewardProps = {
    xpPops,
    onRemoveXP: removeXP,
    showCorrect,
    onCorrectDone: () => setShowCorrect(false),
    showWrong,
    onWrongDone: () => setShowWrong(false),
    stars,
    onStarsDone: () => setStars(0),
    streak,
    onStreakDone: () => setStreak(0),
    combo,
    chest,
    chestXP,
    onChestCollect: () => setChest(false),
  }

  return {
    popXP,
    celebrateCorrect,
    celebrateWrong,
    openChest,
    showStarBurst,
    combo,
    rewardProps,
  }
}
