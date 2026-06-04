/**
 * CMS Data Layer — Fetches content from Supabase
 * All get*() functions return { data: Array, error: string|null }
 * No local fallbacks — if Supabase is unavailable, error is surfaced.
 */
import { supabase } from './supabase.js'

/**
 * Convert raw fetch/Supabase errors into user-friendly messages.
 * Detects offline, DNS, timeout, and CORS issues.
 */
function friendlyError(err) {
  const msg = (err?.message || String(err)).toLowerCase()
  if (!navigator.onLine || msg.includes('failed to fetch') || msg.includes('networkerror') || msg.includes('network request failed') || msg.includes('load failed') || msg.includes('dns'))
    return 'No internet connection. Connect to Wi-Fi and try again.'
  if (msg.includes('timeout') || msg.includes('timed out'))
    return 'Connection timed out. Please check your internet and try again.'
  if (msg.includes('cors') || msg.includes('blocked'))
    return 'Connection blocked. Please try again later.'
  return err?.message || 'Something went wrong. Please try again.'
}

// In-memory cache with short TTL so admin edits propagate fast
const cache = {}
const CACHE_TTL = 30 * 1000 // 30 seconds

export function parseStringArray(val) {
  if (!val) return []
  if (Array.isArray(val)) return val
  if (typeof val === 'string') {
    const trimmed = val.trim()
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try { return JSON.parse(trimmed) } catch (e) {}
    }
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      return trimmed
        .slice(1, -1)
        .split(',')
        .map(s => s.trim().replace(/^"|"$/g, '').replace(/\\"/g, '"'))
        .filter(Boolean)
    }
    if (trimmed.includes(',')) {
      return trimmed.split(',').map(s => s.trim()).filter(Boolean)
    }
    return [trimmed]
  }
  return []
}

function cached(key) {
  const entry = cache[key]
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.result
  return null
}
function setCache(key, result) {
  cache[key] = { result, ts: Date.now() }
}
export function clearCache(key) {
  if (key) delete cache[key]
  else Object.keys(cache).forEach(k => delete cache[k])
  // Broadcast cache-clear to other tabs so edits reflect everywhere
  try { localStorage.setItem('cms_cache_bust', Date.now().toString()) } catch {}
}
// Listen for cross-tab cache-clear events
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'cms_cache_bust') {
      Object.keys(cache).forEach(k => delete cache[k])
    }
  })
}

const PRICE_MIN_MAP = {
  '₦': 1000,
  '₦₦': 5000,
  '₦₦₦': 15000,
  '₦₦₦₦': 30000,
  '₦ Budget': 1000,
  '₦₦ Mid-range': 5000,
  '₦₦₦ Premium': 15000,
  '₦₦₦₦ Luxury': 30000
}

// ---- Listings ----
export async function getListings() {
  const c = cached('listings')
  if (c) return c
  if (!supabase) {
    return { data: [], error: 'Database connection unavailable.' }
  }
  try {
    const { data, error } = await supabase
      .from('cms_listings')
      .select('*')
      .eq('status', 'published')
      .order('name')
    if (error) throw error
    const mapped = (data || []).map(d => {
      let pMin = d.price_min ? parseInt(d.price_min, 10) : null
      if (pMin === null && d.price_range) {
        pMin = PRICE_MIN_MAP[d.price_range] || null
      }
      return {
        ...d,
        priceRange: d.price_range,
        price_min: pMin,
        price_max: d.price_max ? parseInt(d.price_max, 10) : null,
        lat: d.lat ? parseFloat(d.lat) : null,
        lng: d.lng ? parseFloat(d.lng) : null,
        rating: d.rating ? parseFloat(d.rating) : 5.0,
        photos: parseStringArray(d.photos),
        tags: parseStringArray(d.tags),
      }
    })
    const result = { data: mapped, error: null }
    setCache('listings', result)
    return result
  } catch (e) {
    console.warn('CMS listings fetch error:', e.message)
    return { data: [], error: friendlyError(e) || 'Failed to load listings.' }
  }
}

// ---- Deals ----
export async function getDeals() {
  const c = cached('deals')
  if (c) return c
  if (!supabase) {
    return { data: [], error: 'Database connection unavailable.' }
  }
  try {
    const { data, error } = await supabase
      .from('cms_deals')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
    if (error) throw error
    const mapped = (data || []).map(d => ({
      ...d,
      coords: { lat: parseFloat(d.lat), lng: parseFloat(d.lng) },
      questUnlock: d.quest_unlock,
      categoryLabel: d.category_label,
    }))
    const result = { data: mapped, error: null }
    setCache('deals', result)
    return result
  } catch (e) {
    console.warn('CMS deals fetch error:', e.message)
    return { data: [], error: friendlyError(e) || 'Failed to load deals.' }
  }
}

// ---- Sponsors ----
export async function getSponsors() {
  const c = cached('sponsors')
  if (c) return c
  if (!supabase) {
    return { data: [], error: 'Database connection unavailable.' }
  }
  try {
    const { data, error } = await supabase
      .from('cms_sponsors')
      .select('*')
      .eq('status', 'published')
      .eq('active', true)
    if (error) throw error
    const mapped = (data || []).map(s => ({ ...s, questionIds: s.question_ids }))
    const result = { data: mapped, error: null }
    setCache('sponsors', result)
    return result
  } catch (e) {
    console.warn('CMS sponsors fetch error:', e.message)
    return { data: [], error: friendlyError(e) || 'Failed to load sponsors.' }
  }
}

// ---- Discovery POIs ----
export async function getDiscoveryPOIs() {
  const c = cached('discovery')
  if (c) return c
  if (!supabase) {
    return { data: [], error: 'Database connection unavailable.' }
  }
  try {
    const { data, error } = await supabase
      .from('cms_discovery')
      .select('*')
      .eq('status', 'published')
      .order('name')
    if (error) throw error
    const mapped = (data || []).map(d => ({
      ...d,
      lat: d.lat ? parseFloat(d.lat) : null,
      lng: d.lng ? parseFloat(d.lng) : null,
      rating: d.rating ? parseFloat(d.rating) : 5.0,
      mapUrl: d.map_url,
    }))
    const result = { data: mapped, error: null }
    setCache('discovery', result)
    return result
  } catch (e) {
    console.warn('CMS discovery fetch error:', e.message)
    return { data: [], error: friendlyError(e) || 'Failed to load discoveries.' }
  }
}

// ---- Questions ----
export async function getQuestions() {
  const c = cached('questions')
  if (c) return c
  if (!supabase) {
    return { data: [], error: 'Database connection unavailable.' }
  }
  try {
    const { data, error } = await supabase
      .from('cms_questions')
      .select('*')
      .eq('status', 'published')
    if (error) throw error
    const mapped = (data || []).map(q => ({
      id: q.id,
      category: q.category,
      categoryLabel: q.category_label,
      difficulty: q.difficulty,
      region: q.region,
      question: q.question,
      hint: q.hint,
      answer: {
        lat: parseFloat(q.answer_lat),
        lng: parseFloat(q.answer_lng),
        name: q.answer_name,
        description: q.answer_description,
      },
      funFact: q.fun_fact,
    }))
    const result = { data: mapped, error: null }
    setCache('questions', result)
    return result
  } catch (e) {
    console.warn('CMS questions fetch error:', e.message)
    return { data: [], error: friendlyError(e) || 'Failed to load questions.' }
  }
}

// ---- Site Config ----
export async function getConfig(key) {
  if (!supabase) return null
  try {
    const { data } = await supabase.from('cms_config').select('value').eq('key', key).single()
    return data?.value ?? null
  } catch { return null }
}

// ══════════════════════════════════════════════════════════════
// P3 — Game Content Fetchers
// ══════════════════════════════════════════════════════════════

// ---- Trivia Packs ----
export async function getTriviaPacks() {
  const c = cached('trivia_packs')
  if (c) return c
  if (!supabase) return { data: {}, error: 'Database connection unavailable.' }
  try {
    const { data, error } = await supabase
      .from('cms_trivia_packs')
      .select('*')
      .order('sort_order')
    if (error) throw error
    // Group by pack_id into { lagos: {id, label, desc, color, questions: [...]}, ... }
    const packs = {}
    for (const row of (data || [])) {
      if (!packs[row.pack_id]) {
        packs[row.pack_id] = {
          id: row.pack_id,
          label: row.label,
          desc: row.description,
          color: row.color,
          questions: [],
        }
      }
      packs[row.pack_id].questions.push({
        q: row.question,
        options: row.options,
        ans: row.answer_index,
        fact: row.fact,
      })
    }
    const result = { data: packs, error: null }
    setCache('trivia_packs', result)
    return result
  } catch (e) {
    console.warn('CMS trivia fetch error:', e.message)
    return { data: {}, error: friendlyError(e) || 'Failed to load trivia packs.' }
  }
}

// ---- Crossword Puzzles ----
export async function getCrosswords() {
  const c = cached('crosswords')
  if (c) return c
  if (!supabase) return { data: [], error: 'Database connection unavailable.' }
  try {
    const { data, error } = await supabase
      .from('cms_crosswords')
      .select('*')
      .order('sort_order')
    if (error) throw error
    const mapped = (data || []).map(p => ({
      id: p.puzzle_id,
      label: p.label,
      desc: p.description,
      color: p.color,
      size: p.grid_size,
      across: p.across,
      down: p.down,
    }))
    const result = { data: mapped, error: null }
    setCache('crosswords', result)
    return result
  } catch (e) {
    console.warn('CMS crosswords fetch error:', e.message)
    return { data: [], error: friendlyError(e) || 'Failed to load crosswords.' }
  }
}

// ---- Word Game ----
export async function getWordGame() {
  const c = cached('wordgame')
  if (c) return c
  if (!supabase) return { data: [], error: 'Database connection unavailable.' }
  try {
    const { data, error } = await supabase
      .from('cms_wordgame')
      .select('*')
      .order('sort_order')
    if (error) throw error
    const mapped = (data || []).map(w => ({
      id: w.word_id,
      word: w.word,
      clue: w.clue,
      category: w.category,
      image: w.image,
      description: w.description,
      history: w.history || [],
      footnotes: w.footnotes || [],
    }))
    const result = { data: mapped, error: null }
    setCache('wordgame', result)
    return result
  } catch (e) {
    console.warn('CMS wordgame fetch error:', e.message)
    return { data: [], error: friendlyError(e) || 'Failed to load word game data.' }
  }
}

// ---- Postcards ----
export async function getPostcards() {
  const c = cached('postcards')
  if (c) return c
  if (!supabase) return { data: [], error: 'Database connection unavailable.' }
  try {
    const { data, error } = await supabase
      .from('cms_postcards')
      .select('*')
      .order('sort_order')
    if (error) throw error
    const mapped = (data || []).map(p => ({
      id: p.postcard_id,
      image: p.image,
      question: p.question,
      options: p.options,
      correct: p.correct_index,
      category: p.category,
      fact: p.fact,
      pack: p.pack,
    }))
    const result = { data: mapped, error: null }
    setCache('postcards', result)
    return result
  } catch (e) {
    console.warn('CMS postcards fetch error:', e.message)
    return { data: [], error: friendlyError(e) || 'Failed to load postcards.' }
  }
}

// ---- Puzzle Images ----
export async function getPuzzleImages() {
  const c = cached('puzzles')
  if (c) return c
  if (!supabase) return { data: [], error: 'Database connection unavailable.' }
  try {
    const { data, error } = await supabase
      .from('cms_puzzles')
      .select('*')
      .order('sort_order')
    if (error) throw error
    const mapped = (data || []).map(p => ({
      id: p.puzzle_id,
      label: p.label,
      src: p.image,
      difficulty: p.difficulty,
    }))
    const result = { data: mapped, error: null }
    setCache('puzzles', result)
    return result
  } catch (e) {
    console.warn('CMS puzzles fetch error:', e.message)
    return { data: [], error: friendlyError(e) || 'Failed to load puzzle images.' }
  }
}

// ---- Adventures ----
export async function getAdventures() {
  const c = cached('adventures')
  if (c) return c
  if (!supabase) return { data: {}, error: 'Database connection unavailable.' }
  try {
    const { data, error } = await supabase
      .from('cms_adventures')
      .select('*')
      .order('sort_order')
    if (error) throw error
    // Build keyed object: { commute: {id, title, desc, color, start, nodes}, ... }
    const stories = {}
    for (const s of (data || [])) {
      stories[s.story_id] = {
        id: s.story_id,
        title: s.title,
        desc: s.description,
        color: s.color,
        start: s.start_node,
        nodes: s.nodes,
      }
    }
    const result = { data: stories, error: null }
    setCache('adventures', result)
    return result
  } catch (e) {
    console.warn('CMS adventures fetch error:', e.message)
    return { data: {}, error: friendlyError(e) || 'Failed to load adventures.' }
  }
}

// ---- Campaign (Story Mode) ----
export async function getCampaign() {
  const c = cached('campaign')
  if (c) return c
  if (!supabase) return { data: [], error: 'Database connection unavailable.' }
  try {
    const { data, error } = await supabase
      .from('cms_campaign')
      .select('*')
      .order('sort_order')
    if (error) throw error
    const mapped = (data || []).map(ch => ({
      id: ch.chapter_id,
      week: ch.week,
      title: ch.title,
      subtitle: ch.subtitle,
      icon: ch.icon,
      color: ch.color,
      badge: ch.badge,
      badgeEmoji: ch.badge_emoji,
      intro: ch.intro,
      categoryFilter: ch.category_filter,
      questionCount: ch.question_count,
      stages: ch.stages || [],
      facts: ch.facts || [],
    }))
    const result = { data: mapped, error: null }
    setCache('campaign', result)
    return result
  } catch (e) {
    console.warn('CMS campaign fetch error:', e.message)
    return { data: [], error: friendlyError(e) || 'Failed to load campaign data.' }
  }
}

// ---- Coloring Scenes ----
export async function getColoringScenes() {
  const c = cached('coloring')
  if (c) return c
  if (!supabase) return { data: [], error: 'Database connection unavailable.' }
  try {
    const { data, error } = await supabase
      .from('cms_coloring')
      .select('*')
      .order('sort_order')
    if (error) throw error
    const mapped = (data || []).map(s => ({
      id: s.scene_id,
      title: s.title,
      desc: s.description,
      color: s.color,
      minParts: s.min_parts,
      guide: s.guide || {},
      parts: s.parts || [],
      svgKey: s.svg_key,
    }))
    const result = { data: mapped, error: null }
    setCache('coloring', result)
    return result
  } catch (e) {
    console.warn('CMS coloring fetch error:', e.message)
    return { data: [], error: friendlyError(e) || 'Failed to load coloring scenes.' }
  }
}

// ---- Admin: CRUD operations ----
export async function adminFetch(table, filters = {}) {
  if (!supabase) {
    throw new Error('Database connection unavailable. Cannot load admin data.')
  }
  let query = supabase.from(table).select('*')
  if (table === 'cms_config') {
    query = query.order('key')
  } else {
    query = query.order('created_at', { ascending: false })
  }
  if (filters.status) query = query.eq('status', filters.status)
  if (filters.category) query = query.eq('category', filters.category)
  const { data, error } = await query
  if (error) {
    if (error.code === '42P01') {
      throw new Error(`Table "${table}" does not exist. Please run the database migration first.`)
    }
    throw error
  }
  if (data && data.length > 0) {
    return data.map(d => {
      const mapped = { ...d }
      if ('photos' in mapped) mapped.photos = parseStringArray(mapped.photos)
      if ('tags' in mapped) mapped.tags = parseStringArray(mapped.tags)
      // For cms_discovery: ensure 'photos' is populated from 'images' if empty
      if (table === 'cms_discovery') {
        if ('images' in mapped) mapped.images = parseStringArray(mapped.images)
        if ((!mapped.photos || mapped.photos.length === 0) && mapped.images && mapped.images.length > 0) {
          mapped.photos = mapped.images
        }
      }
      return mapped
    })
  }
  return data || []
}

export async function adminUpsert(table, record) {
  if (!supabase) throw new Error('No Supabase connection')
  const { data, error } = await supabase.from(table).upsert(record).select().single()
  if (error) throw error
  clearCache()
  const mapped = { ...data }
  if ('photos' in mapped) mapped.photos = parseStringArray(mapped.photos)
  if ('tags' in mapped) mapped.tags = parseStringArray(mapped.tags)
  return mapped
}

export async function adminDelete(table, id) {
  if (!supabase) throw new Error('No Supabase connection')
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) throw error
  clearCache()
}

export async function adminUpdateConfig(key, value, userId) {
  if (!supabase) throw new Error('No Supabase connection')
  const { error } = await supabase.from('cms_config').upsert({
    key, value, updated_by: userId, updated_at: new Date().toISOString()
  })
  if (error) throw error
  clearCache()
}

// ---- File Upload ----
export async function uploadFile(file, folder = 'images') {
  if (!supabase) throw new Error('No Supabase connection')
  const ext = file.name.split('.').pop()
  const name = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2,8)}.${ext}`
  const { error } = await supabase.storage.from('media').upload(name, file)
  if (error) throw error
  const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(name)
  return publicUrl
}
