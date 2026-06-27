import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { playLevelPass, playLevelFail, playLevelUnlock, vibrateLevelPass, vibrateLevelFail } from '../engine/audio.js'

/**
 * GameContinueModal — Full-screen tropical/retro post-game modal.
 * 
 * Shows after completing a round:
 * - PASSED → "Level Complete!" with unlock animation, CTA = "Continue →"
 * - FAILED → "Almost There!" encouraging retry, CTA = "Replay"
 * - Cancel → returns to game selection screen
 */
export default function GameContinueModal({
  passed,
  level,
  score,
  maxScore,
  correctCount,
  totalQuestions,
  passThreshold,
  gameTitle = 'Game',
  gameEmoji = '🎮',
  xpEarned = 0,
  coinsEarned = 0,
  onReplay,
  onContinue,
  onCancel,
}) {
  const navigate = useNavigate()
  const [animPhase, setAnimPhase] = useState('enter') // enter | reveal | ready
  const [showUnlock, setShowUnlock] = useState(false)
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
  const needed = passThreshold - correctCount

  // Entrance animation sequence
  useEffect(() => {
    // Phase 1: entrance (overlay fades in)
    const t1 = setTimeout(() => setAnimPhase('reveal'), 400)
    // Phase 2: icon reveal + sound
    const t2 = setTimeout(() => {
      if (passed) {
        playLevelPass()
        vibrateLevelPass()
      } else {
        playLevelFail()
        vibrateLevelFail()
      }
    }, 500)
    // Phase 3: ready state (buttons appear)
    const t3 = setTimeout(() => setAnimPhase('ready'), 900)
    // Phase 4: unlock shimmer (passed only)
    const t4 = passed ? setTimeout(() => {
      setShowUnlock(true)
      playLevelUnlock()
    }, 1400) : null

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3)
      if (t4) clearTimeout(t4)
    }
  }, [passed])

  function handleCancel() {
    if (onCancel) onCancel()
    else navigate('/play')
  }

  return (
    <div className={`gcm-overlay ${animPhase}`}>
      {/* Decorative tropical elements */}
      <div className="gcm-palm gcm-palm-l" aria-hidden="true">🌴</div>
      <div className="gcm-palm gcm-palm-r" aria-hidden="true">🌴</div>
      <div className="gcm-hibiscus gcm-hib-1" aria-hidden="true">🌺</div>
      <div className="gcm-hibiscus gcm-hib-2" aria-hidden="true">🌺</div>
      <div className="gcm-hibiscus gcm-hib-3" aria-hidden="true">🌿</div>

      {/* Close button */}
      <button className="gcm-close" onClick={handleCancel} aria-label="Close">✕</button>

      <div className="gcm-card">
        {/* Status icon */}
        <div className={`gcm-status-ring ${passed ? 'gcm-pass' : 'gcm-fail'}`}>
          <span className="gcm-status-icon">
            {passed ? '🏆' : '💪'}
          </span>
        </div>

        {/* Level badge */}
        <div className={`gcm-level-badge ${showUnlock ? 'gcm-unlocked' : ''}`}>
          <span className="gcm-level-num">Level {level}</span>
          {showUnlock && <span className="gcm-unlock-spark">✨</span>}
        </div>

        {/* Heading */}
        <h2 className={`gcm-heading ${passed ? 'gcm-pass-text' : 'gcm-fail-text'}`}>
          {passed ? 'Level Complete!' : 'Almost There!'}
        </h2>

        {/* Score row */}
        <div className="gcm-score-row">
          <div className="gcm-score-item">
            <span className="gcm-score-big">{correctCount}/{totalQuestions}</span>
            <span className="gcm-score-label">Correct</span>
          </div>
          <div className="gcm-score-divider" />
          <div className="gcm-score-item">
            <span className="gcm-score-big">{score}</span>
            <span className="gcm-score-label">Points</span>
          </div>
          <div className="gcm-score-divider" />
          <div className="gcm-score-item">
            <span className="gcm-score-big">{pct}%</span>
            <span className="gcm-score-label">Score</span>
          </div>
        </div>

        {/* Rewards earned */}
        {(xpEarned > 0 || coinsEarned > 0) && (
          <div className="gcm-rewards-row">
            {xpEarned > 0 && (
              <div className="gcm-reward-chip gcm-reward-xp">
                <span className="gcm-reward-icon">⚡</span>
                <span className="gcm-reward-val">+{xpEarned} XP</span>
              </div>
            )}
            {coinsEarned > 0 && (
              <div className="gcm-reward-chip gcm-reward-coin">
                <span className="gcm-reward-icon">🪙</span>
                <span className="gcm-reward-val">+{coinsEarned} coins</span>
              </div>
            )}
          </div>
        )}

        {/* Message */}
        <p className="gcm-message">
          {passed
            ? `Great job! You passed with ${correctCount}/${totalQuestions} correct. Level ${level + 1} is now unlocked!`
            : `You needed ${passThreshold} correct to pass. ${needed > 0 ? `Just ${needed} more!` : ''} Try again — you've got this!`
          }
        </p>

        {/* Pass threshold indicator */}
        <div className="gcm-threshold-bar">
          <div className="gcm-threshold-track">
            <div
              className={`gcm-threshold-fill ${passed ? 'gcm-fill-pass' : 'gcm-fill-fail'}`}
              style={{ width: `${Math.min((correctCount / totalQuestions) * 100, 100)}%` }}
            />
            <div
              className="gcm-threshold-marker"
              style={{ left: `${(passThreshold / totalQuestions) * 100}%` }}
            >
              <span className="gcm-marker-label">{passThreshold} to pass</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className={`gcm-actions ${animPhase === 'ready' ? 'gcm-actions-visible' : ''}`}>
          {passed ? (
            <button className="gcm-btn gcm-btn-primary gcm-btn-continue" onClick={onContinue}>
              <span className="gcm-btn-icon">🔓</span>
              Continue to Level {level + 1} →
            </button>
          ) : (
            <button className="gcm-btn gcm-btn-primary gcm-btn-replay" onClick={onReplay}>
              <span className="gcm-btn-icon">🔄</span>
              Replay Level {level}
            </button>
          )}
          <button className="gcm-btn gcm-btn-secondary" onClick={handleCancel}>
            Back to Games
          </button>
        </div>

        {/* Game title footer */}
        <div className="gcm-footer">
          <span>{gameEmoji}</span> {gameTitle}
        </div>
      </div>
    </div>
  )
}
