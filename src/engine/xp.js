// ============================================
// GeoQuiz XP + Leveling + Leagues + Rewards
// Phase 2, Milestones 2.1 / 2.2 / 2.3
// ============================================

const STORAGE_KEY = 'geoquiz_xp'
const LEAGUE_KEY = 'geoquiz_league'
const REWARDS_KEY = 'geoquiz_rewards'

// XP per level (500 XP each)
const XP_PER_LEVEL = 500
const MAX_LEVEL = 50

// Level titles
const LEVEL_TITLES = [
  { min: 0, title: 'Newcomer', emoji: '🌱' },
  { min: 5, title: 'Explorer', emoji: '🧭' },
  { min: 10, title: 'Navigator', emoji: '🗺️' },
  { min: 15, title: 'Pathfinder', emoji: '🥾' },
  { min: 20, title: 'Cartographer', emoji: '📐' },
  { min: 25, title: 'Master', emoji: '🎓' },
  { min: 30, title: 'GIS Expert', emoji: '🛰️' },
  { min: 35, title: 'Legend', emoji: '⭐' },
  { min: 40, title: 'Naija King', emoji: '👑' },
  { min: 45, title: 'Grandmaster', emoji: '🏆' },
]

// XP reward amounts
export const XP_REWARDS = {
  CORRECT_ANSWER: 10,
  PERFECT_PIN: 25,
  COMPLETE_GAME: 100,
  DAILY_LOGIN: 25,
  STREAK_DAY: 5,
  SHARE_RESULT: 20,
  DAILY_CHALLENGE: 50,
  BLITZ_COMPLETE: 75,
  FIRST_PERFECT_GAME: 500,
  POSTCARD_COMPLETE: 60,
  PUZZLE_COMPLETE: 80,
  WORD_COMPLETE: 70,
  CHECK_IN: 50,
}

// ═══ LEAGUE SYSTEM (Milestone 2.2) ═══
export const LEAGUE_TIERS = [
  { id: 'bronze',   name: 'Bronze',   emoji: '🥉', color: '#cd7f32', minXP: 0 },
  { id: 'silver',   name: 'Silver',   emoji: '🥈', color: '#c0c0c0', minXP: 500 },
  { id: 'gold',     name: 'Gold',     emoji: '🥇', color: '#ffd700', minXP: 2000 },
  { id: 'diamond',  name: 'Diamond',  emoji: '💎', color: '#00d4ff', minXP: 5000 },
  { id: 'champion', name: 'Champion', emoji: '🏆', color: '#ff6b35', minXP: 10000 },
]

// ═══ DAILY REWARD CALENDAR (Milestone 2.3) ═══
export const DAILY_REWARDS = [
  { day: 1, type: 'xp',     amount: 25,  label: '25 XP',           emoji: '⚡' },
  { day: 2, type: 'xp',     amount: 50,  label: '50 XP',           emoji: '⚡' },
  { day: 3, type: 'freeze', amount: 1,   label: 'Streak Freeze',   emoji: '🧊' },
  { day: 4, type: 'xp',     amount: 75,  label: '75 XP',           emoji: '⚡' },
  { day: 5, type: 'skin',   amount: 1,   label: 'Map Skin',        emoji: '🗺️' },
  { day: 6, type: 'xp',     amount: 100, label: '100 XP',          emoji: '⚡' },
  { day: 7, type: 'badge',  amount: 200, label: 'Badge + 200 XP',  emoji: '🏆' },
]

// ═══ XP DATA ═══
export function getXPData() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return defaultXPData()
  try { return { ...defaultXPData(), ...JSON.parse(raw) } }
  catch { return defaultXPData() }
}

function defaultXPData() {
  return {
    totalXP: 0,
    level: 1,
    streakDays: 0,
    lastLoginDate: null,
    streakFreezes: 0,
    lastStreakFreezeEarned: null,
    xpHistory: [],
    hasHadPerfectGame: false,
    weeklyXP: 0,
    weekStart: null,
    mapSkins: ['default'],
    activeSkin: 'default',
    badges: [],
  }
}

function saveXPData(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)) }

export function getLevel(totalXP) { return Math.min(Math.floor(totalXP / XP_PER_LEVEL) + 1, MAX_LEVEL) }
export function getLevelProgress(totalXP) { return (totalXP % XP_PER_LEVEL) / XP_PER_LEVEL }
export function getXPToNextLevel(totalXP) { return XP_PER_LEVEL - (totalXP % XP_PER_LEVEL) }

export function getLevelTitle(level) {
  let title = LEVEL_TITLES[0]
  for (const t of LEVEL_TITLES) { if (level >= t.min) title = t }
  return title
}

// ═══ ADD XP ═══
export function addXP(type, multiplier = 1) {
  const data = getXPData()
  const base = XP_REWARDS[type] || 0
  const amount = Math.round(base * multiplier)
  if (amount <= 0) return { ...data, leveledUp: false, xpAdded: 0 }

  const oldLevel = getLevel(data.totalXP)
  data.totalXP += amount
  data.weeklyXP = (data.weeklyXP || 0) + amount
  const newLevel = getLevel(data.totalXP)
  data.level = newLevel

  data.xpHistory.push({ type, amount, date: new Date().toISOString() })
  if (data.xpHistory.length > 20) data.xpHistory = data.xpHistory.slice(-20)
  saveXPData(data)

  return { totalXP: data.totalXP, level: newLevel, leveledUp: newLevel > oldLevel, oldLevel, newLevel, xpAdded: amount }
}

// ═══ DAILY LOGIN + STREAK ═══
export function processDailyLogin() {
  const data = getXPData()
  const today = new Date().toISOString().split('T')[0]

  if (data.lastLoginDate === today) return { alreadyLoggedIn: true, ...data }

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  let streakSaved = false
  if (data.lastLoginDate === yesterday) {
    data.streakDays++
  } else if (data.lastLoginDate && data.lastLoginDate !== yesterday) {
    if (data.streakFreezes > 0) {
      data.streakFreezes--; data.streakDays++; streakSaved = true
    } else {
      data.streakDays = 1
    }
  } else {
    data.streakDays = 1
  }

  data.lastLoginDate = today

  // Reset weekly XP on Monday
  const now = new Date()
  const weekStart = getWeekStart(now)
  if (data.weekStart !== weekStart) { data.weeklyXP = 0; data.weekStart = weekStart }

  // Award daily login + streak XP
  const loginXP = XP_REWARDS.DAILY_LOGIN
  const streakXP = XP_REWARDS.STREAK_DAY * data.streakDays
  const oldLevel = getLevel(data.totalXP)
  data.totalXP += loginXP + streakXP
  data.weeklyXP = (data.weeklyXP || 0) + loginXP + streakXP
  data.level = getLevel(data.totalXP)

  // Earn streak freeze every 7 days (max 2)
  if (data.streakDays > 0 && data.streakDays % 7 === 0 && data.streakFreezes < 2) {
    data.streakFreezes++
    data.lastStreakFreezeEarned = today
  }

  data.xpHistory.push({ type: 'DAILY_LOGIN', amount: loginXP + streakXP, date: today })
  if (data.xpHistory.length > 20) data.xpHistory = data.xpHistory.slice(-20)
  saveXPData(data)

  return {
    alreadyLoggedIn: false, streakSaved, loginXP, streakXP,
    totalXPEarned: loginXP + streakXP, streakDays: data.streakDays,
    freezesLeft: data.streakFreezes, leveledUp: data.level > oldLevel,
    newLevel: data.level, totalXP: data.totalXP,
  }
}

// ═══ GAME XP AWARDS ═══
export function awardGameXP(results, config) {
  const data = getXPData()
  let totalAwarded = 0

  const correctCount = results.filter(r => r.score >= 60).length
  totalAwarded += correctCount * XP_REWARDS.CORRECT_ANSWER

  const perfectCount = results.filter(r => r.score === 100).length
  totalAwarded += perfectCount * XP_REWARDS.PERFECT_PIN

  totalAwarded += XP_REWARDS.COMPLETE_GAME
  if (config?.daily) totalAwarded += XP_REWARDS.DAILY_CHALLENGE
  if (config?.mode === 'blitz') totalAwarded += XP_REWARDS.BLITZ_COMPLETE

  const totalScore = results.reduce((sum, r) => sum + r.score, 0)
  const maxScore = results.length * 100
  if (totalScore === maxScore && !data.hasHadPerfectGame) {
    totalAwarded += XP_REWARDS.FIRST_PERFECT_GAME
    data.hasHadPerfectGame = true
  }

  const oldLevel = getLevel(data.totalXP)
  data.totalXP += totalAwarded
  data.weeklyXP = (data.weeklyXP || 0) + totalAwarded
  data.level = getLevel(data.totalXP)

  data.xpHistory.push({ type: 'GAME_COMPLETE', amount: totalAwarded, date: new Date().toISOString() })
  if (data.xpHistory.length > 20) data.xpHistory = data.xpHistory.slice(-20)
  saveXPData(data)

  return {
    totalAwarded, correctXP: correctCount * XP_REWARDS.CORRECT_ANSWER,
    perfectXP: perfectCount * XP_REWARDS.PERFECT_PIN, completionXP: XP_REWARDS.COMPLETE_GAME,
    bonusXP: (config?.daily ? XP_REWARDS.DAILY_CHALLENGE : 0) + (config?.mode === 'blitz' ? XP_REWARDS.BLITZ_COMPLETE : 0),
    leveledUp: data.level > oldLevel, oldLevel, newLevel: data.level, totalXP: data.totalXP,
  }
}

// ═══ LEAGUE SYSTEM (Milestone 2.2) ═══
function getWeekStart(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday start
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

export function getLeagueData() {
  const raw = localStorage.getItem(LEAGUE_KEY)
  if (!raw) return defaultLeague()
  try { return { ...defaultLeague(), ...JSON.parse(raw) } }
  catch { return defaultLeague() }
}

function defaultLeague() {
  return {
    tier: 'bronze',
    weekStart: null,
    weeklyXP: 0,
    rank: 15,       // virtual rank 1-30
    promoted: false,
    demoted: false,
    peers: [],      // simulated 29 other players
  }
}

function saveLeague(data) { localStorage.setItem(LEAGUE_KEY, JSON.stringify(data)) }

export function getCurrentLeague(totalXP) {
  let league = LEAGUE_TIERS[0]
  for (const t of LEAGUE_TIERS) { if (totalXP >= t.minXP) league = t }
  return league
}

export function getNextLeague(totalXP) {
  for (const t of LEAGUE_TIERS) { if (totalXP < t.minXP) return t }
  return null
}

export function getXPToNextLeague(totalXP) {
  const next = getNextLeague(totalXP)
  return next ? next.minXP - totalXP : 0
}

// Generate virtual peers for league table
export function generateLeaguePeers(playerXP, playerName) {
  const league = getCurrentLeague(playerXP)
  const names = [
    'Tunde', 'Ngozi', 'Emeka', 'Aisha', 'Bayo', 'Funmi', 'Chidi', 'Yemi',
    'Kelechi', 'Amara', 'Segun', 'Halima', 'Ife', 'Obinna', 'Zainab',
    'Dayo', 'Chiamaka', 'Femi', 'Blessing', 'Uche', 'Sade', 'Kabiru',
    'Nkechi', 'Taiwo', 'Fatima', 'Gbenga', 'Chioma', 'Jide', 'Hadiza',
  ]
  const peers = names.map((name, i) => ({
    name,
    xp: Math.max(0, Math.round(playerXP * (0.3 + Math.random() * 1.4))),
    avatar: ['🧭', '🌍', '🎯', '🔥', '⭐', '🏅', '🎮', '💎', '🚀', '🌟'][i % 10],
    isPlayer: false,
  }))
  peers.push({ name: playerName, xp: playerXP, avatar: localStorage.getItem('geoquiz_avatar') || '🧭', isPlayer: true })
  peers.sort((a, b) => b.xp - a.xp)
  return peers.slice(0, 30)
}

// ═══ DAILY REWARDS CALENDAR (Milestone 2.3) ═══
export function getRewardsData() {
  const raw = localStorage.getItem(REWARDS_KEY)
  if (!raw) return defaultRewards()
  try { return { ...defaultRewards(), ...JSON.parse(raw) } }
  catch { return defaultRewards() }
}

function defaultRewards() {
  return {
    currentDay: 0,        // 0 = hasn't started, 1-7 cycle
    lastClaimDate: null,
    claimedDays: [],      // which days have been claimed this cycle
    cycleStart: null,
  }
}

function saveRewards(data) { localStorage.setItem(REWARDS_KEY, JSON.stringify(data)) }

export function claimDailyReward() {
  const data = getXPData()
  const rewards = getRewardsData()
  const today = new Date().toISOString().split('T')[0]

  // Already claimed today
  if (rewards.lastClaimDate === today) return { alreadyClaimed: true, ...rewards }

  // Advance day in cycle
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  if (rewards.lastClaimDate === yesterday || rewards.currentDay === 0) {
    rewards.currentDay = (rewards.currentDay % 7) + 1
  } else {
    // Missed a day — reset cycle
    rewards.currentDay = 1
    rewards.claimedDays = []
    rewards.cycleStart = today
  }

  if (!rewards.cycleStart) rewards.cycleStart = today

  const reward = DAILY_REWARDS[rewards.currentDay - 1]
  rewards.lastClaimDate = today
  rewards.claimedDays.push(rewards.currentDay)

  // Apply reward
  let xpAwarded = 0
  if (reward.type === 'xp' || reward.type === 'badge') {
    xpAwarded = reward.amount
    data.totalXP += xpAwarded
    data.weeklyXP = (data.weeklyXP || 0) + xpAwarded
    data.level = getLevel(data.totalXP)
  }
  if (reward.type === 'freeze') {
    data.streakFreezes = Math.min((data.streakFreezes || 0) + 1, 3)
  }
  if (reward.type === 'skin' && !data.mapSkins.includes('neon')) {
    data.mapSkins.push('neon')
  }
  if (reward.type === 'badge') {
    const badge = `weekly-${rewards.cycleStart}`
    if (!data.badges.includes(badge)) data.badges.push(badge)
  }

  saveXPData(data)
  saveRewards(rewards)

  return {
    alreadyClaimed: false,
    reward,
    currentDay: rewards.currentDay,
    claimedDays: rewards.claimedDays,
    xpAwarded,
    totalXP: data.totalXP,
    level: data.level,
  }
}

export function canClaimToday() {
  const rewards = getRewardsData()
  const today = new Date().toISOString().split('T')[0]
  return rewards.lastClaimDate !== today
}
