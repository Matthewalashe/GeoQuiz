/**
 * Push Notifications & In-App Notification Helpers
 * Handles Web Push API registration and notification CRUD via Supabase.
 */
import { supabase } from './supabase.js'

// ── In-App Notifications ──────────────────────────────

/** Fetch notifications for the current user */
export async function getNotifications(limit = 50) {
  if (!supabase) return []
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  return data || []
}

/** Get count of unread notifications */
export async function getUnreadCount() {
  if (!supabase) return 0
  const { count } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('read', false)
  return count || 0
}

/** Mark a single notification as read */
export async function markRead(id) {
  if (!supabase) return
  await supabase.from('notifications').update({ read: true }).eq('id', id)
}

/** Mark all notifications as read */
export async function markAllRead(userId) {
  if (!supabase) return
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('read', false)
}

/** Delete a notification */
export async function deleteNotification(id) {
  if (!supabase) return
  await supabase.from('notifications').delete().eq('id', id)
}

/** Create an in-app notification */
export async function createNotification(userId, { type, title, body, icon, link }) {
  if (!supabase || !userId) return null
  const { data, error } = await supabase.from('notifications').insert({
    user_id: userId,
    type,
    title,
    body,
    icon: icon || '🔔',
    link: link || null,
  }).select().single()
  if (error) { console.warn('Notification insert failed:', error.message); return null }

  // Also fire a browser notification if permission granted
  showBrowserNotification(title, body, icon)
  return data
}

// ── Notification Trigger Helpers ──────────────────────

export function notifyStreak(userId, days) {
  return createNotification(userId, {
    type: 'streak',
    title: `🔥 ${days}-day streak!`,
    body: days >= 7 ? 'Incredible! Keep the fire burning!' : 'Keep it going tomorrow!',
    icon: '🔥',
    link: '/dashboard',
  })
}

export function notifyLevelUp(userId, level, title) {
  return createNotification(userId, {
    type: 'level_up',
    title: `⬆️ Level ${level}!`,
    body: `You're now "${title}" — keep exploring Lagos!`,
    icon: '⬆️',
    link: '/dashboard',
  })
}

export function notifyAchievement(userId, badge, name) {
  return createNotification(userId, {
    type: 'achievement',
    title: '🏅 Achievement unlocked!',
    body: `${badge} ${name}`,
    icon: '🏅',
    link: '/achievements',
  })
}

export function notifyListingApproved(userId, name) {
  return createNotification(userId, {
    type: 'listing',
    title: '✅ Listing approved!',
    body: `"${name}" is now live on Wanda`,
    icon: '✅',
    link: '/explore',
  })
}

export function notifyListingRejected(userId, name) {
  return createNotification(userId, {
    type: 'listing',
    title: '❌ Listing needs changes',
    body: `"${name}" was not approved. Please review and resubmit.`,
    icon: '❌',
    link: '/list-your-business/form',
  })
}

export function notifyNewDeal(userId, business) {
  return createNotification(userId, {
    type: 'deal',
    title: '🎁 New deal!',
    body: `${business} just posted a deal for you`,
    icon: '🎁',
    link: '/deals',
  })
}

export function notifyCommunity(userId, who, action) {
  return createNotification(userId, {
    type: 'community',
    title: `💬 ${who} ${action}`,
    body: 'Tap to see the conversation',
    icon: '💬',
    link: '/community',
  })
}

export function notifyDailyReward(userId) {
  return createNotification(userId, {
    type: 'daily_reward',
    title: '🎁 Daily reward ready!',
    body: 'Log in and claim your reward before it expires',
    icon: '🎁',
    link: '/dashboard',
  })
}

// ── Browser / OS Push Notifications ──────────────────

/** Check if browser supports notifications */
export function pushSupported() {
  return 'Notification' in window && 'serviceWorker' in navigator
}

/** Request notification permission */
export async function requestPushPermission() {
  if (!pushSupported()) return 'unsupported'
  const result = await Notification.requestPermission()
  return result // 'granted', 'denied', 'default'
}

/** Show a browser notification (if granted) */
export function showBrowserNotification(title, body, icon) {
  if (!pushSupported()) return
  if (Notification.permission !== 'granted') return
  try {
    new Notification(title, {
      body,
      icon: '/wanda-logo.png',
      badge: '/wanda-logo.png',
      tag: `wanda-${Date.now()}`,
    })
  } catch {
    // Mobile Safari doesn't support new Notification() — ignore
  }
}

/** Register service worker and subscribe to push (future use) */
export async function registerPushSubscription(userId) {
  if (!pushSupported() || !supabase || !userId) return null
  try {
    const registration = await navigator.serviceWorker.ready
    // For now, just ensure SW is registered. Full VAPID push
    // requires a server-side key pair — will be added when backend is ready.
    return registration
  } catch (e) {
    console.warn('Push registration failed:', e)
    return null
  }
}

// ── Real-time subscription for live notification updates ──

/** Subscribe to real-time notification inserts for a user */
export function subscribeToNotifications(userId, onNew) {
  if (!supabase || !userId) return null
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      (payload) => {
        if (onNew) onNew(payload.new)
        // Also show browser notification
        showBrowserNotification(payload.new.title, payload.new.body, payload.new.icon)
      }
    )
    .subscribe()
  return channel
}
