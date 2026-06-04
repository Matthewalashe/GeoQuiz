/**
 * Game Service — Client-side interface to the Wanda Game Engine
 * 
 * CRITICAL: This service NEVER writes directly to wallets, coin_transactions,
 * user_lives, or user_streaks. ALL writes go through Supabase RPC calls to
 * SECURITY DEFINER functions that run server-side.
 * 
 * ALL coin amounts, game config, store prices, and level config are fetched
 * from the database at runtime — ZERO hardcoded values.
 */

import { supabase } from './supabase.js'

// ═══════════════════════════════════════════════════════════
// CONFIG CACHE — loaded once per session, refreshed on demand
// ═══════════════════════════════════════════════════════════

let _coinConfig = null
let _gameConfig = null
let _levelConfig = null
let _storeItems = null
let _configLoaded = false

/** Load all config tables once. Call on app boot. */
export async function loadGameConfig() {
  if (!supabase) return
  const [coins, games, levels, store] = await Promise.all([
    supabase.from('coin_config').select('*'),
    supabase.from('game_config').select('*').order('sort_order'),
    supabase.from('level_config').select('*').order('level_min'),
    supabase.from('store_items').select('*').order('sort_order'),
  ])

  _coinConfig = {}
  ;(coins.data || []).forEach(r => { _coinConfig[r.key] = r.value })

  _gameConfig = (games.data || []).filter(g => g.is_enabled)
  _levelConfig = levels.data || []
  _storeItems = store.data || []
  _configLoaded = true
}

/** Get a coin config value by key */
export function getCoinValue(key, fallback = 0) {
  return _coinConfig?.[key] ?? fallback
}

/** Get all enabled games */
export function getGames() { return _gameConfig || [] }

/** Get all store items */
export function getStoreItems() { return _storeItems || [] }

/** Get difficulty and time limit for a level number */
export function getLevelDifficulty(level) {
  const cfg = (_levelConfig || []).find(c => level >= c.level_min && level <= c.level_max)
  return cfg || { difficulty: 1, time_limit_secs: 30, description: 'Unknown' }
}

/** Force-refresh config (e.g. after admin changes) */
export async function refreshConfig() {
  _configLoaded = false
  await loadGameConfig()
}


// ═══════════════════════════════════════════════════════════
// GAME PROFILE — Wallet, Lives, Streaks
// ═══════════════════════════════════════════════════════════

/** Ensure game profile exists (wallet + lives + streaks). Call on login. */
export async function ensureGameProfile(userId) {
  if (!supabase || !userId) return null
  const { data, error } = await supabase.rpc('ensure_game_profile', { p_user_id: userId })
  if (error) { console.error('ensureGameProfile:', error.message); return null }
  return data
}

/** Get current wallet state */
export async function getWallet(userId) {
  if (!supabase || !userId) return null
  const { data } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .single()
  return data
}

/** Get coin transaction history */
export async function getTransactions(userId, limit = 50) {
  if (!supabase || !userId) return []
  const { data } = await supabase
    .from('coin_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  return data || []
}


// ═══════════════════════════════════════════════════════════
// LIVES — Read state + server actions
// ═══════════════════════════════════════════════════════════

/** Regenerate lives on app load (server-side calculation) */
export async function regenerateLives(userId) {
  if (!supabase || !userId) return null
  const { data, error } = await supabase.rpc('regenerate_lives', { p_user_id: userId })
  if (error) { console.error('regenerateLives:', error.message); return null }
  return data // { lives, max_lives, seconds_until_next }
}

/** Use 1 life (called by server via complete_level, but also available directly) */
export async function useLife(userId) {
  if (!supabase || !userId) return null
  const { data, error } = await supabase.rpc('use_life', { p_user_id: userId })
  if (error) { console.error('useLife:', error.message); return null }
  return data
}

/** Buy lives with coins */
export async function buyLives(userId) {
  if (!supabase || !userId) return null
  const { data, error } = await supabase.rpc('buy_lives', { p_user_id: userId })
  if (error) { console.error('buyLives:', error.message); return null }
  return data
}


// ═══════════════════════════════════════════════════════════
// STREAKS & DAILY LOGIN
// ═══════════════════════════════════════════════════════════

/** Process daily login — updates streak + awards daily coins (server-side) */
export async function processDailyLogin(userId) {
  if (!supabase || !userId) return null
  const { data, error } = await supabase.rpc('process_daily_login', { p_user_id: userId })
  if (error) { console.error('processDailyLogin:', error.message); return null }
  return data
}

/** Get current streak data (read-only) */
export async function getStreak(userId) {
  if (!supabase || !userId) return null
  const { data } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', userId)
    .single()
  return data
}


// ═══════════════════════════════════════════════════════════
// LEVEL COMPLETION & GAME PROGRESS
// ═══════════════════════════════════════════════════════════

/**
 * Complete a level — THE main game action.
 * Server validates everything, awards coins, deducts lives if failed.
 * @param {string} userId
 * @param {string} gameType - 'map_quiz', 'trivia', etc.
 * @param {number} level - current level number
 * @param {number} correct - questions answered correctly
 * @param {number} total - total questions (usually 10)
 * @param {Array} answers - [{question_id, was_correct}]
 */
export async function completeLevel(userId, gameType, level, correct, total, answers = []) {
  if (!supabase || !userId) return null
  const { data, error } = await supabase.rpc('complete_level', {
    p_user_id: userId,
    p_game_type: gameType,
    p_level: level,
    p_correct: correct,
    p_total: total,
    p_answers: answers.length > 0 ? answers : null,
  })
  if (error) { console.error('completeLevel:', error.message); return null }
  return data
}

/** Get game progress for all games (read-only) */
export async function getGameProgress(userId) {
  if (!supabase || !userId) return []
  const { data } = await supabase
    .from('user_game_progress')
    .select('*')
    .eq('user_id', userId)
  return data || []
}

/** Get progress for a specific game (read-only) */
export async function getGameProgressForType(userId, gameType) {
  if (!supabase || !userId) return null
  const { data } = await supabase
    .from('user_game_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('game_type', gameType)
    .single()
  return data
}


// ═══════════════════════════════════════════════════════════
// QUESTIONS — Fetch from bank with 30-day dedup
// ═══════════════════════════════════════════════════════════

/**
 * Get questions for a level, excluding ones the user has seen in 30 days.
 * @param {string} userId
 * @param {string} gameType
 * @param {number} level - used to determine difficulty
 * @param {number} count - questions to fetch (default 10)
 */
export async function getQuestionsForLevel(userId, gameType, level, count = 10) {
  if (!supabase) return []

  const { difficulty } = getLevelDifficulty(level)

  // Get question IDs user has seen in last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: seen } = await supabase
    .from('user_question_history')
    .select('question_id')
    .eq('user_id', userId)
    .gte('answered_at', thirtyDaysAgo)

  const seenIds = (seen || []).map(s => s.question_id)

  // Fetch questions matching game_type and difficulty, excluding seen
  let query = supabase
    .from('questions')
    .select('*')
    .eq('game_type', gameType)
    .eq('difficulty', difficulty)
    .eq('is_active', true)
    .limit(count * 3) // fetch extra to allow filtering

  const { data: questions } = await query

  // Filter out seen questions client-side (more reliable than .not())
  let filtered = (questions || []).filter(q => !seenIds.includes(q.id))

  // If not enough questions at exact difficulty, expand to adjacent
  if (filtered.length < count) {
    const adjDiff = difficulty > 1 ? difficulty - 1 : difficulty + 1
    const { data: extra } = await supabase
      .from('questions')
      .select('*')
      .eq('game_type', gameType)
      .eq('difficulty', adjDiff)
      .eq('is_active', true)
      .limit(count * 2)

    const extraFiltered = (extra || []).filter(q => !seenIds.includes(q.id) && !filtered.find(f => f.id === q.id))
    filtered = [...filtered, ...extraFiltered]
  }

  // Shuffle and take the required count
  const shuffled = filtered.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}


// ═══════════════════════════════════════════════════════════
// STORE — Purchase items
// ═══════════════════════════════════════════════════════════

/** Purchase a store item (server-side — validates balance, deducts, records) */
export async function purchaseStoreItem(userId, itemSlug) {
  if (!supabase || !userId) return null
  const { data, error } = await supabase.rpc('purchase_store_item', {
    p_user_id: userId,
    p_item_slug: itemSlug,
  })
  if (error) { console.error('purchaseStoreItem:', error.message); return null }
  return data
}

/** Get user's purchase history */
export async function getUserPurchases(userId) {
  if (!supabase || !userId) return []
  const { data } = await supabase
    .from('user_purchases')
    .select('*')
    .eq('user_id', userId)
    .order('purchased_at', { ascending: false })
  return data || []
}

/** Check if user owns a specific item */
export async function ownsItem(userId, itemSlug) {
  if (!supabase || !userId) return false
  const { data } = await supabase
    .from('user_purchases')
    .select('id')
    .eq('user_id', userId)
    .eq('item_slug', itemSlug)
    .limit(1)
  return (data || []).length > 0
}


// ═══════════════════════════════════════════════════════════
// COIN AWARDS (via server RPC — never direct writes)
// ═══════════════════════════════════════════════════════════

/** Award coins for sharing a result */
export async function awardShareResult(userId, gameType) {
  if (!supabase || !userId) return null
  const { data, error } = await supabase.rpc('award_coins', {
    p_user_id: userId,
    p_source: 'share_result',
    p_game_type: gameType,
    p_desc: 'Shared game result',
  })
  if (error) { console.error('awardShareResult:', error.message); return null }
  return data
}

/** Award coins for community question approval */
export async function awardCommunityQuestion(userId) {
  if (!supabase || !userId) return null
  const { data, error } = await supabase.rpc('award_coins', {
    p_user_id: userId,
    p_source: 'community_question',
    p_desc: 'Community question approved',
  })
  if (error) { console.error('awardCommunityQuestion:', error.message); return null }
  return data
}

/** Award daily challenge bonus */
export async function awardDailyChallenge(userId, gameType) {
  if (!supabase || !userId) return null
  const { data, error } = await supabase.rpc('award_coins', {
    p_user_id: userId,
    p_source: 'daily_challenge',
    p_game_type: gameType,
    p_desc: 'Daily challenge completed',
  })
  if (error) { console.error('awardDailyChallenge:', error.message); return null }
  return data
}


// ═══════════════════════════════════════════════════════════
// LEADERBOARDS (read-only)
// ═══════════════════════════════════════════════════════════

/** All-time leaderboard (by lifetime_coins) */
export async function getLeaderboardAllTime(limit = 100) {
  if (!supabase) return []
  const { data } = await supabase
    .from('wallets')
    .select('user_id, lifetime_coins, profiles!inner(username, avatar_url, location)')
    .order('lifetime_coins', { ascending: false })
    .limit(limit)
  return data || []
}

/** Season leaderboard */
export async function getLeaderboardSeason(limit = 100) {
  if (!supabase) return []
  const { data: season } = await supabase
    .from('seasons')
    .select('id')
    .eq('is_active', true)
    .single()
  if (!season) return []
  const { data } = await supabase
    .from('season_progress')
    .select('user_id, coins_earned_this_season, profiles!inner(username, avatar_url, location)')
    .eq('season_id', season.id)
    .order('coins_earned_this_season', { ascending: false })
    .limit(limit)
  return data || []
}

/** Per-game leaderboard */
export async function getLeaderboardPerGame(gameType, limit = 100) {
  if (!supabase) return []
  const { data } = await supabase
    .from('user_game_progress')
    .select('user_id, highest_level_reached, total_coins_earned_here, profiles!inner(username, avatar_url, location)')
    .eq('game_type', gameType)
    .order('highest_level_reached', { ascending: false })
    .limit(limit)
  return data || []
}

/** Get user's rank in all-time leaderboard */
export async function getUserRank(userId) {
  if (!supabase || !userId) return null
  const { data: wallet } = await supabase
    .from('wallets')
    .select('lifetime_coins')
    .eq('user_id', userId)
    .single()
  if (!wallet) return null
  const { count } = await supabase
    .from('wallets')
    .select('*', { count: 'exact', head: true })
    .gt('lifetime_coins', wallet.lifetime_coins)
  return { rank: (count || 0) + 1, lifetime_coins: wallet.lifetime_coins }
}


// ═══════════════════════════════════════════════════════════
// COMMUNITY QUESTIONS — Submit from app
// ═══════════════════════════════════════════════════════════

/** Submit a community question (goes to questions table with is_active=false) */
export async function submitCommunityQuestion(userId, { gameType, category, difficulty, questionText, options, correctAnswer }) {
  if (!supabase || !userId) return null
  const { data, error } = await supabase.from('questions').insert({
    game_type: gameType,
    category: category || null,
    difficulty: difficulty || 1,
    question_text: questionText,
    options: options, // JSONB array
    correct_answer: correctAnswer,
    source: 'community',
    submitted_by: userId,
    is_active: false,
  }).select().single()
  if (error) { console.error('submitCommunityQuestion:', error.message); return null }
  return data
}


// ═══════════════════════════════════════════════════════════
// SEASONS
// ═══════════════════════════════════════════════════════════

/** Get current active season */
export async function getActiveSeason() {
  if (!supabase) return null
  const { data } = await supabase
    .from('seasons')
    .select('*')
    .eq('is_active', true)
    .single()
  return data
}
