import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// ---- Waitlist ----
export async function submitWaitlist({ name, email, role, message, referral }) {
  if (!supabase) {
    const existing = JSON.parse(localStorage.getItem('geoquiz_waitlist') || '[]')
    existing.push({ name, email, role, message, referral, created_at: new Date().toISOString() })
    localStorage.setItem('geoquiz_waitlist', JSON.stringify(existing))
    return { success: true, fallback: true }
  }
  const { error } = await supabase.from('waitlist').insert([{ name, email, role, message, referral }])
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
export async function submitScore({ playerName, score, maxScore, questionCount, categories, difficulty, avatar }) {
  if (!supabase) {
    const existing = JSON.parse(localStorage.getItem('geoquiz_leaderboard') || '[]')
    existing.push({
      player_name: playerName, score, max_score: maxScore,
      question_count: questionCount, categories, difficulty, avatar,
      created_at: new Date().toISOString(),
    })
    existing.sort((a, b) => b.score - a.score)
    localStorage.setItem('geoquiz_leaderboard', JSON.stringify(existing.slice(0, 50)))
    return { success: true, fallback: true }
  }
  const { error } = await supabase.from('leaderboard').insert([{
    player_name: playerName,
    score,
    max_score: maxScore,
    question_count: questionCount,
    categories,
    difficulty,
    avatar,
  }])
  if (error) throw error
  return { success: true }
}

export async function fetchLeaderboard(limit = 20) {
  if (!supabase) {
    const data = JSON.parse(localStorage.getItem('geoquiz_leaderboard') || '[]')
    return data.slice(0, limit)
  }
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .order('score', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
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
