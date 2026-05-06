import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckmarkCircleRegular, DismissCircleRegular, HeartPulseRegular } from '@fluentui/react-icons'
import { playCorrect, playWrong, vibrate } from '../engine/audio.js'
import { addXP } from '../engine/xp.js'

const STORY = {
  start: {
    text: "It's 7:00 AM on a Monday in Lagos. You need to get from Ikeja to Victoria Island for an important 9:00 AM job interview. How do you travel?",
    image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&q=80&w=800',
    choices: [
      { text: "Take the BRT bus", next: "brt", health: -10, xp: 10 },
      { text: "Take a Danfo", next: "danfo", health: -20, xp: 20 },
      { text: "Order an Uber", next: "uber", health: 0, xp: 5 },
    ]
  },
  brt: {
    text: "The BRT lane is moving, but the bus is packed like sardines. You manage to squeeze in, but your white shirt is getting rumpled. Suddenly, the bus breaks down at Maryland.",
    image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800',
    choices: [
      { text: "Wait for the rescue bus", next: "wait", health: -10, xp: 10 },
      { text: "Jump out and find a bike (Okada)", next: "okada", health: -20, xp: 30 }
    ]
  },
  danfo: {
    text: "The Danfo conductor is shouting 'Oshodi! CMS!'. You hop in. The driver is speeding like he's in Formula 1. You hit a massive pothole at Third Mainland Bridge.",
    image: 'https://images.unsplash.com/photo-1629851756531-f3b1406f3630?auto=format&fit=crop&q=80&w=800',
    choices: [
      { text: "Hold on tight and pray", next: "bridge", health: -30, xp: 40 },
      { text: "Complain to the driver", next: "fight", health: -40, xp: 10 }
    ]
  },
  uber: {
    text: "You order an Uber. The driver calls: 'Hello, I'm at the junction but there's traffic. Can you walk down?'",
    choices: [
      { text: "Walk down to meet him", next: "walk", health: -15, xp: 10 },
      { text: "Cancel and find a Danfo", next: "danfo", health: -10, xp: 10 }
    ]
  },
  wait: {
    text: "You waited 45 minutes for the rescue bus. You finally arrive at VI by 9:30 AM. You're late, but luckily, the HR manager is also stuck in traffic!",
    choices: [
      { text: "Enter the office", next: "end_win", health: 0, xp: 50 }
    ]
  },
  okada: {
    text: "You take an Okada. He dodges between trailers and cars. Your heart is in your mouth, but he drops you right at the gate at 8:45 AM. You made it!",
    choices: [
      { text: "Pay him and enter", next: "end_win", health: -20, xp: 100 }
    ]
  },
  bridge: {
    text: "The Danfo survives the pothole, but a LASTMA officer flags the driver down. The driver tries to beg him.",
    choices: [
      { text: "Come down and beg too", next: "beg", health: -10, xp: 20 },
      { text: "Drop from the bus and walk", next: "walk", health: -30, xp: 10 }
    ]
  },
  fight: {
    text: "The driver gets angry and parks the bus. 'Everybody come down!' he shouts. Now you are stranded on the expressway.",
    choices: [
      { text: "Admit defeat", next: "end_lose", health: -50, xp: 0 }
    ]
  },
  walk: {
    text: "You start walking under the hot Lagos sun. You arrive at the interview sweating profusely and exhausted.",
    choices: [
      { text: "Enter the office", next: "end_lose", health: -60, xp: 10 }
    ]
  },
  beg: {
    text: "The LASTMA officer pities you in your suit and lets the bus go. You arrive at VI by 8:55 AM. Success!",
    choices: [
      { text: "Enter the office", next: "end_win", health: 0, xp: 150 }
    ]
  }
}

export default function AdventureGame() {
  const navigate = useNavigate()
  const [nodeId, setNodeId] = useState('start')
  const [health, setHealth] = useState(100)
  const [xp, setXp] = useState(0)
  const [phase, setPhase] = useState('playing') // playing | won | lost
  
  const [menuOpen, setMenuOpen] = useState(false)
  const [showQuitModal, setShowQuitModal] = useState(false)
  const [pendingNav, setPendingNav] = useState(null)

  const node = STORY[nodeId]

  function makeChoice(choice) {
    if (phase !== 'playing') return

    const newHealth = health + choice.health
    setHealth(newHealth)
    setXp(x => x + choice.xp)

    if (newHealth <= 0 || choice.next === 'end_lose') {
      setPhase('lost')
      playWrong()
      vibrate([100, 50, 100])
    } else if (choice.next === 'end_win') {
      setPhase('won')
      playCorrect()
      vibrate([50, 50, 50])
      addXP('GAME_WIN', xp + 100)
    } else {
      setNodeId(choice.next)
    }
  }

  function handleQuit(dest) {
    setPendingNav(dest)
    if (phase === 'playing') setShowQuitModal(true)
    else navigate(dest)
  }

  return (
    <section className="game-screen adv-game">
      {/* Quit modal */}
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

      {/* Menu sidebar */}
      <div className={`legend-sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="legend-section sidebar-nav">
          <button className="sidebar-nav-btn" onClick={() => handleQuit('/')}>Home</button>
          <button className="sidebar-nav-btn" onClick={() => handleQuit('/play')}>New Game</button>
          <button className="sidebar-nav-btn" onClick={() => window.location.reload()}>Restart</button>
          <button className="sidebar-nav-btn sidebar-quit" onClick={() => handleQuit('/')}>Quit</button>
        </div>
      </div>
      <button className={`legend-toggle ${menuOpen ? 'shifted' : ''}`} onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? '◀' : '☰'}
      </button>

      {/* Floating HUD */}
      <div className="game-hud" style={{ borderImage: 'none', borderColor: 'var(--border)' }}>
        <div className="hud-left">
          <span className="hud-counter"><HeartPulseRegular style={{ color: '#ef4444' }} /> {health}%</span>
        </div>
        <div className="hud-right">
          <span className="hud-score">{xp} XP</span>
        </div>
      </div>

      <div className="adv-body" style={{ marginTop: '70px', padding: '1rem', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 90px)' }}>
        {phase === 'won' ? (
          <div className="cw-win" style={{ marginTop: 'auto', marginBottom: 'auto' }}>
            <CheckmarkCircleRegular fontSize={64} style={{ color: '#eab308' }} />
            <h2>You Survived Lagos!</h2>
            <p>You aced the interview. +{xp + 100} XP</p>
            <button className="btn btn-primary" onClick={() => navigate('/play')}>Back to Hub</button>
          </div>
        ) : phase === 'lost' ? (
          <div className="cw-win" style={{ marginTop: 'auto', marginBottom: 'auto' }}>
            <DismissCircleRegular fontSize={64} style={{ color: '#ef4444' }} />
            <h2>Lagos Defeated You...</h2>
            <p>You missed the interview and went back home to eat Eba.</p>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>Try Again</button>
            <button className="btn btn-outline" style={{ marginLeft: '1rem' }} onClick={() => navigate('/play')}>Back to Hub</button>
          </div>
        ) : (
          <div className="adv-story-card">
            {node.image && <img src={node.image} alt="Adventure Scene" className="adv-img" />}
            <p className="adv-text">{node.text}</p>
            <div className="adv-choices">
              {node.choices.map((c, i) => (
                <button key={i} className="btn btn-outline adv-choice-btn" onClick={() => makeChoice(c)}>
                  {c.text}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
