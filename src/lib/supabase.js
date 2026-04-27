import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// ---- Waitlist ----
export async function submitWaitlist({ name, email, role, message }) {
  if (!supabase) {
    const existing = JSON.parse(localStorage.getItem('geoquiz_waitlist') || '[]')
    existing.push({ name, email, role, message, created_at: new Date().toISOString() })
    localStorage.setItem('geoquiz_waitlist', JSON.stringify(existing))
    return { success: true, fallback: true }
  }
  const { error } = await supabase.from('waitlist').insert([{ name, email, role, message }])
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
export async function submitScore({ playerName, score, maxScore, questionCount, categories, difficulty }) {
  if (!supabase) {
    // Fallback to localStorage
    const existing = JSON.parse(localStorage.getItem('geoquiz_leaderboard') || '[]')
    existing.push({
      player_name: playerName, score, max_score: maxScore,
      question_count: questionCount, categories, difficulty,
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
