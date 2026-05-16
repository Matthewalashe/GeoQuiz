// Wanda Audio Engine — Web Audio API (Duolingo-inspired, no external files)
const AudioCtx = window.AudioContext || window.webkitAudioContext
let ctx = null

function getCtx() {
  if (!ctx) ctx = new AudioCtx()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

// Settings
export function isSoundEnabled() {
  return localStorage.getItem('wanda_sound') !== 'off'
}
export function isVibrationEnabled() {
  return localStorage.getItem('wanda_vibration') !== 'off'
}
export function toggleSound() {
  const on = isSoundEnabled()
  localStorage.setItem('wanda_sound', on ? 'off' : 'on')
  return !on
}
export function toggleVibration() {
  const on = isVibrationEnabled()
  localStorage.setItem('wanda_vibration', on ? 'off' : 'on')
  return !on
}

function playTone(freq, duration, type = 'sine', vol = 0.3) {
  if (!isSoundEnabled()) return
  try {
    const c = getCtx()
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = type
    osc.frequency.value = freq
    gain.gain.setValueAtTime(vol, c.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration)
    osc.connect(gain)
    gain.connect(c.destination)
    osc.start(c.currentTime)
    osc.stop(c.currentTime + duration)
  } catch { /* silent fail on browsers that block audio */ }
}

function playChord(freqs, duration, type = 'sine', vol = 0.15) {
  freqs.forEach(f => playTone(f, duration, type, vol))
}

// ── Game Sounds ──

// Correct answer — cheerful ascending chime (Duolingo "ding!")
export function playCorrect() {
  playTone(880, 0.08, 'sine', 0.2)
  setTimeout(() => playTone(1109, 0.08, 'sine', 0.22), 70)
  setTimeout(() => playTone(1319, 0.18, 'sine', 0.25), 140)
}

// Wrong answer — gentle descending tone (not harsh)
export function playWrong() {
  playTone(440, 0.12, 'triangle', 0.15)
  setTimeout(() => playTone(349, 0.2, 'triangle', 0.12), 100)
}

// Pin drop — satisfying click-pop
export function playPinDrop() {
  playTone(1400, 0.03, 'sine', 0.18)
  setTimeout(() => playTone(900, 0.06, 'sine', 0.14), 30)
}

// Timer tick — last 5 seconds
export function playTick() {
  playTone(1000, 0.03, 'sine', 0.08)
}

// Timer expired — urgent double-beep
export function playTimeUp() {
  playTone(523, 0.08, 'square', 0.15)
  setTimeout(() => playTone(523, 0.08, 'square', 0.15), 120)
  setTimeout(() => playTone(392, 0.25, 'square', 0.12), 240)
}

// Streak fire (3+) — exciting rising arpeggio
export function playStreak() {
  playTone(659, 0.06, 'sine', 0.18)
  setTimeout(() => playTone(784, 0.06, 'sine', 0.18), 50)
  setTimeout(() => playTone(988, 0.06, 'sine', 0.2), 100)
  setTimeout(() => playTone(1319, 0.12, 'sine', 0.25), 150)
}

// Perfect score fanfare — triumphant celebration
export function playPerfect() {
  const notes = [523, 659, 784, 1047, 784, 1047, 1319]
  notes.forEach((n, i) => setTimeout(() => playTone(n, 0.15, 'sine', 0.22), i * 90))
  setTimeout(() => playChord([1047, 1319, 1568], 0.4, 'sine', 0.12), notes.length * 90)
}

// ── UI Sounds ──

// Button tap — subtle click
export function playButtonTap() {
  playTone(800, 0.02, 'sine', 0.08)
}

// Navigation — soft whoosh-like sweep
export function playNavigate() {
  playTone(400, 0.06, 'sine', 0.06)
  setTimeout(() => playTone(600, 0.06, 'sine', 0.08), 40)
}

// XP gain — coin bling
export function playXPGain() {
  playTone(1200, 0.06, 'sine', 0.15)
  setTimeout(() => playTone(1600, 0.06, 'sine', 0.18), 60)
  setTimeout(() => playTone(2000, 0.1, 'sine', 0.12), 120)
}

// Level up — big triumphant fanfare
export function playLevelUp() {
  const fanfare = [
    [523, 0], [659, 100], [784, 200],
    [1047, 350], [1319, 500], [1568, 650],
  ]
  fanfare.forEach(([freq, delay]) =>
    setTimeout(() => playTone(freq, 0.2, 'sine', 0.2), delay)
  )
  setTimeout(() => playChord([1047, 1319, 1568], 0.6, 'sine', 0.15), 800)
}

// Combo breaker — dramatic fail
export function playComboBreaker() {
  playTone(440, 0.1, 'sawtooth', 0.1)
  setTimeout(() => playTone(330, 0.15, 'sawtooth', 0.08), 80)
  setTimeout(() => playTone(262, 0.25, 'sawtooth', 0.06), 160)
}

// Countdown 3-2-1 — dramatic beeps
export function playCountdown321() {
  playTone(600, 0.12, 'sine', 0.15)
  setTimeout(() => playTone(600, 0.12, 'sine', 0.15), 800)
  setTimeout(() => playTone(600, 0.12, 'sine', 0.15), 1600)
  setTimeout(() => playTone(900, 0.25, 'sine', 0.25), 2400) // GO!
}

// Step complete — for onboarding wizard
export function playStepComplete() {
  playTone(698, 0.06, 'sine', 0.15)
  setTimeout(() => playTone(880, 0.1, 'sine', 0.18), 60)
}

// Celebration — confetti moment
export function playCelebration() {
  const notes = [523, 659, 784, 1047, 1319, 1568, 1047, 1319, 1568, 2093]
  notes.forEach((n, i) => setTimeout(() => playTone(n, 0.1, 'sine', 0.15 + i * 0.01), i * 70))
}

// Reward claim — satisfying pop
export function playRewardClaim() {
  playTone(600, 0.04, 'sine', 0.15)
  setTimeout(() => playTone(900, 0.04, 'sine', 0.18), 40)
  setTimeout(() => playTone(1200, 0.08, 'sine', 0.22), 80)
  setTimeout(() => playTone(1800, 0.12, 'sine', 0.15), 130)
}

// ── Vibration ──

export function vibrate(pattern = [50]) {
  if (!isVibrationEnabled()) return
  try { navigator.vibrate?.(pattern) } catch { /* not supported */ }
}

// Named vibration patterns
export function vibrateSuccess() { vibrate([40]) }
export function vibrateError() { vibrate([30, 40, 30]) }
export function vibrateLevelUp() { vibrate([50, 30, 50, 30, 100]) }
export function vibrateStreak() { vibrate([20, 20, 20, 20, 60]) }
export function vibrateTap() { vibrate([10]) }
