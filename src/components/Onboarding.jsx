import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const AVATARS = ['🦅','🐆','🦎','🐘','🦜','🐢','🌴','🥁','🎭','🔥','⚡','🌊']
const SUGGESTIONS = ['NaijaExplorer','LagosStar','MapKing','GeoNinja','QuizWhiz','PinMaster']

export default function Onboarding({ onComplete }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState(null)
  const [closing, setClosing] = useState(false)

  function finish() {
    const finalName = name.trim() || SUGGESTIONS[Math.floor(Math.random() * SUGGESTIONS.length)]
    const finalAvatar = avatar || '🦅'
    localStorage.setItem('geoquiz_player', finalName)
    localStorage.setItem('geoquiz_avatar', finalAvatar)
    localStorage.setItem('geoquiz_onboarded', '1')
    setClosing(true)
    setTimeout(() => {
      onComplete()
      navigate('/play')
    }, 280)
  }

  return (
    <div className={`ob-overlay${closing ? ' ob-out' : ''}`}>
      <div className={`ob-card${closing ? ' ob-card-out' : ''}`}>

        {step === 0 && (
          <div className="ob-step">
            <div className="ob-hero-icon">🌍</div>
            <h2>Welcome to Wanda</h2>
            <p className="ob-desc">
              Discover attractions, find the best restaurants, grab event tickets,
              play games, and experience Nigeria like never before.
            </p>
            <button className="ob-cta" onClick={() => setStep(1)}>Let's go →</button>
          </div>
        )}

        {step === 1 && (
          <div className="ob-step">
            <div className="ob-hero-icon">✏️</div>
            <h2>What should we call you?</h2>
            <input
              className="ob-name-input"
              type="text"
              placeholder="Your display name"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={20}
              autoFocus
              onKeyDown={e => { if (e.key === 'Enter' && name.trim()) setStep(2) }}
            />
            <div className="ob-chips">
              {SUGGESTIONS.slice(0, 3).map(n => (
                <button key={n} className="ob-chip" onClick={() => { setName(n); setStep(2) }}>{n}</button>
              ))}
            </div>
            <button className="ob-cta" disabled={!name.trim()} onClick={() => setStep(2)}>
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="ob-step">
            <div className="ob-hero-icon">{avatar || '🎭'}</div>
            <h2>Pick your avatar</h2>
            <div className="ob-avatar-grid">
              {AVATARS.map(a => (
                <button
                  key={a}
                  className={`ob-av${avatar === a ? ' picked' : ''}`}
                  onClick={() => setAvatar(a)}
                >{a}</button>
              ))}
            </div>
            <button className="ob-cta" disabled={!avatar} onClick={finish}>
              Start playing
            </button>
          </div>
        )}

        <div className="ob-progress">
          {[0,1,2].map(i => (
            <span key={i} className={`ob-pip${step === i ? ' now' : step > i ? ' past' : ''}`} />
          ))}
        </div>
      </div>
    </div>
  )
}
