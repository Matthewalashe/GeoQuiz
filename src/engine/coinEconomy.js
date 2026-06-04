/**
 * COIN ECONOMY ENGINE
 * Local coin wallet with transaction history.
 * Rule: Coins are earned through gameplay, spent in the store.
 *
 * Earning:
 * - Game completion: 5-50 coins based on score
 * - Daily login streak: 5-25 coins
 * - Achievement milestones: 10-100 coins
 *
 * Spending:
 * - Store items (themes, power-ups, badges)
 */

const STORAGE_KEY = 'wanda_coins'
const TX_KEY = 'wanda_coin_tx'

// ── Wallet ──

export function getBalance() {
  return parseInt(localStorage.getItem(STORAGE_KEY) || '100', 10) // Start with 100 coins
}

function setBalance(amount) {
  localStorage.setItem(STORAGE_KEY, String(Math.max(0, amount)))
}

export function addCoins(amount, reason = 'earned') {
  const bal = getBalance()
  const newBal = bal + amount
  setBalance(newBal)
  logTransaction(amount, reason, newBal)
  return newBal
}

export function spendCoins(amount, reason = 'purchase') {
  const bal = getBalance()
  if (bal < amount) return { success: false, balance: bal, error: 'Insufficient coins' }
  const newBal = bal - amount
  setBalance(newBal)
  logTransaction(-amount, reason, newBal)
  return { success: true, balance: newBal }
}

export function canAfford(amount) {
  return getBalance() >= amount
}

// ── Transactions ──

function logTransaction(amount, reason, balanceAfter) {
  const txs = getTransactions()
  txs.push({
    amount,
    reason,
    balanceAfter,
    timestamp: Date.now(),
  })
  // Keep last 100 transactions
  const trimmed = txs.slice(-100)
  localStorage.setItem(TX_KEY, JSON.stringify(trimmed))
}

export function getTransactions() {
  try {
    return JSON.parse(localStorage.getItem(TX_KEY) || '[]')
  } catch {
    return []
  }
}

// ── Purchased Items ──

const PURCHASED_KEY = 'wanda_purchased'

export function getPurchasedItems() {
  try {
    return JSON.parse(localStorage.getItem(PURCHASED_KEY) || '[]')
  } catch {
    return []
  }
}

export function hasPurchased(itemId) {
  return getPurchasedItems().includes(itemId)
}

export function markPurchased(itemId) {
  const items = getPurchasedItems()
  if (!items.includes(itemId)) {
    items.push(itemId)
    localStorage.setItem(PURCHASED_KEY, JSON.stringify(items))
  }
}

export function purchaseItem(itemId, cost) {
  if (hasPurchased(itemId)) return { success: false, error: 'Already owned' }
  const result = spendCoins(cost, `store:${itemId}`)
  if (result.success) {
    markPurchased(itemId)
  }
  return result
}

// ── Active Items ──

const ACTIVE_KEY = 'wanda_active_items'

export function getActiveItems() {
  try {
    return JSON.parse(localStorage.getItem(ACTIVE_KEY) || '{}')
  } catch {
    return {}
  }
}

export function setActiveItem(slot, itemId) {
  const active = getActiveItems()
  active[slot] = itemId
  localStorage.setItem(ACTIVE_KEY, JSON.stringify(active))
}

export function getActiveItem(slot) {
  return getActiveItems()[slot] || null
}

// ── Game Reward Calculator ──

export function calculateGameReward(score, maxScore) {
  const pct = maxScore > 0 ? score / maxScore : 0
  if (pct >= 0.9) return 50
  if (pct >= 0.7) return 30
  if (pct >= 0.5) return 15
  if (pct >= 0.3) return 10
  return 5
}

// ── Store Catalog ──

export const STORE_ITEMS = [
  // ── Themes ──
  {
    id: 'theme-ocean',
    name: 'Ocean Depths',
    description: 'Cool blues and teals for a calming vibe',
    category: 'theme',
    price: 150,
    emoji: '🌊',
    preview: 'linear-gradient(135deg, #0077b6, #00b4d8, #90e0ef)',
  },
  {
    id: 'theme-sunset',
    name: 'Lagos Sunset',
    description: 'Warm oranges and pinks inspired by Lagos sunsets',
    category: 'theme',
    price: 150,
    emoji: '🌅',
    preview: 'linear-gradient(135deg, #ff6b35, #f7931e, #ffcd3c)',
  },
  {
    id: 'theme-forest',
    name: 'Rainforest',
    description: 'Deep greens for nature lovers',
    category: 'theme',
    price: 150,
    emoji: '🌿',
    preview: 'linear-gradient(135deg, #1b4332, #2d6a4f, #52b788)',
  },
  {
    id: 'theme-royal',
    name: 'Royal Purple',
    description: 'Premium purple and gold aesthetic',
    category: 'theme',
    price: 250,
    emoji: '👑',
    preview: 'linear-gradient(135deg, #7b2cbf, #9d4edd, #c77dff)',
  },
  {
    id: 'theme-neon',
    name: 'Neon Nights',
    description: 'Cyberpunk-inspired neon glow',
    category: 'theme',
    price: 300,
    emoji: '💜',
    preview: 'linear-gradient(135deg, #ff006e, #8338ec, #3a86ff)',
  },

  // ── Power-ups ──
  {
    id: 'powerup-extra-time',
    name: 'Time Extender',
    description: '+10 seconds per question (5 uses)',
    category: 'powerup',
    price: 75,
    emoji: '⏰',
    uses: 5,
    consumable: true,
  },
  {
    id: 'powerup-fifty-fifty',
    name: '50/50 Eliminator',
    description: 'Remove 2 wrong answers (5 uses)',
    category: 'powerup',
    price: 100,
    emoji: '✂️',
    uses: 5,
    consumable: true,
  },
  {
    id: 'powerup-double-xp',
    name: 'Double XP Boost',
    description: '2x XP for your next 3 games',
    category: 'powerup',
    price: 120,
    emoji: '⚡',
    uses: 3,
    consumable: true,
  },
  {
    id: 'powerup-streak-shield',
    name: 'Streak Shield',
    description: 'Protect your streak from 1 wrong answer',
    category: 'powerup',
    price: 80,
    emoji: '🛡️',
    uses: 3,
    consumable: true,
  },
  {
    id: 'powerup-extra-life',
    name: 'Extra Life Pack',
    description: '+1 life in FlagStack (3 uses)',
    category: 'powerup',
    price: 90,
    emoji: '❤️‍🩹',
    uses: 3,
    consumable: true,
  },

  // ── Profile Badges ──
  {
    id: 'badge-explorer',
    name: 'Explorer Badge',
    description: 'Show off your adventurous spirit',
    category: 'badge',
    price: 50,
    emoji: '🧭',
  },
  {
    id: 'badge-champion',
    name: 'Champion Badge',
    description: 'For the competitive players',
    category: 'badge',
    price: 100,
    emoji: '🏆',
  },
  {
    id: 'badge-scholar',
    name: 'Scholar Badge',
    description: 'Knowledge is your superpower',
    category: 'badge',
    price: 75,
    emoji: '📚',
  },
  {
    id: 'badge-flame',
    name: 'Flame Badge',
    description: 'You\'re on fire!',
    category: 'badge',
    price: 125,
    emoji: '🔥',
  },
  {
    id: 'badge-crown',
    name: 'Crown Badge',
    description: 'Royalty status unlocked',
    category: 'badge',
    price: 200,
    emoji: '👑',
  },
  {
    id: 'badge-star',
    name: 'All-Star Badge',
    description: 'The cream of the crop',
    category: 'badge',
    price: 300,
    emoji: '⭐',
  },
]

export function getStoreByCategory() {
  const cats = {}
  for (const item of STORE_ITEMS) {
    if (!cats[item.category]) cats[item.category] = []
    cats[item.category].push(item)
  }
  return cats
}
