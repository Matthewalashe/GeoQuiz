import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { playStepComplete, playCelebration, playButtonTap, vibrateTap, vibrateSuccess } from '../engine/audio.js'
import { updateProfile } from '../lib/supabase.js'
import {
  PersonRegular, HeartRegular,
  CheckmarkCircleRegular, ArrowRightRegular, ArrowLeftRegular,
  MapRegular, GamesRegular, GiftRegular, CompassNorthwestRegular,
  FlashRegular,
} from '@fluentui/react-icons'

const INTERESTS = [
  { id: 'explore', label: 'Explore Lagos', icon: <CompassNorthwestRegular />, color: '#00c853' },
  { id: 'play', label: 'Play Games', icon: <GamesRegular />, color: '#8b5cf6' },
  { id: 'discover', label: 'Discover Places', icon: <MapRegular />, color: '#0ea5e9' },
  { id: 'deals', label: 'Find Deals', icon: <GiftRegular />, color: '#f59e0b' },
]

export default function SignUpOnboarding({ username: initialUsername, session, onComplete }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [username, setUsername] = useState(initialUsername || '')
  const [interests, setInterests] = useState([])
  const [animating, setAnimating] = useState(false)

  // No avatar step — users upload profile photos instead
  const STEPS = [
    { title: 'Welcome to Wanda', subtitle: 'Your guide to experiencing Nigeria', icon: <FlashRegular /> },
    { title: 'Your Explorer Name', subtitle: 'What should we call you?', icon: <PersonRegular /> },
    { title: 'What excites you?', subtitle: 'Pick your interests — we\'ll personalize your feed', icon: <HeartRegular /> },
    { title: 'You\'re All Set!', subtitle: 'Let the adventure begin', icon: <CheckmarkCircleRegular /> },
  ]

  function goNext() {
    if (animating) return
    if (step === 1 && username.trim().length < 2) return
    setAnimating(true)
    playStepComplete()
    vibrateTap()
    setTimeout(() => {
      setStep(s => Math.min(s + 1, STEPS.length - 1))
      setAnimating(false)
      if (step === STEPS.length - 2) {
        playCelebration()
        vibrateSuccess()
      }
    }, 300)
  }

  function goBack() {
    if (animating || step === 0) return
    setAnimating(true)
    setTimeout(() => {
      setStep(s => s - 1)
      setAnimating(false)
    }, 200)
  }

  async function finish() {
    playButtonTap()
    localStorage.setItem('geoquiz_player', username.trim())
    localStorage.setItem('wanda_interests', JSON.stringify(interests))
    localStorage.setItem('wanda_onboarded', '1')
    // Sync username to Supabase profiles table (no avatar — user uploads profile photo separately)
    if (session?.user?.id) {
      try {
        await updateProfile(session.user.id, {
          username: username.trim(),
        })
      } catch (e) {
        console.warn('Could not sync onboarding profile:', e.message)
      }
    }
    if (onComplete) onComplete({ username: username.trim(), interests })
    else navigate('/dashboard')
  }

  function toggleInterest(id) {
    playButtonTap()
    vibrateTap()
    setInterests(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  return (
    <div className="onboard-overlay">
      <div className="onboard-card glass glass-glow">
        {/* Progress dots */}
        <div className="onboard-progress">
          {STEPS.map((_, i) => (
            <div key={i} className={`onboard-dot ${i === step ? 'active' : i < step ? 'done' : ''}`} />
          ))}
        </div>

        {/* Step content */}
        <div className={`onboard-body ${animating ? 'onboard-slide-out' : 'onboard-slide-in'}`}>
          <div className="onboard-step-icon">{STEPS[step].icon}</div>
          <h2 className="onboard-title">{STEPS[step].title}</h2>
          <p className="onboard-subtitle">{STEPS[step].subtitle}</p>

          {/* Step 0: Welcome */}
          {step === 0 && (
            <div className="onboard-welcome">
              <img src="/wanda-logo.png" alt="Wanda" className="onboard-logo" />
              <div className="onboard-features">
                <div className="onboard-feature"><MapRegular /> Explore 50+ real locations</div>
                <div className="onboard-feature"><GamesRegular /> 8 unique game modes</div>
                <div className="onboard-feature"><GiftRegular /> Earn coins & unlock rewards</div>
              </div>
            </div>
          )}

          {/* Step 1: Username */}
          {step === 1 && (
            <div className="onboard-username">
              <input
                type="text"
                className="onboard-name-input"
                placeholder="e.g. LagosMaster"
                value={username}
                onChange={e => setUsername(e.target.value)}
                maxLength={20}
                autoFocus
              />
              <span className="onboard-name-hint">{username.trim().length < 2 ? 'At least 2 characters' : '✓ Looks good!'}</span>
              <p className="onboard-photo-hint">You can add a profile photo later in your profile settings.</p>
            </div>
          )}

          {/* Step 2: Interests */}
          {step === 2 && (
            <div className="onboard-interests">
              {INTERESTS.map(int => (
                <button
                  key={int.id}
                  className={`onboard-interest-btn ${interests.includes(int.id) ? 'selected' : ''}`}
                  onClick={() => toggleInterest(int.id)}
                  style={{ '--accent': int.color }}
                >
                  <span className="onboard-int-icon">{int.icon}</span>
                  <span>{int.label}</span>
                  {interests.includes(int.id) && <CheckmarkCircleRegular className="onboard-int-check" />}
                </button>
              ))}
            </div>
          )}

          {/* Step 3: Ready */}
          {step === 3 && (
            <div className="onboard-ready">
              <div className="onboard-ready-avatar">🎉</div>
              <div className="onboard-ready-name">{username || 'Explorer'}</div>
              <div className="onboard-ready-msg">Welcome aboard, {username || 'Explorer'}!</div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="onboard-nav">
          {step > 0 && step < STEPS.length - 1 && (
            <button className="onboard-btn onboard-btn-back" onClick={goBack}>
              <ArrowLeftRegular /> Back
            </button>
          )}
          {step === 0 && (
            <button className="onboard-btn onboard-btn-skip" onClick={() => { localStorage.setItem('wanda_onboarded', '1'); if (onComplete) onComplete({}); else navigate('/') }}>
              Skip
            </button>
          )}
          <div style={{ flex: 1 }} />
          {step < STEPS.length - 1 ? (
            <button
              className="onboard-btn onboard-btn-next"
              onClick={goNext}
              disabled={step === 1 && username.trim().length < 2}
            >
              {step === 0 ? "Let's Go" : 'Continue'} <ArrowRightRegular />
            </button>
          ) : (
            <button className="onboard-btn onboard-btn-finish" onClick={finish}>
              Start Exploring <FlashRegular />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
