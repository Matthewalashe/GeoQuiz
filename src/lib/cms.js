/**
 * CMS Data Layer — Fetches content from Supabase with hardcoded fallback
 * Drop-in replacement for direct data imports
 */
import { supabase } from './supabase.js'

// In-memory cache
const cache = {}
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

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
    const { data, error } = await supabase.from('cms_listings').select('*').eq('status', 'published').order('name')
    if (error) throw error
    if (data?.length) { setCache('listings', data); return data }
  } catch (e) { console.warn('CMS listings fallback:', e.message) }
  const { LISTINGS } = await import('../data/listings.jsx')
  return LISTINGS
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
    const { data, error } = await supabase.from('cms_deals').select('*').eq('status', 'published').order('created_at', { ascending: false })
    if (error) throw error
    if (data?.length) {
      // Map DB shape to frontend shape
      const mapped = data.map(d => ({
        ...d,
        coords: { lat: parseFloat(d.lat), lng: parseFloat(d.lng) },
        questUnlock: d.quest_unlock,
        categoryLabel: d.category_label,
      }))
      setCache('deals', mapped)
      return mapped
    }
  } catch (e) { console.warn('CMS deals fallback:', e.message) }
  const { DEALS } = await import('../data/deals.js')
  return DEALS
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
    const { data, error } = await supabase.from('cms_sponsors').select('*').eq('status', 'published').eq('active', true)
    if (error) throw error
    if (data?.length) {
      const mapped = data.map(s => ({ ...s, questionIds: s.question_ids }))
      setCache('sponsors', mapped)
      return mapped
    }
  } catch (e) { console.warn('CMS sponsors fallback:', e.message) }
  const { SPONSORS } = await import('../data/sponsors.js')
  return SPONSORS
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
    const { data, error } = await supabase.from('cms_discovery').select('*').eq('status', 'published').order('name')
    if (error) throw error
    if (data?.length) {
      const mapped = data.map(d => ({
        ...d,
        lat: parseFloat(d.lat),
        lng: parseFloat(d.lng),
        rating: parseFloat(d.rating),
        mapUrl: d.map_url,
      }))
      setCache('discovery', mapped)
      return mapped
    }
  } catch (e) { console.warn('CMS discovery fallback:', e.message) }
  const { DISCOVERY_POIS } = await import('../data/discovery.js')
  return DISCOVERY_POIS
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
    const { data, error } = await supabase.from('cms_questions').select('*').eq('status', 'published')
    if (error) throw error
    if (data?.length) {
      const mapped = data.map(q => ({
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
    }
  } catch (e) { console.warn('CMS questions fallback:', e.message) }
  const Q = (await import('../data/questions.js')).default
  return Q
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
  let query = supabase.from(table).select('*').order('created_at', { ascending: false })
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
  return data
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
}

// ---- File Upload ----
export async function uploadFile(file, folder = 'images') {
  if (!supabase) throw new Error('No Supabase connection')
  const ext = file.name.split('.').pop()
  const name = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2,8)}.${ext}`
  const { error } = await supabase.storage.from('cms-uploads').upload(name, file)
  if (error) throw error
  const { data: { publicUrl } } = supabase.storage.from('cms-uploads').getPublicUrl(name)
  return publicUrl
}
