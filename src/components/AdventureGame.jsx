import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckmarkCircleRegular, DismissCircleRegular, HeartPulseRegular } from '@fluentui/react-icons'
import { playCorrect, playWrong, vibrate } from '../engine/audio.js'
import { addXP } from '../engine/xp.js'
import { autoSubmitScore } from '../engine/leaderboard.js'
import { RewardsOverlay, useRewardSystem } from '../engine/rewards.jsx'
import ResultCard from './ResultCard.jsx'

import { ADVENTURE_STORIES as STORIES } from '../data/adventures.js'

const STORY_LIST = Object.values(STORIES)

export default function AdventureGame() {
  const navigate = useNavigate()
  const { popXP, celebrateCorrect, celebrateWrong, openChest, showStarBurst, rewardProps } = useRewardSystem()
  const [selectedStory, setSelectedStory] = useState(null)
  const [started, setStarted] = useState(false)
  const [nodeId, setNodeId] = useState(null)
  const [health, setHealth] = useState(100)
  const [xp, setXp] = useState(0)
  const [phase, setPhase] = useState('playing')
  const [menuOpen, setMenuOpen] = useState(false)
  const [showQuitModal, setShowQuitModal] = useState(false)
  const [pendingNav, setPendingNav] = useState(null)

  function startStory() {
    const story = STORIES[selectedStory]
    setNodeId(story.start)
    setHealth(100)
    setXp(0)
    setPhase('playing')
    setStarted(true)
  }

  const story = selectedStory ? STORIES[selectedStory] : null
  const node = started && story ? story.nodes[nodeId] : null

  function makeChoice(choice) {
    if (phase !== 'playing') return
    const newHealth = health + choice.health
    setHealth(Math.max(0, newHealth))
    setXp(x => x + choice.xp)
    if (newHealth <= 0 || choice.next === 'end_lose') {
      setPhase('lost')
      playWrong()
      vibrate([100, 50, 100])
      celebrateWrong()
    } else if (choice.next === 'end_win') {
      setPhase('won')
      playCorrect()
      vibrate([50, 50, 50])
      const finalXP = xp + choice.xp + 100
      addXP('GAME_WIN', Math.ceil(finalXP / 100))
      // Perfect health bonus
      if (newHealth >= 80) {
        setTimeout(() => openChest(50), 400)
      } else {
        showStarBurst(health >= 60 ? 3 : 2)
      }
      // Submit to leaderboard
      const finalScore = xp + choice.xp + 100
      autoSubmitScore({ gameType: 'adventure', score: finalScore, maxScore: 500, questionCount: 1 })
    } else {
      // Good choice
      if (choice.xp > 0) popXP(choice.xp, null)
      celebrateCorrect()
      setNodeId(choice.next)
    }
  }

  function handleQuit(dest) {
    setPendingNav(dest)
    if (phase === 'playing') setShowQuitModal(true)
    else navigate(dest)
  }

  // ── STORY SELECTOR ───────────────────────────────────────────────────────
  if (!started) {
    return (
      <div className="game-lobby">
        <button className="gh-back" onClick={() => navigate('/play')}>← Back</button>
        <h2 className="lobby-title">🧭 Adventure</h2>
        <p className="lobby-sub">Choose a scenario and survive Lagos</p>
        <div className="lobby-packs">
          {STORY_LIST.map(s => (
            <button
              key={s.id}
              className={`lobby-pack-card ${selectedStory === s.id ? 'active' : ''}`}
              style={{ '--pack-color': s.color }}
              onClick={() => setSelectedStory(s.id)}
            >
              <div className="lpc-story-img" style={{ backgroundImage: `url(${s.image})` }} />
              <span className="lpc-icon">{s.title.split(' ')[0]}</span>
              <span className="lpc-label">{s.title.split(' ').slice(1).join(' ')}</span>
              <span className="lpc-desc">{s.desc}</span>
            </button>
          ))}
        </div>
        <button
          className="lobby-start-btn"
          disabled={!selectedStory}
          onClick={startStory}
          style={{ background: selectedStory ? (STORIES[selectedStory]?.color || '#eab308') : undefined }}
        >
          Begin Adventure →
        </button>
      </div>
    )
  }

  // ── GAMEPLAY ─────────────────────────────────────────────────────────────
  return (
    <section className="game-screen adv-game">
      <RewardsOverlay {...rewardProps} />
      {showQuitModal && (
        <div className="quit-overlay" onClick={() => setShowQuitModal(false)}>
          <div className="quit-modal" onClick={e => e.stopPropagation()}>
            <h3>Quit Adventure?</h3>
            <p>Your journey will be forgotten.</p>
            <div className="quit-actions">
              <button className="btn btn-primary" onClick={() => setShowQuitModal(false)}>Keep Going</button>
              <button className="btn btn-outline quit-confirm" onClick={() => navigate(pendingNav || '/')}>Quit</button>
            </div>
          </div>
        </div>
      )}
      <div className={`legend-sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="legend-section sidebar-nav">
          <button className="sidebar-nav-btn" onClick={() => handleQuit('/')}>Home</button>
          <button className="sidebar-nav-btn" onClick={() => { setStarted(false); setSelectedStory(null) }}>Change Story</button>
          <button className="sidebar-nav-btn" onClick={() => startStory()}>Restart</button>
          <button className="sidebar-nav-btn sidebar-quit" onClick={() => handleQuit('/')}>Quit</button>
        </div>
      </div>
      <button className={`legend-toggle ${menuOpen ? 'shifted' : ''}`} onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? '◀' : '☰'}
      </button>

      <div className="game-hud" style={{ borderImage: 'none', borderColor: 'var(--border)' }}>
        <div className="hud-left">
          <span className="hud-counter">
            <HeartPulseRegular style={{ color: health > 40 ? '#22c55e' : '#ef4444', verticalAlign: 'middle' }} /> {health}%
          </span>
        </div>
        <div className="hud-center">
          <div className="hud-progress">
            <div className="hud-progress-fill" style={{ width: `${health}%`, background: health > 40 ? '#22c55e' : '#ef4444' }} />
          </div>
        </div>
        <div className="hud-right">
          <span className="hud-score">{xp} XP</span>
        </div>
      </div>

      <div className="adv-body">
        {phase === 'won' ? (
          <ResultCard
            score={xp + 100}
            maxScore={500}
            pointsEarned={xp + 100}
            gameTitle="Adventure"
            gameEmoji="🗺️"
            gameType="adventure"
            onPlayAgain={() => { setPhase('pick'); setStarted(false); setSelectedStory(null) }}
          >
            <p className="game-end-label">{story?.title} — conquered!</p>
          </ResultCard>
        ) : phase === 'lost' ? (
          <ResultCard
            score={0}
            maxScore={500}
            pointsEarned={0}
            gameTitle="Adventure"
            gameEmoji="🗺️"
            gameType="adventure"
            onPlayAgain={() => { setPhase('playing'); startStory() }}
          >
            <p className="game-end-label">You earned {xp} XP. Better luck next time!</p>
          </ResultCard>
        ) : node ? (
          <div className="adv-scroll">
            <div className="adv-story-card">
              {node.image && <img src={node.image} alt="Scene" className="adv-img" />}
              <div className="adv-content">
                <p className="adv-text">{node.text}</p>
                <div className="adv-choices">
                  {node.choices.map((c, i) => (
                    <button key={i} className="adv-choice-btn" onClick={() => makeChoice(c)}>
                      {c.text}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
