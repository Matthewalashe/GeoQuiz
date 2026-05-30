/**
 * CMS Data Layer — Fetches content from Supabase
 * All get*() functions return { data: Array, error: string|null }
 * No local fallbacks — if Supabase is unavailable, error is surfaced.
 */
import { supabase } from './supabase.js'

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
    return { data: [], error: e.message || 'Failed to load listings.' }
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
    return { data: [], error: e.message || 'Failed to load deals.' }
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
    return { data: [], error: e.message || 'Failed to load sponsors.' }
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
    return { data: [], error: e.message || 'Failed to load discoveries.' }
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
    return { data: [], error: e.message || 'Failed to load questions.' }
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
