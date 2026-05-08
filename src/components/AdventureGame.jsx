import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckmarkCircleRegular, DismissCircleRegular, HeartPulseRegular } from '@fluentui/react-icons'
import { playCorrect, playWrong, vibrate } from '../engine/audio.js'
import { addXP } from '../engine/xp.js'
import { RewardsOverlay, useRewardSystem } from '../engine/rewards.jsx'

// ── STORIES ─────────────────────────────────────────────────────────────────
const STORIES = {
  commute: {
    id: 'commute',
    title: '🚌 Lagos Commute',
    desc: 'Can you survive the morning rush from Ikeja to VI?',
    color: '#eab308',
    image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&q=80&w=800',
    start: 'commute_start',
    nodes: {
      commute_start: {
        text: "It's 7:00 AM Monday in Lagos. You need to get from Ikeja to Victoria Island for a 9:00 AM job interview. How do you travel?",
        image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&q=80&w=800',
        choices: [
          { text: '🚌 Take the BRT bus', next: 'commute_brt', health: -10, xp: 10 },
          { text: '🚐 Take a Danfo', next: 'commute_danfo', health: -20, xp: 20 },
          { text: '🚗 Order an Uber', next: 'commute_uber', health: 0, xp: 5 },
        ]
      },
      commute_brt: {
        text: "The BRT lane is moving but packed like sardines. Your white shirt is getting rumpled. Suddenly the bus breaks down at Maryland!",
        image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800',
        choices: [
          { text: '⏳ Wait for rescue bus', next: 'commute_wait', health: -10, xp: 10 },
          { text: '🏍️ Find an Okada (bike)', next: 'commute_okada', health: -20, xp: 30 },
        ]
      },
      commute_danfo: {
        text: "The conductor shouts 'Oshodi! CMS!' You hop in. The driver speeds like Formula 1. You hit a massive pothole on Third Mainland Bridge!",
        image: 'https://images.unsplash.com/photo-1629851756531-f3b1406f3630?auto=format&fit=crop&q=80&w=800',
        choices: [
          { text: '🙏 Hold on tight and pray', next: 'commute_bridge', health: -30, xp: 40 },
          { text: '😤 Complain to the driver', next: 'commute_fight', health: -40, xp: 10 },
        ]
      },
      commute_uber: {
        text: "Driver calls: 'Hello, I'm at the junction but there's traffic. Can you walk down a bit?' Your interview is in 2 hours.",
        choices: [
          { text: '🚶 Walk down to meet him', next: 'commute_walk', health: -15, xp: 10 },
          { text: '❌ Cancel and take a Danfo', next: 'commute_danfo', health: -10, xp: 10 },
        ]
      },
      commute_wait: {
        text: "45 minutes later the rescue bus arrives. You reach VI by 9:30 AM — late, but luckily the HR manager is also stuck in traffic!",
        choices: [{ text: '🏢 Enter the office', next: 'end_win', health: 0, xp: 50 }]
      },
      commute_okada: {
        text: "The Okada rider dodges trailers and danfo buses like a video game. Heart in mouth, he drops you at the gate at 8:45 AM. You made it!",
        choices: [{ text: '💰 Pay him and enter', next: 'end_win', health: -20, xp: 100 }]
      },
      commute_bridge: {
        text: "The Danfo survives! But a LASTMA officer flags the driver down. The driver is trying to beg his way out.",
        choices: [
          { text: '🙏 Come down and beg too', next: 'commute_beg', health: -10, xp: 20 },
          { text: '🚶 Drop and walk', next: 'commute_walk', health: -30, xp: 10 },
        ]
      },
      commute_fight: {
        text: "The driver parks the bus and yells 'Everybody come down!' You're now stranded on the Third Mainland Bridge expressway.",
        choices: [{ text: '😔 Admit defeat', next: 'end_lose', health: -50, xp: 0 }]
      },
      commute_walk: {
        text: "You walk under the scorching Lagos sun. You arrive at the office sweating through your interview clothes. Not a great start.",
        choices: [{ text: '😰 Enter the office', next: 'end_lose', health: -60, xp: 10 }]
      },
      commute_beg: {
        text: "The LASTMA officer takes pity on you in your suit. The bus is released and you arrive at 8:55 AM. Success!",
        choices: [{ text: '🏢 Enter the office', next: 'end_win', health: 0, xp: 150 }]
      },
    }
  },
  market: {
    id: 'market',
    title: '🛒 Balogun Market Mission',
    desc: 'Navigate the largest market in Lagos without getting lost!',
    color: '#f97316',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800',
    start: 'market_start',
    nodes: {
      market_start: {
        text: "You're at the entrance of Balogun Market on Lagos Island. You need to buy fabric for a wedding next week. The market is enormous and confusing. What do you do first?",
        image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800',
        choices: [
          { text: '🗺️ Ask a local trader for directions', next: 'market_ask', health: 0, xp: 20 },
          { text: '🚶 Walk in and explore alone', next: 'market_explore', health: -10, xp: 10 },
          { text: '📱 Follow Google Maps', next: 'market_maps', health: 0, xp: 5 },
        ]
      },
      market_ask: {
        text: "A friendly Iya Alagbo (cloth seller) guides you to the fabric section. But she insists you buy from her stall first. The price she quotes is 3x the market rate.",
        choices: [
          { text: '💰 Pay her price (she helped you)', next: 'market_overpay', health: 0, xp: 10 },
          { text: '🤝 Negotiate the price down', next: 'market_negotiate', health: 0, xp: 40 },
          { text: '🏃 Politely decline and move on', next: 'market_explore', health: -10, xp: 20 },
        ]
      },
      market_explore: {
        text: "You wander deep into the market. Stalls go on for miles. After 40 minutes you realize you're completely lost and your phone battery is at 5%.",
        choices: [
          { text: '🆘 Ask anyone nearby for help', next: 'market_lost_help', health: -20, xp: 20 },
          { text: '📵 Try to retrace your steps', next: 'market_lost_retrace', health: -30, xp: 10 },
        ]
      },
      market_maps: {
        text: "Google Maps shows the market as one big blob. It's useless inside the market. Your data also runs out. You're on your own now.",
        choices: [
          { text: '🤷 Ask someone for help', next: 'market_lost_help', health: -10, xp: 15 },
          { text: '🚗 Head back to the entrance', next: 'market_negotiate', health: 0, xp: 20 },
        ]
      },
      market_negotiate: {
        text: "After 15 minutes of hard bargaining, you get beautiful Ankara fabric at a fair price. The seller respects your hustle and throws in a free headwrap!",
        choices: [{ text: '🛍️ Complete the purchase', next: 'end_win', health: 0, xp: 120 }]
      },
      market_overpay: {
        text: "You paid full price but got quality fabric and saved time. The trader adds you on WhatsApp for future deals. Not the worst outcome!",
        choices: [{ text: '📱 Save her number and leave', next: 'end_win', health: 0, xp: 50 }]
      },
      market_lost_help: {
        text: "A young boy offers to guide you back to the fabric section for ₦500. He leads you straight there in 5 minutes. Lagos hustlers are resourceful!",
        choices: [{ text: '💵 Pay him and shop', next: 'market_negotiate', health: 0, xp: 80 }]
      },
      market_lost_retrace: {
        text: "You wander for another hour. Your phone dies. You accidentally exit into a completely different street. You give up for today.",
        choices: [{ text: '😞 Head home empty-handed', next: 'end_lose', health: -40, xp: 0 }]
      },
    }
  },
  beach: {
    id: 'beach',
    title: '🏖️ Lagos Beach Day',
    desc: 'Plan the perfect beach day on the Lagos coast',
    color: '#0ea5e9',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800',
    start: 'beach_start',
    nodes: {
      beach_start: {
        text: "It's Saturday and you decide to go to the beach with friends. Lagos has several options. Which beach do you choose?",
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800',
        choices: [
          { text: '⛵ Tarkwa Bay (boat ride only)', next: 'beach_tarkwa', health: 0, xp: 30 },
          { text: '🏖️ Elegushi Beach (road access)', next: 'beach_elegushi', health: 0, xp: 20 },
          { text: '🌊 Lekki Beach (free entry)', next: 'beach_lekki', health: 0, xp: 10 },
        ]
      },
      beach_tarkwa: {
        text: "You head to Maroko Jetty. The boat to Tarkwa Bay costs ₦2,000 per person. The sea breeze is incredible. On the island, you find a horse-riding vendor.",
        choices: [
          { text: '🐎 Try horse riding on the beach', next: 'beach_horse', health: 0, xp: 50 },
          { text: '🏊 Swim and relax', next: 'beach_win_great', health: 0, xp: 80 },
        ]
      },
      beach_elegushi: {
        text: "Elegushi is lively — music, food stalls, and a crowd. You find a good spot. Then a tidal wave of a wave crashes and soaks your phone completely.",
        choices: [
          { text: '😂 Laugh it off and keep having fun', next: 'beach_win_great', health: -10, xp: 60 },
          { text: '😡 Panick and rush to find rice to save it', next: 'beach_phone', health: -20, xp: 20 },
        ]
      },
      beach_lekki: {
        text: "Lekki Beach is free but crowded on weekends. You spread your mat. A beach vendor won't stop disturbing you every 5 minutes selling groundnut and suya.",
        choices: [
          { text: '🥜 Buy the suya and enjoy', next: 'beach_win_good', health: 0, xp: 40 },
          { text: '😤 Ask him to leave you alone', next: 'beach_vendor', health: -10, xp: 20 },
        ]
      },
      beach_horse: {
        text: "The horse ride along the beach at sunset is absolutely magical. Your photos go viral on Instagram. Perfect Lagos Saturday!",
        choices: [{ text: '📸 Head home happy', next: 'end_win', health: 0, xp: 150 }]
      },
      beach_win_great: {
        text: "Despite the small mishap, it's one of the best days of your life. Sunset over Lagos waters, cold drinks, and great company. Perfect!",
        choices: [{ text: '🌅 Head home happy', next: 'end_win', health: 0, xp: 120 }]
      },
      beach_win_good: {
        text: "The suya vendor's pepper-grilled meat actually tastes amazing. You buy more and have a brilliant afternoon. Lagos delivers again!",
        choices: [{ text: '🌅 Head home happy', next: 'end_win', health: 0, xp: 80 }]
      },
      beach_phone: {
        text: "Your phone might be okay in rice for 24 hours... but you spent your entire beach day panicking. You barely enjoyed it. Maybe next time.",
        choices: [{ text: '😕 Pack up and head home early', next: 'end_lose', health: -20, xp: 20 }]
      },
      beach_vendor: {
        text: "You ask the vendor to leave. He argues back loudly. The whole beach is watching. You feel so embarrassed you pack up and go home.",
        choices: [{ text: '😖 Retreat home', next: 'end_lose', health: -30, xp: 0 }]
      },
    }
  }
}

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
          <div className="game-end-card">
            <CheckmarkCircleRegular fontSize={64} style={{ color: '#eab308' }} />
            <h2>Mission Complete! 🎉</h2>
            <div className="game-end-score">+{xp + 100} XP</div>
            <p className="game-end-label">{story?.title} — conquered!</p>
            <div className="game-end-actions">
              <button className="btn btn-primary" onClick={() => { setStarted(false); setSelectedStory(null) }}>Play Another</button>
              <button className="btn btn-outline" onClick={() => navigate('/play')}>Back to Hub</button>
            </div>
          </div>
        ) : phase === 'lost' ? (
          <div className="game-end-card">
            <DismissCircleRegular fontSize={64} style={{ color: '#ef4444' }} />
            <h2>Lagos Won This Round 😅</h2>
            <p className="game-end-label">You earned {xp} XP. Better luck next time!</p>
            <div className="game-end-actions">
              <button className="btn btn-primary" onClick={() => startStory()}>Try Again</button>
              <button className="btn btn-outline" onClick={() => { setStarted(false); setSelectedStory(null) }}>Change Story</button>
            </div>
          </div>
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
