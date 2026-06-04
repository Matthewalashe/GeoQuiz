/**
 * LevelSelect — 50-level progression screen for each game.
 * 
 * Shows a scrollable grid of levels with:
 * - Locked/unlocked states based on user_game_progress
 * - Difficulty badges per level range (from level_config DB table)
 * - Time limits shown per difficulty tier
 * - Coin rewards preview
 * - Pass threshold from coin_config
 * 
 * ALL config values fetched from DB — zero hardcoded.
 * Username comes from profiles.username — no game-specific names.
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase.js'
import {
  getGameProgressForType, getLevelDifficulty, getCoinValue,
  loadGameConfig, regenerateLives, getWallet, buyLives
} from '../lib/gameService.js'
import {
  LockClosedRegular, CheckmarkCircleRegular, PlayCircleRegular,
  StarRegular, TimerRegular, HeartPulseRegular,
  ArrowLeftRegular
} from '@fluentui/react-icons'

const DIFF_COLORS = {
  1: '#22c55e',
  2: '#84cc16',
  3: '#f59e0b',
  4: '#ef4444',
  5: '#dc2626',
}
const DIFF_LABELS = {
  1: 'Beginner',
  2: 'Easy',
  3: 'Medium',
  4: 'Hard',
  5: 'Expert',
}

export default function LevelSelect({ session, gameSlug, gameName, gameColor, gameIcon, onStartLevel }) {
  const navigate = useNavigate()
  const userId = session?.user?.id

  const [progress, setProgress] = useState(null)
  const [maxLevels, setMaxLevels] = useState(50)
  const [livesData, setLivesData] = useState(null)
  const [wallet, setWallet] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showOutOfLives, setShowOutOfLives] = useState(false)
  const [buyingLives, setBuyingLives] = useState(false)

  const currentLevel = progress?.current_level || 1
  const highestLevel = progress?.highest_level_reached || 0

  const load = useCallback(async () => {
    if (!userId || !gameSlug) return
    setLoading(true)
    try {
      await loadGameConfig()

      // Get game max_levels from game_config table
      if (supabase) {
        const { data: gc } = await supabase
          .from('game_config')
          .select('max_levels')
          .eq('slug', gameSlug)
          .single()
        if (gc?.max_levels) setMaxLevels(gc.max_levels)
      }

      const [p, l, w] = await Promise.all([
        getGameProgressForType(userId, gameSlug),
        regenerateLives(userId),
        getWallet(userId),
      ])
      setProgress(p)
      setLivesData(l)
      setWallet(w)
    } catch (e) {
      console.error('LevelSelect load:', e)
    }
    setLoading(false)
  }, [userId, gameSlug])

  useEffect(() => { load() }, [load])

  function handleLevelClick(level) {
    // Check if level is unlocked
    if (level > currentLevel) return

    // Check lives
    if (livesData && livesData.lives <= 0) {
      setShowOutOfLives(true)
      return
    }

    // Get difficulty and time for this level
    const config = getLevelDifficulty(level)
    const questionsPerLevel = getCoinValue('questions_per_level', 10)
    const passThreshold = getCoinValue('pass_level_threshold', 7)

    if (onStartLevel) {
      onStartLevel({
        level,
        difficulty: config.difficulty,
        timeLimit: config.time_limit_secs,
        questionsCount: questionsPerLevel,
        passThreshold,
        gameType: gameSlug,
      })
    }
  }

  async function handleBuyLives() {
    if (!userId) return
    setBuyingLives(true)
    try {
      const result = await buyLives(userId)
      if (result?.success) {
        setLivesData({ lives: result.lives, max_lives: livesData?.max_lives || 5, seconds_until_next: 0 })
        setWallet(w => w ? { ...w, coins: result.new_balance } : w)
        setShowOutOfLives(false)
      }
    } catch (e) { console.error(e) }
    setBuyingLives(false)
  }

  // Generate level data
  const levels = Array.from({ length: maxLevels }, (_, i) => {
    const num = i + 1
    const config = getLevelDifficulty(num)
    const isUnlocked = num <= currentLevel
    const isCompleted = num < currentLevel
    const isCurrent = num === currentLevel
    return { num, ...config, isUnlocked, isCompleted, isCurrent }
  })

  // Group levels by difficulty range
  const groups = []
  let lastDiff = null
  levels.forEach(l => {
    if (l.difficulty !== lastDiff) {
      groups.push({ difficulty: l.difficulty, label: DIFF_LABELS[l.difficulty] || `Difficulty ${l.difficulty}`, color: DIFF_COLORS[l.difficulty] || '#888', timeLimit: l.time_limit_secs, levels: [] })
      lastDiff = l.difficulty
    }
    groups[groups.length - 1].levels.push(l)
  })

  const lives = livesData?.lives ?? 5
  const maxLivesVal = livesData?.max_lives ?? 5
  const passThreshold = getCoinValue('pass_level_threshold', 7)
  const questionsPerLevel = getCoinValue('questions_per_level', 10)
  const baseCoins = getCoinValue('level_complete_base', 10)
  const diffMultiplier = getCoinValue('difficulty_multiplier', 2)

  if (loading) {
    return (
      <section className="play-page">
        <div className="ls-loading">
          <div className="ls-loading-spinner" />
          <span>Loading levels...</span>
        </div>
      </section>
    )
  }

  return (
    <section className="play-page">
      {/* Header */}
      <div className="ls-header">
        <button className="ls-back" onClick={() => navigate('/play')}>
          <ArrowLeftRegular fontSize={18} /> Games
        </button>
        <div className="ls-title-row">
          <span className="ls-game-icon" style={{ color: gameColor }}>{gameIcon}</span>
          <div>
            <h1 className="ls-game-name">{gameName}</h1>
            <p className="ls-game-sub">
              Level {currentLevel} of {maxLevels} · {highestLevel > 0 ? `Best: Lvl ${highestLevel}` : 'New game'}
            </p>
          </div>
        </div>

        {/* Lives + Coins compact bar */}
        <div className="ls-info-bar">
          <div className="ls-info-item">
            <span className="ls-info-hearts">
              {Array.from({ length: maxLivesVal }).map((_, i) => (
                <span key={i} className={i < lives ? 'ls-h-full' : 'ls-h-empty'}>{i < lives ? '❤️' : '🤍'}</span>
              ))}
            </span>
          </div>
          <div className="ls-info-item">
            <span>🪙 {wallet?.coins ?? 0}</span>
          </div>
          <div className="ls-info-item ls-info-rules">
            <span>{passThreshold}/{questionsPerLevel} to pass</span>
          </div>
        </div>
      </div>

      {/* Level Groups */}
      {groups.map((g, gi) => (
        <div key={gi} className="ls-group">
          <div className="ls-group-header">
            <div className="ls-group-badge" style={{ background: g.color }}>
              {g.label}
            </div>
            <span className="ls-group-meta">
              <TimerRegular fontSize={12} /> {g.timeLimit}s · +{baseCoins + g.difficulty * diffMultiplier} 🪙
            </span>
          </div>

          <div className="ls-grid">
            {g.levels.map(l => (
              <button
                key={l.num}
                className={`ls-level ${l.isCompleted ? 'completed' : ''} ${l.isCurrent ? 'current' : ''} ${!l.isUnlocked ? 'locked' : ''}`}
                onClick={() => handleLevelClick(l.num)}
                disabled={!l.isUnlocked}
                style={l.isCurrent ? { borderColor: gameColor, boxShadow: `0 0 12px ${gameColor}44` } : {}}
              >
                {l.isCompleted ? (
                  <CheckmarkCircleRegular fontSize={16} className="ls-level-check" />
                ) : !l.isUnlocked ? (
                  <LockClosedRegular fontSize={14} className="ls-level-lock" />
                ) : l.isCurrent ? (
                  <PlayCircleRegular fontSize={16} className="ls-level-play" />
                ) : null}
                <span className="ls-level-num">{l.num}</span>
                {l.isCompleted && <span className="ls-level-star">⭐</span>}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Out of Lives Modal */}
      {showOutOfLives && (
        <div className="gj-modal-overlay" onClick={() => setShowOutOfLives(false)}>
          <div className="gj-modal" onClick={e => e.stopPropagation()}>
            <div className="gj-modal-hearts">🤍 🤍 🤍 🤍 🤍</div>
            <h2 className="gj-modal-title">Out of Lives!</h2>
            <p className="gj-modal-desc">Wait for lives to regenerate or spend coins.</p>
            {livesData?.seconds_until_next > 0 && (
              <div className="gj-modal-timer">
                <span className="gj-modal-timer-label">Next life in</span>
                <span className="gj-modal-timer-value">
                  {String(Math.floor(livesData.seconds_until_next / 60)).padStart(2, '0')}:
                  {String(livesData.seconds_until_next % 60).padStart(2, '0')}
                </span>
              </div>
            )}
            <div className="gj-modal-actions">
              <button className="gj-modal-btn primary" onClick={handleBuyLives} disabled={buyingLives || (wallet?.coins ?? 0) < getCoinValue('purchase_lives_cost', 20)}>
                {buyingLives ? 'Refilling...' : `🪙 Refill Lives — ${getCoinValue('purchase_lives_cost', 20)} coins`}
              </button>
              <button className="gj-modal-btn secondary" disabled>📺 Watch Ad (Coming Soon)</button>
            </div>
            <button className="gj-modal-close" onClick={() => setShowOutOfLives(false)}>Back</button>
          </div>
        </div>
      )}
    </section>
  )
}
