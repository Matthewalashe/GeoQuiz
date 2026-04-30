// ============================================
// GeoQuiz XP + Leveling System
// Phase 2, Milestone 2.1
// ============================================

const STORAGE_KEY = 'geoquiz_xp'

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
  CORRECT_ANSWER: 10,       // per correct (60+ score) answer
  PERFECT_PIN: 25,           // 100-point pin
  COMPLETE_GAME: 100,        // finish a full game
  DAILY_LOGIN: 25,           // first open each day
  STREAK_DAY: 5,             // multiplied by streak_count
  SHARE_RESULT: 20,          // share a result
  DAILY_CHALLENGE: 50,       // complete daily challenge
  BLITZ_COMPLETE: 75,        // complete blitz mode
  FIRST_PERFECT_GAME: 500,   // 100% score (one-time bonus)
}

// Get XP data from storage
export function getXPData() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return defaultXPData()
  try {
    return { ...defaultXPData(), ...JSON.parse(raw) }
  } catch {
    return defaultXPData()
  }
}

function defaultXPData() {
  return {
    totalXP: 0,
    level: 1,
    streakDays: 0,
    lastLoginDate: null,
    streakFreezes: 0,
    lastStreakFreezeEarned: null,
    xpHistory: [],      // last 20 entries: { type, amount, date }
    hasHadPerfectGame: false,
  }
}

// Save XP data
function saveXPData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

// Calculate level from total XP
export function getLevel(totalXP) {
  return Math.min(Math.floor(totalXP / XP_PER_LEVEL) + 1, MAX_LEVEL)
}

// Get XP progress within current level (0-1)
export function getLevelProgress(totalXP) {
  const xpInLevel = totalXP % XP_PER_LEVEL
  return xpInLevel / XP_PER_LEVEL
}

// XP needed for next level
export function getXPToNextLevel(totalXP) {
  return XP_PER_LEVEL - (totalXP % XP_PER_LEVEL)
}

// Get title for level
export function getLevelTitle(level) {
  let title = LEVEL_TITLES[0]
  for (const t of LEVEL_TITLES) {
    if (level >= t.min) title = t
  }
  return title
}

// Add XP and return { newTotal, leveledUp, oldLevel, newLevel, xpAdded }
export function addXP(type, multiplier = 1) {
  const data = getXPData()
  const base = XP_REWARDS[type] || 0
  const amount = Math.round(base * multiplier)
  if (amount <= 0) return { ...data, leveledUp: false, xpAdded: 0 }

  const oldLevel = getLevel(data.totalXP)
  data.totalXP += amount
  const newLevel = getLevel(data.totalXP)
  data.level = newLevel

  // Track history
  data.xpHistory.push({ type, amount, date: new Date().toISOString() })
  if (data.xpHistory.length > 20) data.xpHistory = data.xpHistory.slice(-20)

  saveXPData(data)
  return {
    totalXP: data.totalXP,
    level: newLevel,
    leveledUp: newLevel > oldLevel,
    oldLevel,
    newLevel,
    xpAdded: amount,
  }
}

// Process daily login — handles streaks + streak freeze
export function processDailyLogin() {
  const data = getXPData()
  const today = new Date().toISOString().split('T')[0]

  if (data.lastLoginDate === today) {
    return { alreadyLoggedIn: true, ...data }
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  if (data.lastLoginDate === yesterday) {
    // Continuing streak
    data.streakDays++
  } else if (data.lastLoginDate && data.lastLoginDate !== yesterday) {
    // Missed a day — check freeze
    if (data.streakFreezes > 0) {
      data.streakFreezes--
      // Streak saved!
      data.streakDays++
      data.lastLoginDate = today
      saveXPData(data)
      return { streakSaved: true, streakDays: data.streakDays, freezesLeft: data.streakFreezes, ...data }
    } else {
      // Streak broken
      data.streakDays = 1
    }
  } else {
    // First ever login
    data.streakDays = 1
  }

  data.lastLoginDate = today

  // Award daily login XP
  const loginXP = XP_REWARDS.DAILY_LOGIN
  const streakXP = XP_REWARDS.STREAK_DAY * data.streakDays
  const oldLevel = getLevel(data.totalXP)
  data.totalXP += loginXP + streakXP
  data.level = getLevel(data.totalXP)

  // Earn streak freeze every 7 days (max 2 stored)
  if (data.streakDays > 0 && data.streakDays % 7 === 0 && data.streakFreezes < 2) {
    data.streakFreezes++
    data.lastStreakFreezeEarned = today
  }

  data.xpHistory.push({ type: 'DAILY_LOGIN', amount: loginXP + streakXP, date: today })
  if (data.xpHistory.length > 20) data.xpHistory = data.xpHistory.slice(-20)

  saveXPData(data)

  return {
    alreadyLoggedIn: false,
    loginXP,
    streakXP,
    totalXPEarned: loginXP + streakXP,
    streakDays: data.streakDays,
    freezesLeft: data.streakFreezes,
    leveledUp: data.level > oldLevel,
    newLevel: data.level,
    totalXP: data.totalXP,
  }
}

// Award game XP based on results
export function awardGameXP(results, config) {
  const data = getXPData()
  let totalAwarded = 0

  // XP for correct answers
  const correctCount = results.filter(r => r.score >= 60).length
  totalAwarded += correctCount * XP_REWARDS.CORRECT_ANSWER

  // XP for perfect pins
  const perfectCount = results.filter(r => r.score === 100).length
  totalAwarded += perfectCount * XP_REWARDS.PERFECT_PIN

  // Completion bonus
  totalAwarded += XP_REWARDS.COMPLETE_GAME

  // Daily challenge bonus
  if (config?.daily) totalAwarded += XP_REWARDS.DAILY_CHALLENGE

  // Blitz bonus
  if (config?.mode === 'blitz') totalAwarded += XP_REWARDS.BLITZ_COMPLETE

  // Perfect game one-time bonus
  const totalScore = results.reduce((sum, r) => sum + r.score, 0)
  const maxScore = results.length * 100
  if (totalScore === maxScore && !data.hasHadPerfectGame) {
    totalAwarded += XP_REWARDS.FIRST_PERFECT_GAME
    data.hasHadPerfectGame = true
  }

  const oldLevel = getLevel(data.totalXP)
  data.totalXP += totalAwarded
  data.level = getLevel(data.totalXP)

  data.xpHistory.push({ type: 'GAME_COMPLETE', amount: totalAwarded, date: new Date().toISOString() })
  if (data.xpHistory.length > 20) data.xpHistory = data.xpHistory.slice(-20)

  saveXPData(data)

  return {
    totalAwarded,
    correctXP: correctCount * XP_REWARDS.CORRECT_ANSWER,
    perfectXP: perfectCount * XP_REWARDS.PERFECT_PIN,
    completionXP: XP_REWARDS.COMPLETE_GAME,
    bonusXP: (config?.daily ? XP_REWARDS.DAILY_CHALLENGE : 0) + (config?.mode === 'blitz' ? XP_REWARDS.BLITZ_COMPLETE : 0),
    leveledUp: data.level > oldLevel,
    oldLevel,
    newLevel: data.level,
    totalXP: data.totalXP,
  }
}
