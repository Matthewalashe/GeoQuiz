import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,     // Parse OAuth tokens from URL hash after redirect
        // NOTE: Do NOT use flowType:'pkce' — it breaks PWA OAuth because
        // the code_verifier lives in PWA localStorage but the redirect
        // happens in the browser (different context). Implicit flow works.
      }
    })
  : null

// ---- Waitlist ----
export async function submitWaitlist({ name, email, role, message }) {
  if (!supabase) {
    throw new Error('Database connection unavailable. Please check your internet and try again.')
  }
  const row = { name, email }
  if (role) row.role = role
  if (message) row.message = message
  const { error } = await supabase.from('waitlist').insert([row])
  if (error) throw error

  // Send email notification (fire-and-forget)
  try {
    await fetch('https://formsubmit.co/ajax/donghinny91@gmail.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        _subject: '🗺️ New GeoQuiz Waitlist Signup!',
        Name: name,
        Email: email,
        Role: role || 'Not specified',
        Message: message || 'None',
        _template: 'table',
      }),
    })
  } catch { /* email failure is non-critical */ }

  return { success: true }
}

// ---- Leaderboard ----
export async function submitScore({ playerName, score, maxScore, questionCount, categories, difficulty, gameType = 'quiz' }) {
  if (!supabase) {
    throw new Error('Database connection unavailable. Your score could not be saved.')
  }
  // Core fields that must exist
  const coreRow = {
    player_name: playerName,
    score,
    max_score: maxScore,
    question_count: questionCount,
  }
  // Optional fields — may not exist in table yet
  const fullRow = { ...coreRow }
  if (gameType) fullRow.game_type = gameType
  if (categories) fullRow.categories = categories
  if (difficulty) fullRow.difficulty = difficulty

  // Try with all fields first
  const { error } = await supabase.from('leaderboard').insert([fullRow])
  if (error) {
    // If column doesn't exist, retry with core fields only
    if (error.message?.includes('schema cache') || error.code === 'PGRST204') {
      const { error: retryErr } = await supabase.from('leaderboard').insert([coreRow])
      if (retryErr) throw retryErr
      return { success: true }
    }
    throw error
  }
  return { success: true }
}

export async function fetchLeaderboard(limit = 30) {
  if (!supabase) {
    throw new Error('Database connection unavailable.')
  }
  // Query real users from profiles, ordered by total XP
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, total_xp, level, streak_days, created_at')
    .order('total_xp', { ascending: false })
    .limit(limit)
  if (error) throw error
  // Map to leaderboard-compatible format
  return (data || []).map(u => ({
    id: u.id,
    player_name: u.username || u.full_name || 'Explorer',
    avatar: u.avatar_url || '🧭',
    score: u.total_xp || 0,
    level: u.level || 1,
    streak: u.streak_days || 0,
    created_at: u.created_at,
    max_score: Math.max(u.total_xp || 0, 1),
    question_count: u.level || 1,
  }))
}

// Fetch real users in the same league/XP tier for the league table
export async function fetchLeaguePeers(minXP = 0, maxXP = 999999, limit = 20) {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, total_xp, level, streak_days')
    .gte('total_xp', minXP)
    .lte('total_xp', maxXP)
    .order('total_xp', { ascending: false })
    .limit(limit)
  if (error) { console.warn('League peers fetch error:', error.message); return [] }
  return (data || []).map(u => ({
    id: u.id,
    name: u.username || u.full_name || 'Explorer',
    avatar: u.avatar_url || '🧭',
    xp: u.total_xp || 0,
    level: u.level || 1,
    streak: u.streak_days || 0,
  }))
}

export async function getWaitlistCount() {
  if (!supabase) {
    return JSON.parse(localStorage.getItem('geoquiz_waitlist') || '[]').length
  }
  const { count, error } = await supabase
    .from('waitlist')
    .select('*', { count: 'exact', head: true })
  if (error) return 0
  return count || 0
}

// ---- Community Feed ----
const POSTS_KEY = 'geoquiz_community'

function getLocalPosts() {
  return JSON.parse(localStorage.getItem(POSTS_KEY) || '[]')
}
function saveLocalPosts(posts) {
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts))
}

export async function fetchPosts(limit = 30) {
  if (!supabase) {
    return getLocalPosts()
      .filter(p => !p.parent_id && !p.reported)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit)
  }
  const { data, error } = await supabase
    .from('community_posts')
    .select('*')
    .is('parent_id', null)
    .eq('reported', false)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}

export async function fetchReplies(parentId) {
  if (!supabase) {
    return getLocalPosts()
      .filter(p => p.parent_id === parentId && !p.reported)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
  }
  const { data, error } = await supabase
    .from('community_posts')
    .select('*')
    .eq('parent_id', parentId)
    .eq('reported', false)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export async function createPost({ author, content, parentId = null, level = 1, avatar = '🎭' }) {
  const post = {
    author, content: content.trim().slice(0, 500),
    parent_id: parentId, level, avatar, reported: false,
    likes: [],
  }
  if (!supabase) {
    const all = getLocalPosts()
    const newPost = { ...post, id: crypto.randomUUID(), created_at: new Date().toISOString() }
    all.unshift(newPost)
    saveLocalPosts(all.slice(0, 200))
    return newPost
  }
  const { data, error } = await supabase
    .from('community_posts')
    .insert([post])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function toggleLike(postId, username) {
  if (!supabase) {
    const all = getLocalPosts()
    const post = all.find(p => p.id === postId)
    if (!post) return
    const idx = post.likes.indexOf(username)
    if (idx >= 0) post.likes.splice(idx, 1)
    else post.likes.push(username)
    saveLocalPosts(all)
    return post
  }
  // Fetch current likes, toggle, update
  const { data: current } = await supabase
    .from('community_posts')
    .select('likes')
    .eq('id', postId)
    .single()
  if (!current) return
  let likes = current.likes || []
  const idx = likes.indexOf(username)
  if (idx >= 0) likes = likes.filter(l => l !== username)
  else likes = [...likes, username]
  const { data, error } = await supabase
    .from('community_posts')
    .update({ likes })
    .eq('id', postId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function reportPost(postId) {
  if (!supabase) {
    const all = getLocalPosts()
    const post = all.find(p => p.id === postId)
    if (post) post.reported = true
    saveLocalPosts(all)
    return
  }
  await supabase
    .from('community_posts')
    .update({ reported: true })
    .eq('id', postId)
}

// ---- Auth & Profiles ----

export async function signUp({ email, password, username, fullName, avatar }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username || email.split('@')[0],
        full_name: fullName || '',
        avatar_url: avatar || '🧭',
      }
    }
  })
  if (error) throw error
  return data
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signInWithGoogle() {
  if (!supabase) throw new Error('Supabase not configured')
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + '/dashboard' }
  })
  if (error) throw error
  return data
}

export async function resetPassword(email) {
  if (!supabase) throw new Error('Supabase not configured')
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/auth?mode=reset',
  })
  if (error) throw error
}

export async function updatePassword(newPassword) {
  if (!supabase) throw new Error('Supabase not configured')
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}

export async function signOut() {
  if (!supabase) return
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getSession() {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  return session
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback)
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

/**
 * CRITICAL: Ensures a profile row exists for the given user.
 * Call this after EVERY successful auth (signup, login, OAuth).
 * If the DB trigger (handle_new_user) failed or hasn't fired yet,
 * this creates the profile from the frontend side.
 */
export async function ensureProfile(user) {
  if (!supabase || !user) return null

  // First, try to get the existing profile
  const { data: existing, error: fetchErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()  // won't throw if no row found

  if (existing) return existing  // Profile exists, we're good

  // Profile doesn't exist — create it now
  const profileData = {
    id: user.id,
    email: user.email || '',
    username: user.user_metadata?.username || user.user_metadata?.name || user.email?.split('@')[0] || 'Explorer',
    full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
    avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || localStorage.getItem('geoquiz_avatar') || '🧭',
    role: 'user',
    total_xp: 0,
    streak_days: 0,
    level: 1,
    achievements: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const { data: created, error: insertErr } = await supabase
    .from('profiles')
    .upsert(profileData, { onConflict: 'id' })
    .select()
    .single()

  if (insertErr) {
    console.warn('ensureProfile upsert failed:', insertErr.message)
    // Return a client-side fallback so the UI still works
    return profileData
  }

  return created
}


export function isAdmin(profile) {
  return ['admin', 'moderator', 'editor'].includes(profile?.role)
}

export async function updateProfile(userId, updates) {
  const { error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
  if (error) throw error
}

/**
 * Syncs local XP data to Supabase profile.
 * Only should be called once after login if local data exists.
 */
export async function syncLocalProgress(userId) {
  const localXP = JSON.parse(localStorage.getItem('geoquiz_xp') || '{}')
  const localPlayer = localStorage.getItem('geoquiz_player')
  const localAvatar = localStorage.getItem('geoquiz_avatar')

  if (!localXP.totalXP && !localPlayer) return // Nothing to sync

  const updates = {
    total_xp: localXP.totalXP || 0,
    streak_days: localXP.streakDays || 0,
    level: Math.floor((localXP.totalXP || 0) / 500) + 1,
    username: localPlayer || undefined,
    avatar_url: localAvatar || undefined,
    achievements: localXP.badges || [],
  }

  // Filter out undefined
  Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key])

  const { error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
  
  if (!error) {
    // Optionally clear local data or mark as synced
    localStorage.setItem('geoquiz_synced', 'true')
  }
}

// ---- Profile Image Upload ----
export async function uploadProfileImage(userId, file) {
  if (!supabase) throw new Error('Supabase not configured')
  const ext = file.name.split('.').pop()
  const path = `avatars/${userId}_${Date.now()}.${ext}`
  const { error: uploadErr } = await supabase.storage.from('media').upload(path, file, { upsert: true })
  if (uploadErr) throw uploadErr
  const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path)
  // Update profile with the new image URL
  await updateProfile(userId, { avatar_url: publicUrl })
  return publicUrl
}

// ---- Business Listing Image Upload ----
export async function uploadBusinessFile(file, prefix = 'photo') {
  if (!supabase) throw new Error('Supabase not configured')
  const ext = file.name.split('.').pop()
  const path = `business/${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error: uploadErr } = await supabase.storage.from('media').upload(path, file, { upsert: true })
  if (uploadErr) throw uploadErr
  const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(path)
  return publicUrl
}

// ---- Favorites / Saved Places ----
export async function getFavorites(userId) {
  if (!supabase) {
    return JSON.parse(localStorage.getItem('wanda_favorites') || '[]')
  }
  const { data, error } = await supabase
    .from('saved_listings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) {
    // Table might not exist yet
    if (error.code === '42P01') return []
    throw error
  }
  return data || []
}

export async function toggleFavorite(userId, listingId, listingData = {}) {
  if (!supabase) {
    const favs = JSON.parse(localStorage.getItem('wanda_favorites') || '[]')
    const idx = favs.findIndex(f => f.listing_id === listingId)
    if (idx >= 0) {
      favs.splice(idx, 1)
    } else {
      favs.push({ listing_id: listingId, ...listingData, created_at: new Date().toISOString() })
    }
    localStorage.setItem('wanda_favorites', JSON.stringify(favs))
    return { saved: idx < 0 }
  }
  // Check if already saved
  const { data: existing } = await supabase
    .from('saved_listings')
    .select('id')
    .eq('user_id', userId)
    .eq('listing_id', listingId)
    .maybeSingle()
  
  if (existing) {
    await supabase.from('saved_listings').delete().eq('id', existing.id)
    return { saved: false }
  } else {
    const { error } = await supabase.from('saved_listings').insert({
      user_id: userId,
      listing_id: listingId,
      listing_name: listingData.name || '',
      listing_category: listingData.category || '',
      listing_area: listingData.area || '',
      listing_photo: listingData.photo || '',
    })
    if (error) throw error
    return { saved: true }
  }
}

export async function isFavorited(userId, listingId) {
  if (!supabase) {
    const favs = JSON.parse(localStorage.getItem('wanda_favorites') || '[]')
    return favs.some(f => f.listing_id === listingId)
  }
  const { data } = await supabase
    .from('saved_listings')
    .select('id')
    .eq('user_id', userId)
    .eq('listing_id', listingId)
    .maybeSingle()
  return !!data
}

// ---- User Preferences ----
export async function updatePreferences(userId, preferences) {
  return updateProfile(userId, { preferences })
}
