/**
 * CMS Data Layer — Fetches content from Supabase with hardcoded fallback
 * Drop-in replacement for direct data imports
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
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data
  return null
}
function setCache(key, data) {
  cache[key] = { data, ts: Date.now() }
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
    const { LISTINGS } = await import('../data/listings.jsx')
    return LISTINGS
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
    setCache('listings', mapped)
    return mapped
  } catch (e) {
    console.warn('CMS listings fetch error:', e.message)
    return []
  }
}

// ---- Deals ----
export async function getDeals() {
  const c = cached('deals')
  if (c) return c
  if (!supabase) {
    const { DEALS } = await import('../data/deals.js')
    return DEALS
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
    setCache('deals', mapped)
    return mapped
  } catch (e) {
    console.warn('CMS deals fetch error:', e.message)
    return []
  }
}

// ---- Sponsors ----
export async function getSponsors() {
  const c = cached('sponsors')
  if (c) return c
  if (!supabase) {
    const { SPONSORS } = await import('../data/sponsors.js')
    return SPONSORS
  }
  try {
    const { data, error } = await supabase
      .from('cms_sponsors')
      .select('*')
      .eq('status', 'published')
      .eq('active', true)
    if (error) throw error
    const mapped = (data || []).map(s => ({ ...s, questionIds: s.question_ids }))
    setCache('sponsors', mapped)
    return mapped
  } catch (e) {
    console.warn('CMS sponsors fetch error:', e.message)
    return []
  }
}

// ---- Discovery POIs ----
export async function getDiscoveryPOIs() {
  const c = cached('discovery')
  if (c) return c
  if (!supabase) {
    const { DISCOVERY_POIS } = await import('../data/discovery.js')
    return DISCOVERY_POIS
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
    setCache('discovery', mapped)
    return mapped
  } catch (e) {
    console.warn('CMS discovery fetch error:', e.message)
    return []
  }
}

// ---- Questions ----
export async function getQuestions() {
  const c = cached('questions')
  if (c) return c
  if (!supabase) {
    const Q = (await import('../data/questions.js')).default
    return Q
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
    setCache('questions', mapped)
    return mapped
  } catch (e) {
    console.warn('CMS questions fetch error:', e.message)
    return []
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
  if (!supabase) return fallbackFetch(table)
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
      console.warn(`Table ${table} not found. Falling back to local data.`)
      return fallbackFetch(table)
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

async function fallbackFetch(table) {
  if (table === 'cms_listings') {
    const { LISTINGS } = await import('../data/listings.jsx')
    return LISTINGS
  }
  if (table === 'cms_deals') {
    const { DEALS } = await import('../data/deals.js')
    return DEALS
  }
  if (table === 'cms_sponsors') {
    const { SPONSORS } = await import('../data/sponsors.js')
    return SPONSORS
  }
  if (table === 'cms_discovery') {
    const { DISCOVERY_POIS } = await import('../data/discovery.js')
    return DISCOVERY_POIS
  }
  if (table === 'cms_questions') {
    const Q = (await import('../data/questions.js')).default
    return Q
  }
  return []
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

