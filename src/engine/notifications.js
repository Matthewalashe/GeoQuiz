// ============================================
// Push Notifications Engine (Milestone 2.5)
// PWA local scheduled notifications
// ============================================

const NOTIF_KEY = 'geoquiz_notifs'

// Notification templates
const NOTIFICATIONS = {
  STREAK_DANGER: {
    title: '🔥 Your streak is in danger!',
    body: 'Play a quick game to keep your streak alive. Don\'t lose your progress!',
    tag: 'streak-danger',
    icon: '/icon-192.png',
  },
  DAILY_CHALLENGE: {
    title: '🏆 Daily Challenge is ready!',
    body: 'A new set of questions awaits. Can you beat yesterday\'s score?',
    tag: 'daily-challenge',
    icon: '/icon-192.png',
  },
  LEAGUE_NUDGE: {
    title: '📈 You\'re close to promotion!',
    body: 'Just a few more games and you\'ll move up a league tier!',
    tag: 'league-nudge',
    icon: '/icon-192.png',
  },
  REWARD_WAITING: {
    title: '🎁 Daily reward waiting!',
    body: 'Your daily reward is ready to claim. Don\'t miss out on free XP!',
    tag: 'reward-waiting',
    icon: '/icon-192.png',
  },
  COMEBACK: {
    title: '🌍 Lagos misses you!',
    body: 'It\'s been a while since your last game. Come explore something new!',
    tag: 'comeback',
    icon: '/icon-192.png',
  },
}

// Check if notifications are supported & permitted
export function isNotifSupported() {
  return 'Notification' in window && 'serviceWorker' in navigator
}

export function getNotifPermission() {
  if (!isNotifSupported()) return 'denied'
  return Notification.permission
}

// Request permission
export async function requestNotifPermission() {
  if (!isNotifSupported()) return 'denied'
  const result = await Notification.requestPermission()
  saveNotifPrefs({ enabled: result === 'granted' })
  return result
}

// Get/save user notification preferences
export function getNotifPrefs() {
  const raw = localStorage.getItem(NOTIF_KEY)
  if (!raw) return { enabled: false, streakReminder: true, dailyChallenge: true, rewards: true, league: true }
  try { return JSON.parse(raw) }
  catch { return { enabled: false, streakReminder: true, dailyChallenge: true, rewards: true, league: true } }
}

export function saveNotifPrefs(prefs) {
  const current = getNotifPrefs()
  localStorage.setItem(NOTIF_KEY, JSON.stringify({ ...current, ...prefs }))
}

// Show a local notification (via SW or fallback)
export async function showNotification(type) {
  const prefs = getNotifPrefs()
  if (!prefs.enabled) return false

  const notif = NOTIFICATIONS[type]
  if (!notif) return false

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready
      await reg.showNotification(notif.title, {
        body: notif.body,
        icon: notif.icon,
        tag: notif.tag,
        badge: '/icon-192.png',
        vibrate: [100, 50, 100],
        data: { url: '/', type },
        requireInteraction: false,
      })
      return true
    } else {
      // Fallback to Notification API
      new Notification(notif.title, { body: notif.body, icon: notif.icon, tag: notif.tag })
      return true
    }
  } catch (e) {
    console.warn('Notification failed:', e)
    return false
  }
}

// Schedule reminder checks (call on app load)
export function scheduleNotifChecks() {
  const prefs = getNotifPrefs()
  if (!prefs.enabled) return

  // Check every 4 hours for conditions
  const CHECK_INTERVAL = 4 * 60 * 60 * 1000

  // Clear any existing
  if (window._geoquizNotifTimer) clearInterval(window._geoquizNotifTimer)

  window._geoquizNotifTimer = setInterval(() => {
    checkAndNotify()
  }, CHECK_INTERVAL)

  // Also check once after 30 seconds
  setTimeout(checkAndNotify, 30000)
}

async function checkAndNotify() {
  const prefs = getNotifPrefs()
  if (!prefs.enabled) return

  const xpRaw = localStorage.getItem('geoquiz_xp')
  if (!xpRaw) return

  try {
    const xp = JSON.parse(xpRaw)
    const today = new Date().toISOString().split('T')[0]
    const hour = new Date().getHours()

    // Streak danger: evening (18-21), last login was yesterday
    if (prefs.streakReminder && hour >= 18 && hour <= 21) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
      if (xp.lastLoginDate === yesterday && xp.streakDays > 1) {
        showNotification('STREAK_DANGER')
        return // Only one notif per check
      }
    }

    // Daily challenge: morning (8-10)
    if (prefs.dailyChallenge && hour >= 8 && hour <= 10) {
      if (xp.lastLoginDate !== today) {
        showNotification('DAILY_CHALLENGE')
        return
      }
    }

    // Reward waiting: afternoon (13-15)
    if (prefs.rewards && hour >= 13 && hour <= 15) {
      const rewards = localStorage.getItem('geoquiz_rewards')
      if (rewards) {
        const r = JSON.parse(rewards)
        if (r.lastClaimDate !== today) {
          showNotification('REWARD_WAITING')
          return
        }
      }
    }

    // Comeback: if not played in 3+ days
    if (xp.lastLoginDate) {
      const lastDate = new Date(xp.lastLoginDate)
      const daysSince = Math.floor((Date.now() - lastDate.getTime()) / 86400000)
      if (daysSince >= 3) {
        showNotification('COMEBACK')
      }
    }
  } catch (e) {
    console.warn('Notif check error:', e)
  }
}
