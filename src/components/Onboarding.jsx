import { useState } from 'react'

const STEPS = [
  { emoji: '📖', title: 'Read the Question', desc: 'Each question asks you to locate a real place in Lagos on the map.' },
  { emoji: '👆', title: 'Tap the Map', desc: 'Drop your pin where you think the location is. The closer you get, the more points!' },
  { emoji: '🏆', title: 'Score & Learn', desc: 'See how close you were, learn fun facts, and aim for the gold!' },
]

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0)

  function next() {
    if (step + 1 >= STEPS.length) {
      localStorage.setItem('geoquiz_onboarded', '1')
      onComplete()
    } else {
      setStep(step + 1)
    }
  }

  const s = STEPS[step]

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal">
        <div className="onboarding-step-dots">
          {STEPS.map((_, i) => (
            <span key={i} className={`onboarding-dot ${i === step ? 'active' : ''}`} />
          ))}
        </div>
        <div className="onboarding-emoji">{s.emoji}</div>
        <h3 className="onboarding-title">{s.title}</h3>
        <p className="onboarding-desc">{s.desc}</p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1rem' }}>
          <button className="btn btn-primary" onClick={next}>
            {step + 1 >= STEPS.length ? 'Let\'s Go! 🚀' : 'Next →'}
          </button>
          <button className="btn btn-outline" onClick={() => { localStorage.setItem('geoquiz_onboarded', '1'); onComplete() }} style={{ fontSize: '0.8rem' }}>
            Skip
          </button>
        </div>
      </div>
    </div>
  )
}
