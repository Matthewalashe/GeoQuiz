// GeoQuiz Audio Engine — Web Audio API (no external files needed)
const AudioCtx = window.AudioContext || window.webkitAudioContext
let ctx = null

function getCtx() {
  if (!ctx) ctx = new AudioCtx()
  return ctx
}

function playTone(freq, duration, type = 'sine', vol = 0.3) {
  try {
    const c = getCtx()
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = type
    osc.frequency.value = freq
    gain.gain.value = vol
    gain.gain.exponentialRampToValueAtTime(0.01, c.currentTime + duration)
    osc.connect(gain)
    gain.connect(c.destination)
    osc.start(c.currentTime)
    osc.stop(c.currentTime + duration)
  } catch (e) { /* silent fail on browsers that block audio */ }
}

// Correct answer — cheerful ascending chime
export function playCorrect() {
  playTone(523, 0.12, 'sine', 0.25)    // C5
  setTimeout(() => playTone(659, 0.12, 'sine', 0.25), 80)   // E5
  setTimeout(() => playTone(784, 0.2, 'sine', 0.3), 160)    // G5
}

// Wrong answer — descending buzz
export function playWrong() {
  playTone(330, 0.15, 'square', 0.15)   // E4
  setTimeout(() => playTone(262, 0.25, 'square', 0.12), 120) // C4
}

// Pin drop — soft click
export function playPinDrop() {
  playTone(1200, 0.05, 'sine', 0.2)
  setTimeout(() => playTone(800, 0.08, 'sine', 0.15), 40)
}

// Timer tick — last 5 seconds
export function playTick() {
  playTone(1000, 0.04, 'sine', 0.1)
}

// Timer expired — alarm
export function playTimeUp() {
  playTone(440, 0.1, 'square', 0.2)
  setTimeout(() => playTone(440, 0.1, 'square', 0.2), 150)
  setTimeout(() => playTone(330, 0.3, 'square', 0.15), 300)
}

// Streak fire — exciting rising arpeggio
export function playStreak() {
  playTone(523, 0.08, 'sine', 0.2)
  setTimeout(() => playTone(659, 0.08, 'sine', 0.2), 60)
  setTimeout(() => playTone(784, 0.08, 'sine', 0.2), 120)
  setTimeout(() => playTone(1047, 0.15, 'sine', 0.3), 180)
}

// Perfect score fanfare
export function playPerfect() {
  const notes = [523, 659, 784, 1047, 784, 1047]
  notes.forEach((n, i) => setTimeout(() => playTone(n, 0.15, 'sine', 0.25), i * 100))
}

// Mobile haptic feedback
export function vibrate(pattern = [50]) {
  try { navigator.vibrate?.(pattern) } catch (e) { /* not supported */ }
}
