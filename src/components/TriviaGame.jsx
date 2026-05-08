import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckmarkCircleRegular, DismissCircleRegular } from '@fluentui/react-icons'
import { playCorrect, playWrong, playTick, vibrate } from '../engine/audio.js'
import { addXP } from '../engine/xp.js'
import { autoSubmitScore } from '../engine/leaderboard.js'
import { RewardsOverlay, useRewardSystem } from '../engine/rewards.jsx'
import PostGameLoop from './PostGameLoop.jsx'

// ── DATA ─────────────────────────────────────────────────────────────────────
const PACKS = {
  lagos: {
    id: 'lagos', label: '🌊 Lagos Life', desc: 'Bridges, buses, markets & neighborhoods', color: '#0ea5e9',
    questions: [
      { q: 'Which is the longest bridge in Lagos?', options: ['Third Mainland Bridge', 'Carter Bridge', 'Eko Bridge', 'Lekki-Ikoyi Link Bridge'], ans: 0, fact: 'At 11.8 km, Third Mainland Bridge was the longest in Africa when built in 1990.' },
      { q: 'What year was Lagos State created?', options: ['1960', '1967', '1976', '1991'], ans: 1, fact: 'Lagos State was created on 27 May 1967 from the former Western Region.' },
      { q: 'What is the popular yellow commercial bus in Lagos called?', options: ['Keke', 'Okada', 'Danfo', 'Molue'], ans: 2, fact: 'Danfo buses carry over 10 million Lagosians daily.' },
      { q: 'Which of these is NOT an LGA in Lagos State?', options: ['Ikeja', 'Surulere', 'Ogbomoso', 'Epe'], ans: 2, fact: 'Ogbomoso is in Oyo State. Lagos has 20 LGAs.' },
      { q: 'What is the famous arts market in Lekki called?', options: ['Balogun Market', 'Lekki Arts & Crafts Market', 'Tejuosho Market', 'Computer Village'], ans: 1, fact: 'Lekki Arts & Crafts Market is Lagos\'s top destination for souvenirs and local art.' },
      { q: 'What does "CMS" stand for in Lagos bus stop name?', options: ['Central Motor Services', 'Church Missionary Society', 'City Municipal Services', 'Central Market Street'], ans: 1, fact: 'The Church Missionary Society arrived in Lagos in 1842.' },
      { q: 'Which is Africa\'s largest open-air electronics market?', options: ['Trade Fair Complex', 'Computer Village, Ikeja', 'Alaba International', 'Ladipo Market'], ans: 1, fact: 'Computer Village generates ₦1.5 billion daily with over 5,000 shops.' },
      { q: 'Which bridge links Lagos Mainland to Lagos Island?', options: ['Third Mainland only', 'Carter Bridge only', 'Eko Bridge only', 'All three bridges'], ans: 3, fact: 'Three bridges serve as links — Third Mainland (11.8 km), Carter (1901), and Eko (1975).' },
      { q: 'Oshodi was famously called the most dangerous bus stop in which continent?', options: ['The World', 'Africa', 'West Africa', 'Nigeria'], ans: 1, fact: 'Before Fashola\'s 2009 cleanup, Oshodi had 500,000+ daily commuters and rampant crime.' },
      { q: 'What is "Agbado" known for among Lagos commuters?', options: ['Last affordable bus stop', 'Fastest BRT route', 'The end of Lagos', 'Cheapest fuel station'], ans: 2, fact: '"Agbado is the end of Lagos" — it marks where Lagos meets Ogun State.' },
    ]
  },
  nigeria: {
    id: 'nigeria', label: '🇳🇬 Nigeria Essentials', desc: 'History, landmarks & national icons', color: '#22c55e',
    questions: [
      { q: 'In what year did Nigeria gain independence?', options: ['1955', '1960', '1963', '1970'], ans: 1, fact: 'Nigeria gained independence from Britain on 1 October 1960.' },
      { q: 'Which rock formation appears on the ₦100 note?', options: ['Olumo Rock', 'Aso Rock', 'Zuma Rock', 'Idanre Hills'], ans: 2, fact: 'Zuma Rock stands 725m high — "Gateway to Abuja".' },
      { q: 'What does FESTAC stand for?', options: ['Federal State Arts Council', 'Festival of Arts & Culture', 'Festival of African Culture', 'Federal Arts Commission'], ans: 1, fact: 'FESTAC 77 attracted 17,000 participants from 59 countries to Lagos.' },
      { q: 'Which city is Nigeria\'s seat of government?', options: ['Lagos', 'Kano', 'Ibadan', 'Abuja'], ans: 3, fact: 'Abuja became the capital in 1991, replacing Lagos for neutrality.' },
      { q: 'Which Nigerian author won the Nobel Prize for Literature?', options: ['Chinua Achebe', 'Wole Soyinka', 'Ben Okri', 'Chimamanda Adichie'], ans: 1, fact: 'Wole Soyinka won in 1986, the first African to receive the Nobel Prize in Literature.' },
      { q: 'What is Nigeria\'s national animal?', options: ['Lion', 'Elephant', 'Eagle', 'Horse'], ans: 2, fact: 'The Eagle on the coat of arms represents strength.' },
      { q: 'Which state produces most of Nigeria\'s cocoa?', options: ['Oyo', 'Ondo', 'Osun', 'Ekiti'], ans: 1, fact: 'Ondo State accounts for over 40% of Nigeria\'s cocoa production.' },
      { q: 'Who was Nigeria\'s first military head of state?', options: ['Yakubu Gowon', 'Nnamdi Azikiwe', 'Tafawa Balewa', 'Aguiyi-Ironsi'], ans: 3, fact: 'Aguiyi-Ironsi became head of state after the January 1966 coup.' },
      { q: 'What is the Niger-Delta region primarily known for?', options: ['Agriculture', 'Oil production', 'Tin mining', 'Cocoa farming'], ans: 1, fact: 'Nigeria is Africa\'s largest oil producer with 35+ billion barrels in the Niger Delta.' },
      { q: 'Olumo Rock is located in which city?', options: ['Ibadan', 'Ijebu-Ode', 'Abeokuta', 'Osogbo'], ans: 2, fact: 'Olumo Rock in Abeokuta served as a natural fortress during 19th century inter-tribal wars.' },
    ]
  },
  culture: {
    id: 'culture', label: '🎭 Culture & Vibes', desc: 'Food, music, slang & festivals', color: '#f97316',
    questions: [
      { q: 'Which dish is Ewa Agoyin typically paired with?', options: ['Rice', 'Agege Bread', 'Pounded Yam', 'Eba'], ans: 1, fact: 'Ewa Agoyin + Agege Bread is Lagos\'s most iconic street breakfast.' },
      { q: 'The Eyo Festival masquerade is unique to which city?', options: ['Ibadan', 'Abeokuta', 'Lagos', 'Benin City'], ans: 2, fact: 'The Eyo Festival features white-robed masquerades parading through Lagos Island.' },
      { q: 'What Afrobeats artist made "Ojuelegba" globally famous?', options: ['Davido', 'Burna Boy', 'Wizkid', 'Fela Kuti'], ans: 2, fact: 'Wizkid\'s "Ojuelegba" was remixed by Drake and Skepta, making it an international hit.' },
      { q: 'Which Nigerian musician is called "Abami Eda"?', options: ['Wizkid', 'Burna Boy', 'Fela Kuti', '2Baba'], ans: 2, fact: '"Abami Eda" (peculiar being) was Fela Kuti\'s nickname. His Afrobeat was deeply political.' },
      { q: 'What does "Omo, e choke!" mean in Lagos slang?', options: ['It is expensive', 'It is amazing', 'I am tired', 'It is crowded'], ans: 1, fact: '"E choke" was popularized by Davido and means something is absolutely amazing.' },
      { q: 'What is "Okrika" in Lagos markets?', options: ['Stolen goods', 'Second-hand clothes', 'Fake designer bags', 'Cheap local fabric'], ans: 1, fact: '"Bend-down-select" Okrika clothes arrive in bales from Europe.' },
      { q: 'The Lisabi Festival celebrates which historical event?', options: ['Founding of Lagos', 'Egba liberation from Oyo', 'Fall of Benin Empire', 'Battle of Abeokuta'], ans: 1, fact: 'Lisabi Agbongbo Akala led the Egba revolt against Oyo around 1775.' },
      { q: 'Which slang means "it is finished" in Lagos pidgin?', options: ['"E don be"', '"Ko si"', '"Sharp-sharp"', '"Agbero"'], ans: 0, fact: '"E don be" is the universal Lagos phrase for something completely finished or sold out.' },
      { q: 'What Yoruba word became universal Lagos friend slang?', options: ['Aburo', 'Omo', 'Olorun', 'Baba'], ans: 1, fact: '"Omo" (meaning child) became a universal term of address across ethnic groups in Lagos.' },
      { q: 'Which beach is only accessible by boat in Lagos?', options: ['Elegushi Beach', 'Tarkwa Bay', 'Lekki Beach', 'Oniru Beach'], ans: 1, fact: 'Tarkwa Bay is a sheltered beach near the harbour with no road access — boats only.' },
    ]
  }
}
const PACK_LIST = Object.values(PACKS)

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ── Reward collect button ─────────────────────────────────────────────────
function CollectButton({ points, stars, onCollect, collected }) {
  return (
    <button
      className={`collect-btn ${collected ? 'collected' : ''}`}
      onClick={!collected ? onCollect : undefined}
      disabled={collected}
    >
      {collected ? (
        <span className="collect-btn-done">✓ Collected!</span>
      ) : (
        <>
          <span className="collect-btn-stars">{'⭐'.repeat(stars)}</span>
          <span className="collect-btn-text">Tap to collect +{points} XP</span>
        </>
      )}
    </button>
  )
}

// ── COMPONENT ─────────────────────────────────────────────────────────────
export default function TriviaGame() {
  const navigate = useNavigate()
  const { popXP, celebrateCorrect, celebrateWrong, openChest, showStarBurst, rewardProps } = useRewardSystem()

  const [selectedPack, setSelectedPack] = useState(null)
  const [started, setStarted] = useState(false)
  const [questions, setQuestions] = useState([])
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [timer, setTimer] = useState(15)
  const [phase, setPhase] = useState('playing')
  const [selectedOpt, setSelectedOpt] = useState(null)
  const [pendingXP, setPendingXP] = useState(0)
  const [pendingStars, setPendingStars] = useState(1)
  const [xpCollected, setXpCollected] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showQuitModal, setShowQuitModal] = useState(false)
  const [pendingNav, setPendingNav] = useState(null)
  const answerBtnRefs = useRef([])
  const intervalRef = useRef(null)

  function startGame() {
    const pool = selectedPack === 'all'
      ? shuffle([...PACK_LIST.flatMap(p => p.questions)]).slice(0, 10)
      : shuffle([...(PACKS[selectedPack]?.questions || [])]).slice(0, 10)
    setQuestions(pool)
    setIdx(0); setScore(0); setStreak(0); setPhase('playing')
    setStarted(true)
  }

  function handleTimeUp() {
    playWrong(); vibrate([30, 50, 30])
    celebrateWrong()
    setStreak(0)
    setPendingXP(0); setPendingStars(0); setXpCollected(true)
    setPhase('feedback')
  }

  // Ref to keep handleTimeUp current for the timer interval
  const handleTimeUpRef = useRef(handleTimeUp)
  useEffect(() => { handleTimeUpRef.current = handleTimeUp })

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!started || phase !== 'playing') { clearInterval(intervalRef.current); return }
    setTimer(15)
    intervalRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) { clearInterval(intervalRef.current); handleTimeUpRef.current(); return 0 }
        if (t <= 5) playTick()
        return t - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [idx, phase, started])
  /* eslint-enable react-hooks/set-state-in-effect */

  const q = questions[idx]

  function handleAnswer(optIdx) {
    if (phase !== 'playing') return
    setSelectedOpt(optIdx)
    clearInterval(intervalRef.current)
    const correct = optIdx === q.ans
    if (correct) {
      const pts = Math.max(10, 10 * timer)
      const newStreak = streak + 1
      const stars = newStreak >= 3 ? 3 : newStreak >= 2 ? 2 : 1
      playCorrect(); vibrate([50])
      setScore(s => s + pts)
      setStreak(newStreak)
      setPendingXP(pts)
      setPendingStars(stars)
      setXpCollected(false)
      celebrateCorrect(newStreak)
      if (newStreak > 0 && newStreak % 5 === 0) {
        setTimeout(() => openChest(newStreak * 10), 400)
      } else {
        showStarBurst(stars)
      }
    } else {
      playWrong(); vibrate([30, 50, 30])
      celebrateWrong()
      setStreak(0)
      setPendingXP(0); setPendingStars(0); setXpCollected(true)
    }
    setPhase('feedback')
  }

  function collectXP() {
    if (xpCollected || pendingXP === 0) return
    const btn = answerBtnRefs.current[selectedOpt]
    popXP(pendingXP, btn)
    addXP('GAME_CORRECT', pendingXP / 10)
    setXpCollected(true)
  }

  function next() {
    if (!xpCollected && pendingXP > 0) { collectXP(); return }
    if (idx + 1 >= questions.length) {
      const total = score
      addXP('GAME_WIN', total > 800 ? 200 : total > 400 ? 100 : 50)
      setPhase('done')
      autoSubmitScore({ gameType: 'trivia', score: total, maxScore: questions.length * 150, questionCount: questions.length })
    } else {
      setIdx(prev => prev + 1)
      setSelectedOpt(null)
      setPendingXP(0)
      setXpCollected(false)
      setPhase('playing')
    }
  }

  function handleQuit(dest) {
    setPendingNav(dest)
    if (phase !== 'done') setShowQuitModal(true)
    else navigate(dest)
  }

  // PACK SELECTOR
  if (!started) {
    return (
      <div className="game-lobby">
        <button className="gh-back" onClick={() => navigate('/play')}>← Back</button>
        <h2 className="lobby-title">🧠 Trivia Challenge</h2>
        <p className="lobby-sub">Choose a category to test your knowledge</p>
        <div className="lobby-packs">
          <button className={`lobby-pack-card ${selectedPack === 'all' ? 'active' : ''}`}
            style={{ '--pack-color': '#8b5cf6' }} onClick={() => setSelectedPack('all')}>
            <span className="lpc-icon">🎯</span>
            <span className="lpc-label">All Categories</span>
            <span className="lpc-desc">Mix of all packs — 10 random questions</span>
            <span className="lpc-count">{PACK_LIST.reduce((s, p) => s + p.questions.length, 0)} total questions</span>
          </button>
          {PACK_LIST.map(pack => (
            <button key={pack.id} className={`lobby-pack-card ${selectedPack === pack.id ? 'active' : ''}`}
              style={{ '--pack-color': pack.color }} onClick={() => setSelectedPack(pack.id)}>
              <span className="lpc-icon">{pack.label.split(' ')[0]}</span>
              <span className="lpc-label">{pack.label.split(' ').slice(1).join(' ')}</span>
              <span className="lpc-desc">{pack.desc}</span>
              <span className="lpc-count">{pack.questions.length} questions</span>
            </button>
          ))}
        </div>
        <button className="lobby-start-btn" disabled={!selectedPack} onClick={startGame}
          style={{ background: selectedPack ? (PACKS[selectedPack]?.color || '#8b5cf6') : undefined }}>
          Start Trivia →
        </button>
      </div>
    )
  }

  if (questions.length === 0) return null

  return (
    <section className="game-screen trivia-game">
      <RewardsOverlay {...rewardProps} />
      {showQuitModal && (
        <div className="quit-overlay" onClick={() => setShowQuitModal(false)}>
          <div className="quit-modal" onClick={e => e.stopPropagation()}>
            <h3>Quit Game?</h3>
            <p>Your progress will be lost.</p>
            <div className="quit-actions">
              <button className="btn btn-primary" onClick={() => setShowQuitModal(false)}>Keep Playing</button>
              <button className="btn btn-outline quit-confirm" onClick={() => navigate(pendingNav || '/')}>Quit</button>
            </div>
          </div>
        </div>
      )}
      <div className={`legend-sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="legend-section sidebar-nav">
          <button className="sidebar-nav-btn" onClick={() => handleQuit('/')}>Home</button>
          <button className="sidebar-nav-btn" onClick={() => { setStarted(false); setSelectedPack(null) }}>Change Pack</button>
          <button className="sidebar-nav-btn" onClick={startGame}>Restart</button>
          <button className="sidebar-nav-btn sidebar-quit" onClick={() => handleQuit('/')}>Quit</button>
        </div>
      </div>
      <button className={`legend-toggle ${menuOpen ? 'shifted' : ''}`} onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? '◀' : '☰'}
      </button>

      {/* HUD */}
      <div className="game-hud" style={{ borderImage: 'none', borderColor: 'var(--border)' }}>
        <div className="hud-left">
          <span className="hud-counter">🧠 {idx + 1}/{questions.length}</span>
        </div>
        <div className="hud-center">
          <div className="hud-progress">
            <div className="hud-progress-fill" style={{ width: `${((idx + (phase === 'feedback' ? 1 : 0)) / questions.length) * 100}%` }} />
          </div>
        </div>
        <div className="hud-right">
          {streak >= 2 && <span className="hud-streak">🔥{streak}</span>}
          <span className="hud-score">{score}</span>
        </div>
      </div>

      {/* BODY */}
      <div className="trivia-body">
        {phase === 'done' ? (
          <>
          <div className="game-end-card">
            <div className="game-end-trophy">{score > 800 ? '🏆' : score > 400 ? '🥈' : '🎖️'}</div>
            <h2>Quiz Complete!</h2>
            <div className="game-end-score">{score}</div>
            <p className="game-end-label">out of {questions.length * 150} pts  •  {questions.length}Q answered</p>
            <div className="game-end-stars">
              {score > 900 ? '⭐⭐⭐' : score > 500 ? '⭐⭐' : '⭐'}
            </div>
            <div className="game-end-actions">
              <button className="btn btn-primary" onClick={startGame}>Play Again</button>
              <button className="btn btn-outline" onClick={() => navigate('/play')}>Hub</button>
            </div>
          </div>
          <PostGameLoop gameType="trivia" onPlayAgain={startGame} />
          </>
        ) : (
          <>
            <div className="trivia-timer-bar">
              <div className="trivia-timer-fill" style={{
                width: `${(timer / 15) * 100}%`,
                background: timer <= 5 ? '#ef4444' : '#0ea5e9'
              }} />
            </div>

            <div className={`trivia-q-card ${phase === 'feedback' ? 'answered' : ''}`}>
              <div className="trivia-q-num">Question {idx + 1}</div>
              <h2>{q.q}</h2>
            </div>

            <div className="trivia-options">
              {q.options.map((opt, i) => {
                let statusClass = ''
                if (phase === 'feedback') {
                  if (i === q.ans) statusClass = 'correct'
                  else if (i === selectedOpt) statusClass = 'wrong'
                  else statusClass = 'dimmed'
                }
                return (
                  <button key={i} ref={el => answerBtnRefs.current[i] = el}
                    className={`trivia-opt ${statusClass}`}
                    onClick={() => handleAnswer(i)}
                    disabled={phase !== 'playing'}>
                    <span className="trivia-opt-letter">{String.fromCharCode(65 + i)}</span>
                    <span className="trivia-opt-text">{opt}</span>
                    {statusClass === 'correct' && <CheckmarkCircleRegular className="trivia-icon-res" />}
                    {statusClass === 'wrong' && <DismissCircleRegular className="trivia-icon-res" />}
                  </button>
                )
              })}
            </div>

            {phase === 'feedback' && (
              <div className="trivia-feedback-bar">
                {selectedOpt === q.ans && !xpCollected && pendingXP > 0 ? (
                  <CollectButton
                    points={pendingXP}
                    stars={pendingStars}
                    onCollect={collectXP}
                    collected={xpCollected}
                  />
                ) : (
                  <p className="trivia-fact">💡 {q.fact}</p>
                )}
                <button className="btn btn-primary trivia-next-btn" onClick={next}
                  disabled={!xpCollected && pendingXP > 0}>
                  {!xpCollected && pendingXP > 0 ? '👆 Collect first!' : idx + 1 >= questions.length ? 'Finish Quiz ✓' : 'Next Question →'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
