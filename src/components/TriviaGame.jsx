import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckmarkCircleRegular, DismissCircleRegular } from '@fluentui/react-icons'
import { playCorrect, playWrong, playTick, vibrate } from '../engine/audio.js'
import { addXP } from '../engine/xp.js'

const TRIVIA_QUESTIONS = [
  { q: 'Which is the longest bridge in Lagos?', options: ['Third Mainland Bridge', 'Carter Bridge', 'Eko Bridge', 'Lekki-Ikoyi Link Bridge'], ans: 0 },
  { q: 'What year was Lagos state created?', options: ['1960', '1967', '1976', '1991'], ans: 1 },
  { q: 'What is the popular yellow commercial bus in Lagos called?', options: ['Keke', 'Okada', 'Danfo', 'Molue'], ans: 2 },
  { q: 'Which of these is NOT a Local Government Area in Lagos?', options: ['Ikeja', 'Surulere', 'Ogbomoso', 'Epe'], ans: 2 },
  { q: 'What is the famous art market in Lagos called?', options: ['Balogun Market', 'Lekki Arts & Crafts Market', 'Tejuosho Market', 'Computer Village'], ans: 1 },
  { q: 'Which popular dish is a staple street food in Lagos?', options: ['Ewa Agoyin', 'Amala and Ewedu', 'Suya', 'All of the above'], ans: 3 },
  { q: 'Who is the "Eyo" masquerade traditionally associated with?', options: ['The King (Oba) of Lagos', 'Market Women', 'Fishermen', 'Warriors'], ans: 0 },
  { q: 'Which Lagos beach is known for its horseback rides and vibrant nightlife?', options: ['Tarkwa Bay', 'Elegushi Beach', 'Landmark Beach', 'Oniru Beach'], ans: 1 },
  { q: 'What is the name of the central business district in Lagos Island?', options: ['Marina', 'Broad Street', 'Both Marina and Broad Street', 'Obalende'], ans: 2 },
  { q: 'Which of these bridges connects Lagos Mainland to Lagos Island?', options: ['Third Mainland Bridge', 'Carter Bridge', 'Eko Bridge', 'All of the above'], ans: 3 },
]

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function TriviaGame() {
  const navigate = useNavigate()
  const [questions, setQuestions] = useState([])
  const [idx, setIdx] = useState(0)
  const [score, setScore] = useState(0)
  const [timer, setTimer] = useState(15)
  const [phase, setPhase] = useState('playing') // playing | feedback | done
  const [selectedOpt, setSelectedOpt] = useState(null)
  
  const [menuOpen, setMenuOpen] = useState(false)
  const [showQuitModal, setShowQuitModal] = useState(false)
  const [pendingNav, setPendingNav] = useState(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    setQuestions(shuffle(TRIVIA_QUESTIONS))
  }, [])

  useEffect(() => {
    if (phase !== 'playing') {
      clearInterval(intervalRef.current)
      return
    }
    setTimer(15)
    intervalRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          clearInterval(intervalRef.current)
          handleTimeUp()
          return 0
        }
        if (t <= 5) playTick()
        return t - 1
      })
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [idx, phase])

  const q = questions[idx]

  function handleTimeUp() {
    playWrong()
    vibrate([30, 50, 30])
    setPhase('feedback')
  }

  function handleAnswer(optIdx) {
    if (phase !== 'playing') return
    setSelectedOpt(optIdx)
    clearInterval(intervalRef.current)

    if (optIdx === q.ans) {
      playCorrect()
      vibrate([50])
      setScore(s => s + 10 * timer) // More points for speed
    } else {
      playWrong()
      vibrate([30, 50, 30])
    }
    setPhase('feedback')
  }

  function next() {
    if (idx + 1 >= questions.length) {
      setPhase('done')
      addXP('GAME_WIN', score > 500 ? 150 : 50)
    } else {
      setIdx(prev => prev + 1)
      setSelectedOpt(null)
      setPhase('playing')
    }
  }

  function handleQuit(dest) {
    setPendingNav(dest)
    if (phase !== 'done') setShowQuitModal(true)
    else navigate(dest)
  }

  if (questions.length === 0) return null

  return (
    <section className="game-screen trivia-game">
      {/* Quit modal */}
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
          <span className="hud-counter">🧠 {idx + 1}/{questions.length}</span>
        </div>
        <div className="hud-right">
          <span className="hud-score">{score} pts</span>
        </div>
      </div>

      <div className="trivia-body" style={{ marginTop: '70px', padding: '1rem', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 90px)' }}>
        {phase === 'done' ? (
          <div className="cw-win" style={{ marginTop: 'auto', marginBottom: 'auto' }}>
            <CheckmarkCircleRegular fontSize={64} style={{ color: '#0ea5e9' }} />
            <h2>Quiz Complete!</h2>
            <p>Final Score: {score}</p>
            <button className="btn btn-primary" onClick={() => navigate('/play')}>Back to Hub</button>
          </div>
        ) : (
          <>
            <div className="trivia-timer-bar">
              <div className="trivia-timer-fill" style={{ 
                width: `${(timer / 15) * 100}%`,
                background: timer <= 5 ? '#ef4444' : '#0ea5e9'
              }} />
            </div>

            <div className="trivia-q-card">
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
                  <button 
                    key={i} 
                    className={`trivia-opt ${statusClass}`}
                    onClick={() => handleAnswer(i)}
                    disabled={phase !== 'playing'}
                  >
                    {opt}
                    {statusClass === 'correct' && <CheckmarkCircleRegular className="trivia-icon-res" />}
                    {statusClass === 'wrong' && <DismissCircleRegular className="trivia-icon-res" />}
                  </button>
                )
              })}
            </div>

            {phase === 'feedback' && (
              <button className="trivia-next-btn btn btn-primary" onClick={next}>
                {idx + 1 >= questions.length ? 'Finish' : 'Next Question'} →
              </button>
            )}
          </>
        )}
      </div>
    </section>
  )
}
